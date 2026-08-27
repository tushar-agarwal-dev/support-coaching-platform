import os
import logging
import random
from typing import Any, Dict, List, Optional, Type
from pydantic import BaseModel, Field
from backend.config.settings import settings

logger = logging.getLogger(__name__)

# Structured Mock Responses Database for dry runs
MOCK_INTENTS = [
    {"primary_intent": "Refund Request", "secondary_intent": "Product Cancellation", "urgency": "high", "category": "billing", "confidence_score": 0.95},
    {"primary_intent": "Technical Troubleshooting", "secondary_intent": "Login Error", "urgency": "medium", "category": "technical", "confidence_score": 0.92},
    {"primary_intent": "Delivery Inquiry", "secondary_intent": "Order Tracking", "urgency": "medium", "category": "shipping", "confidence_score": 0.88},
    {"primary_intent": "Warranty Claim", "secondary_intent": "Product Damage", "urgency": "high", "category": "warranty", "confidence_score": 0.91},
    {"primary_intent": "Payment Failure", "secondary_intent": "Card Decline", "urgency": "high", "category": "billing", "confidence_score": 0.97}
]

MOCK_SENTIMENTS = [
    {"emotion": "angry", "frustration_score": 8.5, "satisfaction_trend": "decreasing", "confidence": 0.94},
    {"emotion": "confused", "frustration_score": 4.5, "satisfaction_trend": "stable", "confidence": 0.89},
    {"emotion": "impatient", "frustration_score": 7.0, "satisfaction_trend": "decreasing", "confidence": 0.91},
    {"emotion": "calm", "frustration_score": 1.5, "satisfaction_trend": "increasing", "confidence": 0.96},
    {"emotion": "anxious", "frustration_score": 5.0, "satisfaction_trend": "stable", "confidence": 0.85}
]

