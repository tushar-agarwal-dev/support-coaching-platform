import logging
import time
from langgraph.graph import StateGraph, END
from backend.agents.state import ConversationState
from backend.agents.intent_detector import intent_detector_node
from backend.agents.sentiment_analyst import sentiment_analyst_node
from backend.agents.knowledge_recommender import knowledge_recommender_node
from backend.agents.coaching_agent import coaching_agent_node
from backend.agents.self_critique import self_critique_node
from backend.agents.policy_checker import policy_checker_node
from backend.agents.escalation_risk import escalation_risk_node

logger = logging.getLogger(__name__)

def update_state_node(state: ConversationState) -> dict:
    """Updates history list by appending the latest message and initializes agent logging states."""
    logger.info("Orchestrator: Updating conversation state history and resetting execution logs...")
    latest = state.get("latest_message")
    history = list(state.get("history", []))
    
    if latest:
        history.append(latest)

    # Initialize execution logs for Collaboration Viewer
    agent_logs = {
        "intent_detector": {"status": "running", "duration_ms": 0},
        "sentiment_analyst": {"status": "running", "duration_ms": 0},
        "escalation_risk": {"status": "running", "duration_ms": 0},
        "knowledge_recommender": {"status": "waiting", "duration_ms": 0},
        "coaching_suggestions": {"status": "waiting", "duration_ms": 0},
        "self_critique": {"status": "waiting", "duration_ms": 0},
        "policy_compliance": {"status": "waiting", "duration_ms": 0}
    }
        
    return {
        "history": history,
        "agent_logs": agent_logs
    }

def join_node(state: ConversationState) -> dict:
    """Barrier synchronization node joining parallel Intent, Sentiment, and Risk analyses."""
    logger.info("Orchestrator: Joining parallel execution paths and updating subsequent node states...")
    agent_logs = dict(state.get("agent_logs", {}))
    # Update next node status to running
    agent_logs["knowledge_recommender"] = {"status": "running", "duration_ms": 0}
    return {
        "agent_logs": agent_logs
    }

def prep_coaching_node(state: ConversationState) -> dict:
    """Pass-through node setting coaching status to running."""
    agent_logs = dict(state.get("agent_logs", {}))
    agent_logs["coaching_suggestions"] = {"status": "running", "duration_ms": 0}
    return {"agent_logs": agent_logs}

def prep_critique_node(state: ConversationState) -> dict:
    """Pass-through node setting self-critique status to running."""
    agent_logs = dict(state.get("agent_logs", {}))
    agent_logs["self_critique"] = {"status": "running", "duration_ms": 0}
    return {"agent_logs": agent_logs}

def prep_compliance_node(state: ConversationState) -> dict:
    """Pass-through node setting compliance status to running."""
    agent_logs = dict(state.get("agent_logs", {}))
    agent_logs["policy_compliance"] = {"status": "running", "duration_ms": 0}
    return {"agent_logs": agent_logs}

# 1. Initialize StateGraph with our extended ConversationState schema
workflow = StateGraph(ConversationState)

# 2. Add Workflow Nodes
workflow.add_node("update_state", update_state_node)
workflow.add_node("intent_detector", intent_detector_node)
workflow.add_node("sentiment_analyst", sentiment_analyst_node)
workflow.add_node("escalation_risk", escalation_risk_node)
workflow.add_node("join_barrier", join_node)
workflow.add_node("knowledge_recommender", knowledge_recommender_node)
workflow.add_node("prep_coaching", prep_coaching_node)
workflow.add_node("coaching_suggestions", coaching_agent_node)
workflow.add_node("prep_critique", prep_critique_node)
workflow.add_node("self_critique", self_critique_node)
workflow.add_node("prep_compliance", prep_compliance_node)
workflow.add_node("policy_compliance", policy_checker_node)

# 3. Add Edges & Graph Routing
workflow.set_entry_point("update_state")

# Parallel fork from update_state (Intent, Sentiment, and Escalation Risk run in parallel!)
workflow.add_edge("update_state", "intent_detector")
workflow.add_edge("update_state", "sentiment_analyst")
workflow.add_edge("update_state", "escalation_risk")

# Join back at the barrier node
workflow.add_edge("intent_detector", "join_barrier")
workflow.add_edge("sentiment_analyst", "join_barrier")
workflow.add_edge("escalation_risk", "join_barrier")

# Sequential execution chain
workflow.add_edge("join_barrier", "knowledge_recommender")
workflow.add_edge("knowledge_recommender", "prep_coaching")
workflow.add_edge("prep_coaching", "coaching_suggestions")
workflow.add_edge("coaching_suggestions", "prep_critique")
workflow.add_edge("prep_critique", "self_critique")
workflow.add_edge("self_critique", "prep_compliance")
workflow.add_edge("prep_compliance", "policy_compliance")
workflow.add_edge("policy_compliance", END)

# 4. Compile compiled graph
app_graph = workflow.compile()

def run_agent_pipeline(session_id: str, history: list, latest_msg: dict, current_mood: str, frustration_score: float, escalation_level: int, metadata: dict) -> dict:
    """Executes the full LangGraph coaching workflow for an agent message."""
    initial_state = {
        "session_id": session_id,
        "history": history,
        "current_mood": current_mood,
        "current_intent": {},
        "sentiment": {},
        "frustration_score": frustration_score,
        "retrieved_knowledge": [],
        "escalation_level": escalation_level,
        "metadata": metadata or {},
        "latest_message": latest_msg,
        # New additions
        "coaching_suggestions": [],
        "self_critique": [],
        "policy_compliance": {},
        "hallucination_guard": {},
        "escalation_risk": {},
        "agent_logs": {}
    }
    
    logger.info(f"Triggering LangGraph workflow for session {session_id}...")
    final_state = app_graph.invoke(initial_state)
    logger.info("LangGraph pipeline successfully executed.")
    return final_state
