import json
import logging
import asyncio
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sse_starlette import EventSourceResponse
from backend.database.mongodb import get_database
from backend.services.auth import get_current_user
from backend.agents.customer_simulator import generate_customer_response
from backend.agents.orchestration import app_graph

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/start", status_code=status.HTTP_200_OK)
async def start_chat(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Initializes chat history for the coaching session and generates the first customer complaint."""
    session = await db["sessions"].find_one({"_id": session_id})
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coaching session config not found"
        )
        
    if "history" in session and len(session["history"]) > 0:
        return {
            "session_id": session_id,
            "history": session["history"],
            "current_mood": session.get("current_mood", session["customer_mood"]),
            "frustration_score": session.get("frustration_score", 3.0),
            "escalation_level": session.get("escalation_level", 0)
        }

    initial_mood = session["customer_mood"]
    initial_frustration = 6.0 if "angry" in initial_mood.lower() or "impatient" in initial_mood.lower() else 3.0
    
    # Replay Mode Initialization
    if session.get("interaction_mode") == "replay" and session.get("preloaded_transcript"):
        first_msg = session["preloaded_transcript"][0]
        initial_msg = {
            "role": first_msg["role"],
            "content": first_msg["content"],
            "timestamp": datetime.utcnow().isoformat()
        }
        history = [initial_msg]
        await db["sessions"].update_one(
            {"_id": session_id},
            {
                "$set": {
                    "history": history,
                    "current_mood": initial_mood,
                    "frustration_score": initial_frustration,
                    "escalation_level": 0,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        return {
            "session_id": session_id,
            "history": history,
            "current_mood": initial_mood,
            "frustration_score": initial_frustration,
            "escalation_level": 0
        }

    # Manual Mode Initialization
    if session.get("interaction_mode") == "manual":
        history = []
        await db["sessions"].update_one(
            {"_id": session_id},
            {
                "$set": {
                    "history": history,
                    "current_mood": initial_mood,
                    "frustration_score": initial_frustration,
                    "escalation_level": 0,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        return {
            "session_id": session_id,
            "history": history,
            "current_mood": initial_mood,
            "frustration_score": initial_frustration,
            "escalation_level": 0
        }

    customer_response_schema = generate_customer_response(
        session_config=session,
        history=[],
        latest_agent_msg=f"Hello. I am calling regarding my {session['product']} with the issue of {session['issue_type']}.",
        current_mood=initial_mood,
        frustration_score=initial_frustration,
        escalation_level=0
    )
    
    initial_msg = {
        "role": "customer",
        "content": customer_response_schema.message,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    history = [initial_msg]
    
    await db["sessions"].update_one(
        {"_id": session_id},
        {
            "$set": {
                "history": history,
                "current_mood": customer_response_schema.current_mood,
                "frustration_score": customer_response_schema.frustration_score,
                "escalation_level": customer_response_schema.escalation_level,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {
        "session_id": session_id,
        "history": history,
        "current_mood": customer_response_schema.current_mood,
        "frustration_score": customer_response_schema.frustration_score,
        "escalation_level": customer_response_schema.escalation_level
    }

@router.post("/message")
async def send_agent_message(
    session_id: str,
    message: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Receives agent message, executes LangGraph nodes as async streams, yields
    independent agent updates, runs customer simulator, and streams customer reply.
    """
    session = await db["sessions"].find_one({"_id": session_id})
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
        
    history = session.get("history", [])
    current_mood = session.get("current_mood", session["customer_mood"])
    frustration_score = session.get("frustration_score", 3.0)
    escalation_level = session.get("escalation_level", 0)
    
    agent_msg = {
        "role": "agent",
        "content": message,
        "timestamp": datetime.utcnow().isoformat()
    }

    async def sse_generator():
        # Yield status: processing graph
        yield {
            "event": "status",
            "data": json.dumps({"status": "analyzing", "message": "Triggering AI agent collaboration workflow..."})
        }

        # Setup initial graph state
        initial_state = {
            "session_id": session_id,
            "history": history,
            "current_mood": current_mood,
            "current_intent": {},
            "sentiment": {},
            "frustration_score": frustration_score,
            "retrieved_knowledge": [],
            "escalation_level": escalation_level,
            "metadata": session,
            "latest_message": agent_msg,
            # Phase 3 additions
            "coaching_suggestions": [],
            "self_critique": [],
            "policy_compliance": {},
            "hallucination_guard": {},
            "escalation_risk": {},
            "agent_logs": {}
        }

        accumulated_state = dict(initial_state)

        # 1. Async stream LangGraph execution
        async for event in app_graph.astream(initial_state):
            node_name, state_updates = next(iter(event.items()))
            
            # Merge updates into accumulated_state
            for k, v in state_updates.items():
                if k in accumulated_state:
                    if isinstance(accumulated_state[k], dict) and isinstance(v, dict):
                        # Merge dictionary properties
                        accumulated_state[k] = {**accumulated_state[k], **v}
                    else:
                        accumulated_state[k] = v
                else:
                    accumulated_state[k] = v

            # Notify UI of independent agent progress updates
            if not node_name.startswith("prep_") and node_name != "join_barrier":
                yield {
                    "event": "agent_update",
                    "data": json.dumps({
                        "node": node_name,
                        "state": {
                            "current_intent": accumulated_state["current_intent"],
                            "sentiment": accumulated_state["sentiment"],
                            "frustration_score": accumulated_state["frustration_score"],
                            "retrieved_knowledge": accumulated_state["retrieved_knowledge"],
                            "coaching_suggestions": accumulated_state["coaching_suggestions"],
                            "self_critique": accumulated_state["self_critique"],
                            "policy_compliance": accumulated_state["policy_compliance"],
                            "hallucination_guard": accumulated_state["hallucination_guard"],
                            "escalation_risk": accumulated_state["escalation_risk"],
                            "agent_logs": accumulated_state["agent_logs"]
                        }
                    })
                }

        # Extracted metrics at graph completion
        detected_intent = accumulated_state["current_intent"]
        detected_sentiment = accumulated_state["sentiment"]
        retrieved_knowledge = accumulated_state["retrieved_knowledge"]
        updated_frustration = accumulated_state["frustration_score"]
        coaching_suggestions = accumulated_state["coaching_suggestions"]
        self_critique = accumulated_state["self_critique"]
        policy_compliance = accumulated_state["policy_compliance"]
        hallucination_guard = accumulated_state["hallucination_guard"]
        escalation_risk = accumulated_state["escalation_risk"]
        agent_logs = accumulated_state["agent_logs"]
        
        mode = session.get("interaction_mode", "simulator")
        if mode in ["manual", "replay"]:
            if not retrieved_knowledge or retrieved_knowledge[0]["text"] == "No confident knowledge found.":
                import uuid
                intent_val = detected_intent.get("primary_intent", "Inquiry")
                score_val = retrieved_knowledge[0].get("score", 0.0) if retrieved_knowledge else 0.0
                
                existing_gap = await db["knowledge_gaps"].find_one({"question": message})
                if existing_gap:
                    await db["knowledge_gaps"].update_one(
                        {"_id": existing_gap["_id"]},
                        {
                            "$inc": {"frequency": 1},
                            "$set": {"timestamp": datetime.utcnow(), "similarity_score": score_val}
                        }
                    )
                else:
                    await db["knowledge_gaps"].insert_one({
                        "_id": str(uuid.uuid4()),
                        "question": message,
                        "intent": intent_val,
                        "similarity_score": score_val,
                        "timestamp": datetime.utcnow(),
                        "frequency": 1
                    })

            agent_snapshot = {
                "timestamp": datetime.utcnow().isoformat(),
                "role": "agent",
                "content": message,
                "analysis": {
                    "intent": detected_intent,
                    "sentiment": detected_sentiment,
                    "knowledge": retrieved_knowledge,
                    "suggestions": coaching_suggestions,
                    "critique": self_critique,
                    "compliance": policy_compliance,
                    "hallucination": hallucination_guard,
                    "risk": escalation_risk,
                    "logs": agent_logs
                }
            }

            final_history = history + [agent_msg]

            await db["sessions"].update_one(
                {"_id": session_id},
                {
                    "$set": {
                        "history": final_history,
                        "latest_analysis": {
                            "intent": detected_intent,
                            "sentiment": detected_sentiment,
                            "knowledge": retrieved_knowledge,
                            "suggestions": coaching_suggestions,
                            "critique": self_critique,
                            "compliance": policy_compliance,
                            "hallucination": hallucination_guard,
                            "risk": escalation_risk,
                            "logs": agent_logs
                        },
                        "updated_at": datetime.utcnow()
                    },
                    "$push": {
                        "replay_timeline": agent_snapshot
                    }
                }
            )

            yield {
                "event": "done",
                "data": json.dumps({
                    "customer_mood": current_mood,
                    "frustration_score": frustration_score,
                    "escalation_level": escalation_level,
                    "latest_message": agent_msg
                })
            }
            return

        yield {
            "event": "status",
            "data": json.dumps({"status": "typing", "message": "Customer is typing..."})
        }
        
        # 2. Invoke Customer Simulator
        updated_history = history + [agent_msg]
        
        # Map escalation risk level to escalation index
        new_esc_level = escalation_level
        if escalation_risk.get("risk_level") == "high":
            new_esc_level = min(2, escalation_level + 1)
        
        customer_response = generate_customer_response(
            session_config=session,
            history=updated_history,
            latest_agent_msg=message,
            current_mood=detected_sentiment.get("emotion", current_mood),
            frustration_score=updated_frustration,
            escalation_level=new_esc_level
        )
        
        # Stream customer reply word by word
        words = customer_response.message.split(" ")
        for i, word in enumerate(words):
            await asyncio.sleep(0.04) # fast typing
            yield {
                "event": "chunk",
                "data": json.dumps({"text": word + (" " if i < len(words) - 1 else "")})
            }
            
        customer_msg = {
            "role": "customer",
            "content": customer_response.message,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        final_history = updated_history + [customer_msg]
        
        # Check for knowledge gaps where retrieval confidence was low
        if not retrieved_knowledge or retrieved_knowledge[0]["text"] == "No confident knowledge found.":
            import uuid
            intent_val = detected_intent.get("primary_intent", "Inquiry")
            score_val = retrieved_knowledge[0].get("score", 0.0) if retrieved_knowledge else 0.0
            
            existing_gap = await db["knowledge_gaps"].find_one({"question": message})
            if existing_gap:
                await db["knowledge_gaps"].update_one(
                    {"_id": existing_gap["_id"]},
                    {
                        "$inc": {"frequency": 1},
                        "$set": {"timestamp": datetime.utcnow(), "similarity_score": score_val}
                    }
                )
            else:
                await db["knowledge_gaps"].insert_one({
                    "_id": str(uuid.uuid4()),
                    "question": message,
                    "intent": intent_val,
                    "similarity_score": score_val,
                    "timestamp": datetime.utcnow(),
                    "frequency": 1
                })

        # Prepare timeline snapshots
        agent_snapshot = {
            "timestamp": datetime.utcnow().isoformat(),
            "role": "agent",
            "content": message,
            "analysis": {
                "intent": detected_intent,
                "sentiment": detected_sentiment,
                "knowledge": retrieved_knowledge,
                "suggestions": coaching_suggestions,
                "critique": self_critique,
                "compliance": policy_compliance,
                "hallucination": hallucination_guard,
                "risk": escalation_risk,
                "logs": agent_logs
            }
        }
        
        customer_snapshot = {
            "timestamp": datetime.utcnow().isoformat(),
            "role": "customer",
            "content": customer_response.message,
            "analysis": None
        }

        # Save to MongoDB
        await db["sessions"].update_one(
            {"_id": session_id},
            {
                "$set": {
                    "history": final_history,
                    "current_mood": customer_response.current_mood,
                    "frustration_score": customer_response.frustration_score,
                    "escalation_level": customer_response.escalation_level,
                    "latest_analysis": {
                        "intent": detected_intent,
                        "sentiment": detected_sentiment,
                        "knowledge": retrieved_knowledge,
                        "suggestions": coaching_suggestions,
                        "critique": self_critique,
                        "compliance": policy_compliance,
                        "hallucination": hallucination_guard,
                        "risk": escalation_risk,
                        "logs": agent_logs
                    },
                    "updated_at": datetime.utcnow()
                },
                "$push": {
                    "replay_timeline": {
                        "$each": [agent_snapshot, customer_snapshot]
                    }
                }
            }
        )
        
        # Final Event
        yield {
            "event": "done",
            "data": json.dumps({
                "customer_mood": customer_response.current_mood,
                "frustration_score": customer_response.frustration_score,
                "escalation_level": customer_response.escalation_level,
                "latest_message": customer_msg
            })
        }
        
    return EventSourceResponse(sse_generator())

@router.get("/state/{session_id}", status_code=status.HTTP_200_OK)
async def get_chat_state(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Fetches the conversation log history and latest analytical records for a session."""
    session = await db["sessions"].find_one({"_id": session_id})
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
        
    return {
        "session_id": session_id,
        "history": session.get("history", []),
        "current_mood": session.get("current_mood", session["customer_mood"]),
        "frustration_score": session.get("frustration_score", 3.0),
        "escalation_level": session.get("escalation_level", 0),
        "analysis": session.get("latest_analysis", {
            "intent": {},
            "sentiment": {},
            "knowledge": [],
            "suggestions": [],
            "critique": [],
            "compliance": {},
            "hallucination": {},
            "risk": {},
            "logs": {}
        })
    }

@router.post("/customer-message")
async def send_customer_message(
    session_id: str,
    message: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Receives custom customer message input in manual or replay mode, executes the
    multi-agent graph, updates session stats, and returns the analytics stream.
    """
    session = await db["sessions"].find_one({"_id": session_id})
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
        
    history = session.get("history", [])
    current_mood = session.get("current_mood", session["customer_mood"])
    frustration_score = session.get("frustration_score", 3.0)
    escalation_level = session.get("escalation_level", 0)

    customer_msg = {
        "role": "customer",
        "content": message,
        "timestamp": datetime.utcnow().isoformat()
    }

    async def sse_generator():
        yield {
            "event": "status",
            "data": json.dumps({"status": "analyzing", "message": "Analyzing custom customer input..."})
        }

        initial_state = {
            "session_id": session_id,
            "history": history,
            "current_mood": current_mood,
            "current_intent": {},
            "sentiment": {},
            "frustration_score": frustration_score,
            "retrieved_knowledge": [],
            "escalation_level": escalation_level,
            "metadata": session,
            "latest_message": customer_msg,
            "coaching_suggestions": [],
            "self_critique": [],
            "policy_compliance": {},
            "hallucination_guard": {},
            "escalation_risk": {},
            "agent_logs": {}
        }

        accumulated_state = dict(initial_state)

        async for event in app_graph.astream(initial_state):
            node_name, state_updates = next(iter(event.items()))
            
            for k, v in state_updates.items():
                if k in accumulated_state:
                    if isinstance(accumulated_state[k], dict) and isinstance(v, dict):
                        accumulated_state[k] = {**accumulated_state[k], **v}
                    else:
                        accumulated_state[k] = v
                else:
                    accumulated_state[k] = v

            if not node_name.startswith("prep_") and node_name != "join_barrier":
                yield {
                    "event": "agent_update",
                    "data": json.dumps({
                        "node": node_name,
                        "state": {
                            "current_intent": accumulated_state["current_intent"],
                            "sentiment": accumulated_state["sentiment"],
                            "frustration_score": accumulated_state["frustration_score"],
                            "retrieved_knowledge": accumulated_state["retrieved_knowledge"],
                            "coaching_suggestions": accumulated_state["coaching_suggestions"],
                            "self_critique": accumulated_state["self_critique"],
                            "policy_compliance": accumulated_state["policy_compliance"],
                            "hallucination_guard": accumulated_state["hallucination_guard"],
                            "escalation_risk": accumulated_state["escalation_risk"],
                            "agent_logs": accumulated_state["agent_logs"]
                        }
                    })
                }

        detected_intent = accumulated_state["current_intent"]
        detected_sentiment = accumulated_state["sentiment"]
        retrieved_knowledge = accumulated_state["retrieved_knowledge"]
        updated_frustration = accumulated_state["frustration_score"]
        coaching_suggestions = accumulated_state["coaching_suggestions"]
        self_critique = accumulated_state["self_critique"]
        policy_compliance = accumulated_state["policy_compliance"]
        hallucination_guard = accumulated_state["hallucination_guard"]
        escalation_risk = accumulated_state["escalation_risk"]
        agent_logs = accumulated_state["agent_logs"]

        customer_snapshot = {
            "timestamp": datetime.utcnow().isoformat(),
            "role": "customer",
            "content": message,
            "analysis": {
                "intent": detected_intent,
                "sentiment": detected_sentiment,
                "knowledge": retrieved_knowledge,
                "suggestions": coaching_suggestions,
                "critique": self_critique,
                "compliance": policy_compliance,
                "hallucination": hallucination_guard,
                "risk": escalation_risk,
                "logs": agent_logs
            }
        }

        final_history = history + [customer_msg]

        new_esc_level = escalation_level
        if escalation_risk.get("risk_level") == "high":
            new_esc_level = min(2, escalation_level + 1)

        await db["sessions"].update_one(
            {"_id": session_id},
            {
                "$set": {
                    "history": final_history,
                    "current_mood": detected_sentiment.get("emotion", current_mood),
                    "frustration_score": updated_frustration,
                    "escalation_level": new_esc_level,
                    "latest_analysis": {
                        "intent": detected_intent,
                        "sentiment": detected_sentiment,
                        "knowledge": retrieved_knowledge,
                        "suggestions": coaching_suggestions,
                        "critique": self_critique,
                        "compliance": policy_compliance,
                        "hallucination": hallucination_guard,
                        "risk": escalation_risk,
                        "logs": agent_logs
                    },
                    "updated_at": datetime.utcnow()
                },
                "$push": {
                    "replay_timeline": customer_snapshot
                }
            }
        )

        yield {
            "event": "done",
            "data": json.dumps({
                "customer_mood": detected_sentiment.get("emotion", current_mood),
                "frustration_score": updated_frustration,
                "escalation_level": new_esc_level,
                "latest_message": customer_msg
            })
        }

    return EventSourceResponse(sse_generator())
