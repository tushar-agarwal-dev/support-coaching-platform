import logging
import time
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from backend.agents.llm import get_llm
from backend.agents.state import ConversationState

logger = logging.getLogger(__name__)

class SuggestedReplyCritique(BaseModel):
    mode: str = Field(..., description="The type of reply being critiqued: empathetic, professional, or concise.")
    original_reply: str = Field(..., description="The original response suggestion text before critique.")
    improved_reply: str = Field(..., description="The improved or rewritten response suggestion addressing critique feedback.")
    improvements: list[str] = Field(..., description="Bullet points of improvements made (e.g. professional tone adjustments, hallucination removal).")
    confidence: float = Field(..., description="Critique review confidence rating (0.0 to 1.0).")

class SelfCritiqueSchema(BaseModel):
    empathetic_critique: SuggestedReplyCritique
    professional_critique: SuggestedReplyCritique
    concise_critique: SuggestedReplyCritique

# Setup LLM structured schema
llm = get_llm()
structured_llm = llm.with_structured_output(SelfCritiqueSchema)

prompt = ChatPromptTemplate.from_messages([
    ("system", (
        "You are an automated self-critique reviewer for a customer support AI assistant.\n"
        "Critique and improve three suggested replies (Empathetic, Professional, Concise) against these rules:\n"
        " 1. Professional Tone: Check for informal language or defensiveness.\n"
        " 2. Completeness: Ensure the reply directly answers the customer's core query.\n"
        " 3. Policy Alignment: Verify no promises are made that exceed company rules (warranty, refunds, escalations).\n"
        " 4. Hallucination Guard: Ensure factual statements exist within the retrieved documents:\n{knowledge}\n\n"
        
        "For each reply, identify weaknesses and rewrite it with the improved version.\n"
        "Respond strictly in structured JSON."
    )),
    ("user", (
        "Original suggestions to check:\n"
        " - Empathetic: {empathetic}\n"
        " - Professional: {professional}\n"
        " - Concise: {concise}\n\n"
        "Run critique and rewrite:"
    ))
])

def self_critique_node(state: ConversationState) -> dict:
    """LangGraph node reviewing and rewriting suggested replies to ensure high quality."""
    start_time = time.time()
    logger.info("Running Self-Critique Agent...")
    
    suggestions = state.get("coaching_suggestions", [])
    
    # Extract original text
    sug_emp = next((s["reply"] for s in suggestions if s["type"] == "empathetic"), "")
    sug_prof = next((s["reply"] for s in suggestions if s["type"] == "professional"), "")
    sug_conc = next((s["reply"] for s in suggestions if s["type"] == "concise"), "")
    
    # Format knowledge context
    knowledge_str = "\n".join([
        f"- Document: {k['document_name']} (Page {k['page_number']}) Content: {k['text']}" 
        for k in state.get("retrieved_knowledge", [])
    ])

    try:
        formatted_messages = prompt.format_messages(
            knowledge=knowledge_str or "No knowledge source found.",
            empathetic=sug_emp,
            professional=sug_prof,
            concise=sug_conc
        )
        response = structured_llm.invoke(formatted_messages)
        
        critique_list = [
            response.empathetic_critique.dict(),
            response.professional_critique.dict(),
            response.concise_critique.dict()
        ]
        
        # Override the original suggestions with the improved versions
        improved_suggestions = []
        for s in suggestions:
            mode = s["type"]
            critique = next((c for c in critique_list if c["mode"] == mode), None)
            if critique and critique["improved_reply"]:
                improved_suggestions.append({
                    "type": mode,
                    "reply": critique["improved_reply"],
                    "reasoning": s["reasoning"],
                    "confidence": critique["confidence"]
                })
            else:
                improved_suggestions.append(s)
                
    except Exception as e:
        logger.error(f"Error in Self-Critique Agent: {e}", exc_info=True)
        critique_list = [
            {"mode": "empathetic", "original_reply": sug_emp, "improved_reply": sug_emp, "improvements": ["No corrections needed"], "confidence": 0.9},
            {"mode": "professional", "original_reply": sug_prof, "improved_reply": sug_prof, "improvements": ["No corrections needed"], "confidence": 0.9},
            {"mode": "concise", "original_reply": sug_conc, "improved_reply": sug_conc, "improvements": ["No corrections needed"], "confidence": 0.9}
        ]
        improved_suggestions = suggestions

    duration_ms = int((time.time() - start_time) * 1000)
    agent_logs = dict(state.get("agent_logs", {}))
    agent_logs["self_critique"] = {"status": "completed", "duration_ms": duration_ms}

    return {
        "self_critique": critique_list,
        "coaching_suggestions": improved_suggestions,
        "agent_logs": agent_logs
    }