class MockStructuredLLM:
    def __init__(self, pydantic_model: Type[BaseModel]):
        self.pydantic_model = pydantic_model

    def invoke(self, messages: Any) -> BaseModel:
        # Extract text content from messages to derive target mock data
        msg_text = ""
        if isinstance(messages, list):
            msg_text = " ".join([m.content if hasattr(m, 'content') else str(m) for m in messages]).lower()
        else:
            msg_text = str(messages).lower()
        # Estimate frustration score based on keywords
        frustration_score = 3.0
        if any(k in msg_text for k in ["angry", "furious", "unacceptable", "terrible", "worst", "hurry", "impatient", "waiting"]):
            frustration_score = 7.5
        # Build mock structured responses matching schema
        model_name = self.pydantic_model.__name__
        
        if "Intent" in model_name:
            # Match keywords to make mock feel dynamic and real
            selected = MOCK_INTENTS[1] # default technical
            if any(k in msg_text for k in ["refund", "cancel", "money", "billing", "charge"]):
                selected = MOCK_INTENTS[0]
            elif any(k in msg_text for k in ["delay", "ship", "track", "delivery", "where"]):
                selected = MOCK_INTENTS[2]
            elif any(k in msg_text for k in ["warranty", "broken", "damage", "screen", "repair"]):
                selected = MOCK_INTENTS[3]
            elif any(k in msg_text for k in ["pay", "card", "decline", "checkout", "transaction"]):
                selected = MOCK_INTENTS[4]
                
            return self.pydantic_model(**selected)
            
        elif "Sentiment" in model_name:
            selected = MOCK_SENTIMENTS[1] # default confused
            if any(k in msg_text for k in ["angry", "furious", "unacceptable", "terrible", "worst"]):
                selected = MOCK_SENTIMENTS[0]
            elif any(k in msg_text for k in ["hurry", "fast", "impatient", "waiting", "time"]):
                selected = MOCK_SENTIMENTS[2]
            elif any(k in msg_text for k in ["thanks", "good", "happy", "helped", "perfect"]):
                selected = MOCK_SENTIMENTS[3]
            elif any(k in msg_text for k in ["worried", "scared", "urgent", "please"]):
                selected = MOCK_SENTIMENTS[4]
                
            return self.pydantic_model(**selected)
            
        elif "Coaching" in model_name:
            # Mock suggestions output
            sug_empathetic = {
                "reply": "I completely understand how frustrating it is to deal with billing issues. Let me review your transaction history and resolve this double charge right away.",
                "reasoning": "Empathizes with double charge billing frustration to de-escalate customer tension.",
                "confidence": 0.95
            }
            sug_professional = {
                "reply": "Thank you for bringing this billing discrepancy to our attention. I am checking your account history to locate the duplicate charge and issue a credit.",
                "reasoning": "Polite and task-focused response addressing duplicate fee standard procedures.",
                "confidence": 0.92
            }
            sug_concise = {
                "reply": "I apologize for the double charge. I am checking your account billing records now to process a refund.",
                "reasoning": "Direct and brief action statement to minimize reading effort.",
                "confidence": 0.96
            }
            
            # Map fields depending on exact schema structure
            if "suggestions" in self.pydantic_model.model_fields:
                # Wrapper list schema
                return self.pydantic_model(suggestions=[sug_empathetic, sug_professional, sug_concise])
            return self.pydantic_model(
                empathetic_reply=sug_empathetic["reply"], empathetic_reasoning=sug_empathetic["reasoning"],
                professional_reply=sug_professional["reply"], professional_reasoning=sug_professional["reasoning"],
                concise_reply=sug_concise["reply"], concise_reasoning=sug_concise["reasoning"]
            )
            
        elif "Critique" in model_name:
            critique_item = {
                "original_reply": "I apologize for the double charge. I am checking your account billing records now to process a refund.",
                "improved_reply": "I apologize for the double charge on your monthly fee. I've accessed your account records and will process a full refund to your card immediately.",
                "improvements": ["Specifically named monthly fee to show active listening", "Promised immediate refund rather than general check"],
                "confidence": 0.94
            }
            return self.pydantic_model(
                empathetic_critique={**critique_item, "mode": "empathetic"},
                professional_critique={**critique_item, "mode": "professional"},
                concise_critique={**critique_item, "mode": "concise"}
            )
            
        elif "Compliance" in model_name or "Policy" in model_name:
            return self.pydantic_model(
                compliant=True,
                violation_reason="None",
                severity="low",
                is_hallucinated=False,
                flagged_claims=[],
                confidence=0.98
            )
            
        elif "Escalation" in model_name:
            return self.pydantic_model(
                risk_percent=65.0 if "hurry" in msg_text or "waiting" in msg_text or frustration_score >= 6.0 else 15.0,
                risk_level="medium" if frustration_score >= 6.0 else "low",
                reasons=["Customer mentioned waiting time in queue", "High frustration detected from text sentiment"],
                recommended_action="Prioritize billing refund processing and offer immediate confirmation without further wait loops."
            )
            
        elif "Summary" in model_name or "PostInteraction" in model_name:
            return self.pydantic_model(
                executive_summary="Coaching session completed. The agent resolved double billing issues successfully.",
                highlights=["Customer reported duplicate transactions", "Agent identified and processed full refund immediately", "Successfully avoided supervisor escalation"],
                intent_summary="Duplicate billing refund request",
                sentiment_journey="Started angry (8.5), became cooperative (3.0), ended satisfied (1.5)",
                root_cause="Duplicate card billing transaction error",
                resolution_summary="Processed billing credit and sent verification email",
                improvement_suggestions=["Maintained professional tone throughout"],
                satisfaction_score=9.0
            )
            
        elif "CustomerResponse" in model_name or "Simulator" in model_name:
            # Mock Customer reply
            reply = "I understand what you are saying, but this issue is really disrupting my work. I need this solved quickly."
            if "refund" in msg_text or "billing" in msg_text:
                reply = "I want a full refund back to my card immediately. I shouldn't be charged for a service that doesn't work!"
            elif "delivery" in msg_text or "ship" in msg_text:
                reply = "My delivery is already three days late! Can you tell me exactly where my package is right now?"
            elif "damage" in msg_text or "broken" in msg_text:
                reply = "The laptop screen arrived completely cracked. I paid for a brand new device, not a broken piece of plastic."
            
            # Evolve mood
            mood = "neutral"
            if any(k in msg_text for k in ["sorry", "apologize", "assist", "help"]):
                mood = "cooperative"
                reply = "Thank you for looking into this. I just want to get it resolved as soon as possible."
            elif any(k in msg_text for k in ["wait", "delay", "cannot"]):
                mood = "angry"
                reply = "This is unacceptable! I don't want to wait anymore. Get me someone who can fix this!"

            # Construct output dictionary depending on schema fields
            out_data = {
                "message": reply,
                "current_mood": mood,
                "frustration_score": 8.0 if mood == "angry" else 3.0,
                "intent": "Inquiry",
                "escalation_level": 1 if mood == "angry" else 0
            }
            # Handle variable schema fields
            filtered_data = {k: v for k, v in out_data.items() if k in self.pydantic_model.model_fields}
            return self.pydantic_model(**filtered_data)

        # Catch-all Pydantic generator using defaults
        fields = {}
        for f_name, f_field in self.pydantic_model.model_fields.items():
            origin = getattr(f_field.annotation, "__origin__", None)
            if f_field.annotation == str:
                fields[f_name] = "Mock String"
            elif f_field.annotation == float:
                fields[f_name] = 1.0
            elif f_field.annotation == int:
                fields[f_name] = 0
            elif f_field.annotation == bool:
                fields[f_name] = True
            elif f_field.annotation == list or origin == list:
                fields[f_name] = []
            else:
                fields[f_name] = None
        return self.pydantic_model(**fields)

class MockLLM:
    def with_structured_output(self, pydantic_model: Type[BaseModel]) -> MockStructuredLLM:
        return MockStructuredLLM(pydantic_model)

    def invoke(self, messages: Any) -> Any:
        # Mock message reply
        class MockMessage:
            content = "This is a mock LLM message response. Please configure GROQ_API_KEY for real integration."
        return MockMessage()

def get_llm() -> Any:
    """Returns ChatOpenAI (for OpenRouter) if OPENROUTER_API_KEY exists, ChatGroq if GROQ_API_KEY exists, otherwise returns MockLLM."""
    if settings.OPENROUTER_API_KEY:
        try:
            from langchain_openai import ChatOpenAI
            logger.info(f"Initializing OpenRouter ChatLLM client with model {settings.OPENROUTER_MODEL_NAME}...")
            return ChatOpenAI(
                api_key=settings.OPENROUTER_API_KEY,
                base_url="https://openrouter.ai/api/v1",
                model=settings.OPENROUTER_MODEL_NAME,
                temperature=0.2
            )
        except Exception as e:
            logger.error(f"Failed to initialize OpenRouter: {e}. Falling back to Groq/MockLLM.")

    if settings.GROQ_API_KEY:
        try:
            from langchain_groq import ChatGroq
            logger.info("Initializing Groq ChatLLM client...")
            return ChatGroq(
                groq_api_key=settings.GROQ_API_KEY,
                model_name=settings.GROQ_MODEL_NAME,
                temperature=0.2
            )
        except Exception as e:
            logger.error(f"Failed to initialize ChatGroq: {e}. Falling back to MockLLM.")
    else:
        logger.info("No active LLM API keys found in environment. MockLLM simulator activated.")
    
    return MockLLM()
