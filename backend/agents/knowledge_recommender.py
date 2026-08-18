import logging
import time
from backend.agents.state import ConversationState
from backend.database.chromadb import get_chroma_client
from backend.rag.pipeline import get_embedding_model

logger = logging.getLogger(__name__)

def _get_all_chunks_sync() -> list:
    from backend.database.mongodb import MongoDB
    if MongoDB.db is None:
        return []
    if MongoDB.is_mock:
        store = MongoDB.db.store.get("document_chunks", {})
        return list(store.values())
    else:
        import asyncio
        async def fetch():
            cursor = MongoDB.db["document_chunks"].find({})
            return await cursor.to_list(length=1000)
        try:
            loop = asyncio.get_running_loop()
            future = asyncio.run_coroutine_threadsafe(fetch(), loop)
            return future.result()
        except RuntimeError:
            try:
                loop = asyncio.new_event_loop()
                return loop.run_until_complete(fetch())
            except Exception:
                return []

def knowledge_recommender_node(state: ConversationState) -> dict:
    """LangGraph node retrieving relevant supporting documents from ChromaDB."""
    start_time = time.time()
    logger.info("Running Knowledge Recommender Agent...")
    latest_msg = state.get("latest_message", {})
    message_content = latest_msg.get("content", "")
    
    if not message_content:
        return {"retrieved_knowledge": []}

    try:
        import os
        if os.environ.get("RENDER") == "true":
            logger.info("Running on Render: Performing keyword-based fallback search from MongoDB...")
            all_chunks = _get_all_chunks_sync()
            
            # Match keywords
            query_words = set(message_content.lower().split())
            matches = []
            for chunk in all_chunks:
                text_lower = chunk["text"].lower()
                # Count matches for words longer than 3 characters to avoid common stops
                score = sum(1 for word in query_words if len(word) > 3 and word in text_lower)
                if score > 0:
                    matches.append((score, chunk))
                    
            # Sort by score descending
            matches.sort(key=lambda x: x[0], reverse=True)
            
            retrieved = []
            for score, chunk in matches[:3]:
                sim_score = min(0.95, 0.45 + (score * 0.1))
                retrieved.append({
                    "text": chunk["text"],
                    "score": round(sim_score, 4),
                    "document_name": chunk.get("document_name", "Unknown File"),
                    "page_number": chunk.get("page_number", 1),
                    "chunk_id": chunk["_id"],
                    "confidence_score": round(sim_score, 2)
                })
        else:
            # Load embedding model and client
            model = get_embedding_model()
            query_embedding = model.encode([message_content])[0].tolist()

            chroma_client = get_chroma_client()
            collection = chroma_client.get_or_create_collection(name="knowledge_base")

            # Retrieve top 3
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=3
            )

            retrieved = []
            if results and results.get("documents") and results["documents"][0]:
                documents = results["documents"][0]
                metadatas = results["metadatas"][0] if results.get("metadatas") else []
                distances = results["distances"][0] if results.get("distances") else []
                ids = results["ids"][0] if results.get("ids") else []

                for i in range(len(documents)):
                    dist = distances[i] if i < len(distances) else 0.5
                    sim_score = max(0.0, 1.0 - (dist / 2.0))
                    meta = metadatas[i] if i < len(metadatas) else {}
                    
                    retrieved.append({
                        "text": documents[i],
                        "score": round(sim_score, 4),
                        "document_name": meta.get("document_name", "Unknown File"),
                        "page_number": meta.get("page_number", 1),
                        "chunk_id": ids[i] if i < len(ids) else f"chunk_{i}",
                        "confidence_score": round(sim_score, 2)
                    })

        valid_recs = [rec for rec in retrieved if rec["score"] >= 0.40]
        if not valid_recs:
            valid_recs = [{
                "text": "No confident knowledge found.",
                "score": 0.0,
                "document_name": "N/A",
                "page_number": 0,
                "chunk_id": "none",
                "confidence_score": 0.0
            }]

    except Exception as e:
        logger.error(f"Error retrieving knowledge recommendations: {e}", exc_info=True)
        valid_recs = [{
            "text": "No confident knowledge found.",
            "score": 0.0,
            "document_name": "N/A",
            "page_number": 0,
            "chunk_id": "error",
            "confidence_score": 0.0
        }]

    # Update agent latency log
    duration_ms = int((time.time() - start_time) * 1000)
    agent_logs = dict(state.get("agent_logs", {}))
    agent_logs["knowledge_recommender"] = {"status": "completed", "duration_ms": duration_ms}

    return {
        "retrieved_knowledge": valid_recs,
        "agent_logs": agent_logs
    }
