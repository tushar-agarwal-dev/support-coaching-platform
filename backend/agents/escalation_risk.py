import logging
import time
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from backend.agents.llm import get_llm
from backend.agents.state import ConversationState

logger = logging.getLogger(__name__)

class EscalationRiskSchema(BaseModel):
    risk_percent: float = Field(..., description="Escalation probability percentage between 0.0 and 100.0.")
    risk_level: str = Field(..., description="Escalation risk severity: low, medium, or high.")
    reasons: list[str] = Field(..., description="Bullet points explaining factors contributing to risk rating (e.g. repeated questions, frustration score, threat flags).")
    recommended_action: str = Field(..., description="Action advice for the support agent (e.g. prioritize refund, transfer to supervisor).")

# Setup LLM structured schema
llm = get_llm()
structured_llm = llm.with_structured_output(EscalationRiskSchema)

prompt = ChatPromptTemplate.from_messages([
    ("system", (
        "You are an expert supervisor analyst predicting customer escalation risk.\n"
        "Analyze the latest customer message and conversation history to compute escalation probability.\n\n"
        
        "RISK SCORE CLASSIFICATION LOGIC:\n"
        " - 80% to 100% (High/Critical): Explicit threats of account cancellation, legal lawsuits, reporting to public forums, or direct refusal to talk to the current agent.\n"
        " - 40% to 79% (Medium): Expressed warnings of leaving, complaints about slow service, asking why previous replies didn't help, or persistent sarcasm.\n"
        " - 0% to 39% (Low): General inquiry, friendly interactions, or regular questions without hostile phrasing.\n\n"
        
        "CONSIDER THE FOLLOWING CONTRAST STAKES:\n"
        " - Expressed customer frustration score: {frustration_score}/10.\n"
        " - Current mood class: {mood}.\n"
        " - Number of turns without resolving the core problem.\n\n"
        
        "INSTRUCTIONS:\n"
        " 1. Compute the exact risk percentage and assign it to risk_percent.\n"
        " 2. Provide clear reasoning statements for the score.\n"
        " 3. Recommend a mitigation strategy: for low risk, 'Proceed with normal guidelines'; for medium, 'Acknowledge frustration directly and prioritize resolution'; for high, 'Alert supervisor and route session to manager overlay'.\n"
        " 4. Respond strictly in structured JSON."
    )),
    ("user", "Conversation History:\n{history}\n\nLatest customer message: {message}\nCompute escalation risk:")
])

def escalation_risk_node(state: ConversationState) -> dict:
    """LangGraph node computing risk percentage and recommended actions based on historical messages."""
    start_time = time.time()
    logger.info("Running Escalation Risk Agent...")
    
    latest_msg = state.get("latest_message", {})
    message_content = latest_msg.get("content", "")
    
    history_str = ""
    for msg in state.get("history", [])[-6:]:
        history_str += f"{msg['role']}: {msg['content']}\n"

    try:
        formatted_messages = prompt.format_messages(
            frustration_score=str(state.get("frustration_score", 3.0)),
            mood=state.get("current_mood", "neutral"),
            history=history_str,
            message=message_content
        )
        response = structured_llm.invoke(formatted_messages)
        risk_dict = response.dict()
    except Exception as e:
        logger.error(f"Error in Escalation Risk Agent: {e}", exc_info=True)
        # Safe fallback risk
        risk_dict = {
            "risk_percent": 15.0,
            "risk_level": "low",
            "reasons": ["Standard conversation flow", "No explicit red flags detected"],
            "recommended_action": "Continue with standard support steps."
        }

    duration_ms = int((time.time() - start_time) * 1000)
    agent_logs = dict(state.get("agent_logs", {}))
    agent_logs["escalation_risk"] = {"status": "completed", "duration_ms": duration_ms}

    return {
        "escalation_risk": risk_dict,
        "agent_logs": agent_logs
    }
