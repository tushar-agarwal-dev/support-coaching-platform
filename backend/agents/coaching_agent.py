import logging
import time
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from backend.agents.llm import get_llm
from backend.agents.state import ConversationState

logger = logging.getLogger(__name__)

class CoachingSuggestionsSchema(BaseModel):
    empathetic_reply: str = Field(..., description="An empathetic support response focusing on customer mood, apologizing sincerely, and validating frustration.")
    empathetic_reasoning: str = Field(..., description="Explanation of why the empathetic reply de-escalates or suits the situation.")
    professional_reply: str = Field(..., description="A task-focused, policy-compliant response detailing exact next steps without emotional overload.")
    professional_reasoning: str = Field(..., description="Reasoning for the professional reply structure.")
    concise_reply: str = Field(..., description="A direct, brief response (under 2 sentences) containing action items to minimize customer reading effort.")
    concise_reasoning: str = Field(..., description="Reasoning for the concise reply structure.")

# Setup LLM structured schema
llm = get_llm()
structured_llm = llm.with_structured_output(CoachingSuggestionsSchema)

prompt = ChatPromptTemplate.from_messages([
    ("system", (
        "You are an expert AI support coach advising customer service agents during live chats.\n"
        "Your task is to generate exactly three response suggestions (Empathetic, Professional, Concise) and detailed reasoning for each.\n\n"
        
        "RESPONSE STYLES DEFINITION:\n"
        " 1. Empathetic Reply: Directly acknowledges and validates the customer's emotions first. Apologizes sincerely for any distress and uses reassuring, warm phrasing.\n"
        " 2. Professional Reply: A task-focused, policy-compliant response outlining clear troubleshooting steps, next milestones, or factual answers without emotional fluff.\n"
        " 3. Concise Reply: A direct, brief response (strictly under two sentences) providing clear action items or queries, perfect for customers in a hurry.\n\n"
        
        "POLICY CONSTRAINTS:\n"
        " - Refund Policy: Purchases are only eligible for refunds within 30 days of invoice date. Billing discrepancies must be verified.\n"
        " - Warranty Policy: Covers manufacturer defects up to 1 year; accidental damage, liquid spills, or third-party repairs are excluded.\n"
        " - Escalation SOP: Direct threats of cancellation, lawsuit, or demands to speak with a manager must be routed to Tier 2 supervisors.\n\n"
        
        "RESOURCES GROUNDING:\n"
        " - Retrieved Support Manual Paragraphs:\n{knowledge}\n"
        " - Customer Intent Details: {intent}\n"
        " - Customer Sentiment state: {sentiment}\n\n"
        
        "CRITICAL RULE: Rely ONLY on the retrieved support manual paragraphs. NEVER formulate fake procedures, links, or contact numbers. Respond strictly in structured JSON."
    )),
    ("user", "Conversation History:\n{history}\n\nLatest message: {message}\nProvide coaching suggestions:")
])

def coaching_agent_node(state: ConversationState) -> dict:
    """LangGraph node generating Empathetic, Professional, and Concise reply recommendations."""
    start_time = time.time()
    logger.info("Running Coaching Suggestions Agent...")
    
    latest_msg = state.get("latest_message", {})
    message_content = latest_msg.get("content", "")
    
    # Format history and knowledge documents
    history_str = ""
    for msg in state.get("history", [])[-6:]:
        history_str += f"{msg['role']}: {msg['content']}\n"
        
    knowledge_str = "\n".join([
        f"- Document: {k['document_name']} (Page {k['page_number']}) Content: {k['text']}" 
        for k in state.get("retrieved_knowledge", [])
    ])

    try:
        formatted_messages = prompt.format_messages(
            knowledge=knowledge_str or "No knowledge source found.",
            intent=str(state.get("current_intent", {})),
            sentiment=str(state.get("sentiment", {})),
            history=history_str,
            message=message_content
        )
        response = structured_llm.invoke(formatted_messages)
        
        suggestions = [
            {"type": "empathetic", "reply": response.empathetic_reply, "reasoning": response.empathetic_reasoning, "confidence": 0.94},
            {"type": "professional", "reply": response.professional_reply, "reasoning": response.professional_reasoning, "confidence": 0.92},
            {"type": "concise", "reply": response.concise_reply, "reasoning": response.concise_reasoning, "confidence": 0.95}
        ]
    except Exception as e:
        logger.error(f"Error in Coaching Suggestions Agent: {e}", exc_info=True)
        # Safe fallback suggestions
        suggestions = [
            {"type": "empathetic", "reply": "I understand your frustration and apologize for the inconvenience. Let me look into this for you.", "reasoning": "Standard de-escalation text", "confidence": 0.8},
            {"type": "professional", "reply": "Thank you for contacting us. I am accessing your account to review the transactions now.", "reasoning": "Polite action statement", "confidence": 0.8},
            {"type": "concise", "reply": "I apologize. I am checking your account records now to resolve this.", "reasoning": "Direct and brief action", "confidence": 0.8}
        ]

    # Save latency logs for Collaboration Viewer
    duration_ms = int((time.time() - start_time) * 1000)
    agent_logs = dict(state.get("agent_logs", {}))
    agent_logs["coaching_suggestions"] = {"status": "completed", "duration_ms": duration_ms}

    return {
        "coaching_suggestions": suggestions,
        "agent_logs": agent_logs
    }
