import logging
import time
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from backend.agents.llm import get_llm
from backend.agents.state import ConversationState

logger = logging.getLogger(__name__)

class IntentDetectionSchema(BaseModel):
    primary_intent: str = Field(..., description="The main intent of the customer (e.g. Refund Request, Cancellation, Warranty Claim, Password Reset).")
    secondary_intent: str = Field(..., description="Sub-intent or supporting intent if any, otherwise return 'None'.")
    urgency: str = Field(..., description="Classification of urgency: low, medium, high, or critical.")
    category: str = Field(..., description="The department category of the issue (e.g. billing, technical, shipping, general).")
    confidence_score: float = Field(..., description="Confidence rating between 0.0 and 1.0.")

# Setup LLM chain
llm = get_llm()
structured_llm = llm.with_structured_output(IntentDetectionSchema)

prompt = ChatPromptTemplate.from_messages([
    ("system", (
        "You are an expert intent classification system for an enterprise support platform.\n"
        "Your task is to analyze the latest customer message and the preceding conversation history to determine their primary and secondary goals.\n\n"
        "CLASSIFICATION TAXONOMY:\n"
        " - Refund Request: Customer wants money back for products or services.\n"
        " - Cancellation: Customer wants to terminate subscriptions, trials, or contract accounts.\n"
        " - Warranty Claim: Customer reports hardware/software defects seeking replacement or repairs.\n"
        " - Technical Support: API connection errors, connection dropouts, outages, or setup bugs.\n"
        " - Billing Inquiry: Double charges, invoice collections, card update failures, or rate details.\n"
        " - General Inquiry: Simple policy lookups, greetings, status check-ins, or general feedback.\n\n"
        "INSTRUCTIONS:\n"
        " 1. Identify context clues from the conversation history to determine if a past topic is still the active primary focus.\n"
        " 2. Map secondary intents if the customer mentions multiple topics (e.g. asking to cancel because of a double charge).\n"
        " 3. Urgency rating system: 'critical' (outages, legal threats), 'high' (invoice locks, billing errors), 'medium' (standard bugs), 'low' (general questions).\n"
        " 4. Respond strictly in structured format."
    )),
    ("user", "Latest message: {message}\nConversation History:\n{history}")
])

def intent_detector_node(state: ConversationState) -> dict:
    """LangGraph node classifying primary/secondary customer intent."""
    start_time = time.time()
    logger.info("Running Intent Detector Agent...")
    latest_msg = state.get("latest_message", {})
    message_content = latest_msg.get("content", "")
    
    # Format history
    history_str = ""
    for msg in state.get("history", [])[-5:]:
        history_str += f"{msg['role']}: {msg['content']}\n"
        
    try:
        formatted_messages = prompt.format_messages(
            message=message_content,
            history=history_str
        )
        response = structured_llm.invoke(formatted_messages)
        intent_dict = response.dict()
    except Exception as e:
        logger.error(f"Error in Intent Detector Agent: {e}", exc_info=True)
        intent_dict = {
            "primary_intent": "Inquiry",
            "secondary_intent": "None",
            "urgency": "medium",
            "category": "general",
            "confidence_score": 0.5
        }

    duration_ms = int((time.time() - start_time) * 1000)
    agent_logs = dict(state.get("agent_logs", {}))
    agent_logs["intent_detector"] = {"status": "completed", "duration_ms": duration_ms}

    return {
        "current_intent": intent_dict,
        "agent_logs": agent_logs
    }
