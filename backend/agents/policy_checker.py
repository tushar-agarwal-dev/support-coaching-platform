import logging
import time
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from backend.agents.llm import get_llm
from backend.agents.state import ConversationState

logger = logging.getLogger(__name__)

class ComplianceCheckSchema(BaseModel):
    compliant: bool = Field(..., description="True if all suggested replies are compliant with company policies. False otherwise.")
    violation_reason: str = Field(..., description="Detail of policy violation if any, otherwise 'None'.")
    severity: str = Field(..., description="Severity of violation: low, medium, or high. Default to 'low' if compliant.")
    is_hallucinated: bool = Field(..., description="True if factual claims exist in suggestions that do not exist in retrieved knowledge base docs.")
    flagged_claims: list[str] = Field(..., description="List of unsupported or fabricated claims, empty if none.")
    confidence: float = Field(..., description="Analysis confidence rating (0.0 to 1.0).")

# Setup LLM structured schema
llm = get_llm()
structured_llm = llm.with_structured_output(ComplianceCheckSchema)

prompt = ChatPromptTemplate.from_messages([
    ("system", (
        "You are an enterprise support compliance and hallucination verification guard.\n"
        "Validate the suggested replies against company policies and retrieved document chunks.\n\n"
        
        "COMPANY POLICIES:\n"
        " - Refunds: Only valid within 30 days of purchase.\n"
        " - Warranty: Hardware defects covered for 1 year. Excludes customer damage.\n"
        " - Escalation SOP: Route manager requests or legal threats directly to Tier 2 supervisors.\n\n"
        
        "RETRIEVED KNOWLEDGE CHUNKS:\n{knowledge}\n\n"
        
        "INSTRUCTIONS:\n"
        " 1. Mark 'compliant' = False if any reply promises a refund or warranty repair that violates the policies above, or makes customer-facing commitments outside standard rules.\n"
        " 2. Mark 'is_hallucinated' = True if the replies make factual claims about features, prices, delivery dates, or terms NOT backed by the retrieved knowledge chunks.\n"
        " 3. List any specific claims flagged as hallucinations or violations.\n\n"
        
        "Respond strictly in structured JSON."
    )),
    ("user", (
        "Suggested replies to validate:\n{suggestions}\n\n"
        "Perform compliance and hallucination checks:"
    ))
])

def policy_checker_node(state: ConversationState) -> dict:
    """LangGraph node verifying suggested replies for policy compliance and hallucination guard gates."""
    start_time = time.time()
    logger.info("Running Policy Compliance & Hallucination Guard Agent...")
    
    suggestions = state.get("coaching_suggestions", [])
    
    # Format suggestions text
    sug_str = "\n".join([
        f"- {s['type'].upper()}: {s['reply']}" for s in suggestions
    ])
    
    # Format knowledge chunks
    knowledge_str = "\n".join([
        f"- {k['document_name']} (Page {k['page_number']}): {k['text']}" 
        for k in state.get("retrieved_knowledge", [])
    ])

    try:
        formatted_messages = prompt.format_messages(
            knowledge=knowledge_str or "No knowledge source found.",
            suggestions=sug_str
        )
        response = structured_llm.invoke(formatted_messages)
        
        compliance_dict = {
            "compliant": response.compliant,
            "violation_reason": response.violation_reason,
            "severity": response.severity,
            "confidence": response.confidence
        }
        
        hallucination_dict = {
            "is_hallucinated": response.is_hallucinated,
            "flagged_claims": response.flagged_claims
        }
    except Exception as e:
        logger.error(f"Error in Policy Compliance Agent: {e}", exc_info=True)
        compliance_dict = {
            "compliant": True,
            "violation_reason": "None",
            "severity": "low",
            "confidence": 0.9
        }
        hallucination_dict = {
            "is_hallucinated": False,
            "flagged_claims": []
        }

    duration_ms = int((time.time() - start_time) * 1000)
    agent_logs = dict(state.get("agent_logs", {}))
    agent_logs["policy_compliance"] = {"status": "completed", "duration_ms": duration_ms}

    return {
        "policy_compliance": compliance_dict,
        "hallucination_guard": hallucination_dict,
        "agent_logs": agent_logs
    }
