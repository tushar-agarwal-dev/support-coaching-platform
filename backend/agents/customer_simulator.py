import logging
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from backend.agents.llm import get_llm

logger = logging.getLogger(__name__)

class CustomerResponseSchema(BaseModel):
    message: str = Field(..., description="The response message spoken by the customer back to the agent.")
    current_mood: str = Field(..., description="The customer's updated mood state (e.g. angry, calm, confused, satisfied, frustrated).")
    frustration_score: float = Field(..., description="Customer's current frustration score on a scale from 0.0 to 10.0.")
    escalation_level: int = Field(..., description="Customer's current escalation level: 0 (none), 1 (demanding manager), 2 (cancellation / legal threat).")

# Setup LLM chain
llm = get_llm()
structured_llm = llm.with_structured_output(CustomerResponseSchema)

prompt = ChatPromptTemplate.from_messages([
    ("system", (
        "You are simulating a realistic customer interacting with a support agent.\n"
        "Generate the next response in character based on the following attributes:\n"
        " - Industry: {industry}\n"
        " - Product: {product}\n"
        " - Issue Type: {issue_type}\n"
        " - Difficulty Level: {difficulty}\n"
        " - Customer Persona: {persona}\n"
        " - Initial/Current Mood: {mood}\n"
        " - Current Frustration Score: {frustration_score}\n"
        " - Escalation Level: {escalation_level}\n\n"
        
        "RULES FOR EMOTIONAL EVOLUTION:\n"
        " 1. EASY difficulty: Customer is cooperative. They become satisfied (lower frustration, calmer mood) quickly if the agent is polite and attempts to help.\n"
        " 2. MEDIUM difficulty: Evolve mood normally. Customer responds well to constructive assistance but gets frustrated by delays or generic templates.\n"
        " 3. HARD difficulty: Customer is extremely stubborn. They become increasingly irritated, hostile, or demanding unless the agent handles them with extreme care and accuracy.\n"
        " 4. Persona adaptation: Angry customers express frustration or make direct demands, but always write using normal sentence casing (do not write in all-capital letters). Impatient customers demand fast solutions. Confused customers ask repetitive questions. Scammers try to deflect or pressure. VIPs demand instant overrides.\n\n"
        
        "Respond strictly in structured JSON."
    )),
    ("user", "Conversation History:\n{history}\n\nLatest Agent response: {latest_agent_message}\nGenerate customer response:")
])

def generate_customer_response(session_config: dict, history: list, latest_agent_msg: str, current_mood: str, frustration_score: float, escalation_level: int) -> CustomerResponseSchema:
    """Generates next customer message with updated mood, frustration, and escalation level."""
    logger.info("Generating simulated customer response...")
    
    # Format history string
    history_str = ""
    for msg in history[-8:]:
        history_str += f"{msg['role']}: {msg['content']}\n"
        
    try:
        formatted_messages = prompt.format_messages(
            industry=session_config.get("industry", "General"),
            product=session_config.get("product", "General Product"),
            issue_type=session_config.get("issue_type", "General Issue"),
            difficulty=session_config.get("difficulty", "medium"),
            persona=session_config.get("customer_persona", "Calm Customer"),
            mood=current_mood,
            frustration_score=str(frustration_score),
            escalation_level=str(escalation_level),
            history=history_str,
            latest_agent_message=latest_agent_msg
        )
        response = structured_llm.invoke(formatted_messages)
        return response
    except Exception as e:
        logger.error(f"Error generating customer response: {e}", exc_info=True)
        # Dynamic, progressive fallback messages to prevent repetitive replies when LLM is unavailable
        product = session_config.get("product", "service")
        issue = session_config.get("issue_type", "problem")
        
        fallback_replies = [
            f"Hi, I'm calling because my {product} has a {issue} issue. Can you help me resolve this?",
            f"I understand you are checking, but this {product} issue is disrupting my work. What is the status?",
            f"I have already tried restarting it, but the {issue} persists. Is there a workaround?",
            f"This is taking too long. I would like to request a manager escalation or a refund for my {product}.",
            "I'm very frustrated. Please connect me to your supervisor immediately."
        ]
        
        # Advance the reply slot according to current conversation length (history size)
        turn_index = min(len(history) // 2, len(fallback_replies) - 1)
        selected_reply = fallback_replies[turn_index]
        
        return CustomerResponseSchema(
            message=selected_reply,
            current_mood="frustrated" if turn_index > 0 else "neutral",
            frustration_score=min(10.0, frustration_score + 1.0) if turn_index > 0 else frustration_score,
            escalation_level=min(2, escalation_level + (1 if turn_index > 2 else 0))
        )
