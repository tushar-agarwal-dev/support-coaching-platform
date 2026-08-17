from typing import TypedDict, List, Dict, Any, Annotated

def merge_logs(left: dict, right: dict) -> dict:
    """Reducer function merging concurrent dictionary logs from parallel graph nodes."""
    return {**(left or {}), **(right or {})}

class ConversationState(TypedDict):
    session_id: str
    history: List[Dict[str, str]]             # List of {"role": "agent"|"customer", "content": str}
    current_mood: str
    current_intent: Dict[str, Any]            # Primary, secondary, urgency, category, confidence
    sentiment: Dict[str, Any]                 # Emotion, frustration_score, satisfaction_trend, confidence
    frustration_score: float                  # 0.0 to 10.0 scale
    retrieved_knowledge: List[Dict[str, Any]]    # Top chunks from ChromaDB
    escalation_level: int                     # 0 (none) to 2 (critical)
    metadata: Dict[str, Any]
    latest_message: Dict[str, str]            # Latest incoming message: {"role": "agent"|"customer", "content": str}
    
    # Phase 3 additions
    coaching_suggestions: List[Dict[str, Any]] # Empathetic, Professional, Concise suggestions
    self_critique: List[Dict[str, Any]]        # Review and improvements list for suggestions
    policy_compliance: Dict[str, Any]         # Compliance check results (compliant: bool, violations: str)
    hallucination_guard: Dict[str, Any]       # Check if factual statements exist in RAG docs
    escalation_risk: Dict[str, Any]           # Prediction of escalation (risk_percent, risk_level, reasons)
    agent_logs: Annotated[dict, merge_logs]    # Execution status and durations (uses reducer for parallel writes)
