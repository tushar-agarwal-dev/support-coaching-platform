import logging
import time
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from backend.agents.llm import get_llm
from backend.agents.state import ConversationState

logger = logging.getLogger(__name__)

class SentimentAnalysisSchema(BaseModel):
    emotion: str = Field(..., description="The main emotion detected (e.g. angry, frustrated, confused, anxious, calm, happy).")
    frustration_score: float = Field(..., description="Numeric frustration score between 0.0 (perfectly calm) and 10.0 (maximum frustration/rage).")
    satisfaction_trend: str = Field(..., description="Trend direction: 'increasing', 'decreasing', or 'stable'.")
    confidence: float = Field(..., description="Classification confidence score between 0.0 and 1.0.")

# Setup LLM chain
llm = get_llm()
structured_llm = llm.with_structured_output(SentimentAnalysisSchema)

prompt = ChatPromptTemplate.from_messages([
    ("system", (
        "You are an expert sentiment analysis system specializing in customer support interactions.\n"
        "Analyze the latest customer message and the preceding conversation history to assess their psychological state.\n\n"
        "EMOTIONAL SPECTRUM DEFINITIONS:\n"
        " - Angry: Hostile tone, blunt criticisms, threats, or demanding overrides.\n"
        " - Frustrated: Annoyed by delays, templates, system failures, or repetitive instructions.\n"
        " - Confused: Misunderstands instructions, asks repetitive clarification questions, or feels lost.\n"
        " - Anxious: Stressed about locked funds, late orders, project deadlines, or urgent technical errors.\n"
        " - Calm: Polite, cooperative, uses objective, fact-based statements.\n"
        " - Happy: Shows gratitude, uses exclamation marks positively, expresses relief.\n\n"
        "FRUSTRATION SCORING CRITERIA (0.0 to 10.0):\n"
        " - 8.0 - 10.0: Extreme rage. Mentions cancelling contracts, legal actions, or demands direct supervisor transfer.\n"
        " - 5.0 - 7.9: Annoyed. Complaints about delay, warnings of dissatisfaction, passive-aggressive remarks.\n"
        " - 2.0 - 4.9: Mild concern. Explaining an issue factually with minor confusion or slight stress.\n"
        " - 0.0 - 1.9: Completely cooperative. Friendly greetings, thanking the agent, or casual conversation.\n\n"
        "INSTRUCTIONS:\n"
        " 1. Assess if the satisfaction trend is 'increasing' (calming down), 'decreasing' (getting angrier), or 'stable' (mood remains unchanged).\n"
        " 2. Respond strictly in structured format."
    )),
    ("user", "Latest message: {message}\nConversation History:\n{history}")
])

def sentiment_analyst_node(state: ConversationState) -> dict:
    """LangGraph node analyzing customer sentiment and frustration."""
    start_time = time.time()
    logger.info("Running Sentiment Analyst Agent...")
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
        sentiment_dict = response.dict()
    except Exception as e:
        logger.error(f"Error in Sentiment Analyst Agent: {e}", exc_info=True)
        sentiment_dict = {
            "emotion": "neutral",
            "frustration_score": 3.0,
            "satisfaction_trend": "stable",
            "confidence": 0.5
        }

    duration_ms = int((time.time() - start_time) * 1000)
    agent_logs = dict(state.get("agent_logs", {}))
    agent_logs["sentiment_analyst"] = {"status": "completed", "duration_ms": duration_ms}

    return {
        "sentiment": sentiment_dict,
        "frustration_score": sentiment_dict["frustration_score"],
        "agent_logs": agent_logs
    }
