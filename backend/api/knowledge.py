import logging
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, status
from backend.database.mongodb import get_database
from backend.schemas.document import DocumentResponse, DocumentStatus
from backend.services.auth import get_current_user
from backend.rag.pipeline import RAGPipeline

logger = logging.getLogger(__name__)
router = APIRouter()

async def process_document_task(doc_id: str, file_name: str, file_content: bytes, file_size: int):
    """Background task to run RAG ingestion pipeline and update MongoDB status."""
    db = await get_database()
    try:
        # Update status to processing
        await db["documents"].update_one(
            {"_id": doc_id},
            {"$set": {"status": DocumentStatus.PROCESSING}}
        )
        
        # Run pipeline
        result = RAGPipeline.ingest_document(
            file_name=file_name,
            file_content=file_content,
            file_size=file_size,
            doc_id=doc_id
        )
        
        # Update MongoDB with completion stats
        await db["documents"].update_one(
            {"_id": doc_id},
            {
                "$set": {
                    "status": DocumentStatus.COMPLETED,
                    "chunk_count": result["chunk_count"],
                    "chroma_ids": result["chroma_ids"]
                }
            }
        )
        logger.info(f"Background ingestion task successfully completed for document: {doc_id}")
    except Exception as e:
        logger.error(f"Failed background ingestion task for doc {doc_id}: {e}", exc_info=True)
        await db["documents"].update_one(
            {"_id": doc_id},
            {
                "$set": {
                    "status": DocumentStatus.FAILED,
                    "metadata": {"error": str(e)}
                }
            }
        )

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Uploads a support document (PDF, DOCX, TXT) and triggers background RAG ingestion."""
    # Check file format
    file_ext = file.filename.split(".")[-1].lower()
    if file_ext not in ["pdf", "docx", "doc", "txt"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Only PDF, DOCX, and TXT are supported."
        )

    # Read content
    content = await file.read()
    file_size = len(content)
    
    # Store initial pending document record in MongoDB
    doc_id = str(uuid.uuid4())
    doc_record = {
        "_id": doc_id,
        "name": file.filename,
        "file_type": file_ext,
        "status": DocumentStatus.PENDING,
        "chunk_count": 0,
        "file_size": file_size,
        "chroma_ids": [],
        "uploaded_by": current_user["id"],
        "created_at": datetime.utcnow()
    }
    
    await db["documents"].insert_one(doc_record)
    
    # Schedule background parser & vectorizer task
    background_tasks.add_task(
        process_document_task,
        doc_id=doc_id,
        file_name=file.filename,
        file_content=content,
        file_size=file_size
    )

    doc_record["id"] = doc_id
    return doc_record

@router.get("/", response_model=list[DocumentResponse])
async def list_documents(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Lists all uploaded documents."""
    # Filter documents uploaded by the current user OR legacy documents that have no uploader
    cursor = db["documents"].find({
        "$or": [
            {"uploaded_by": current_user["id"]},
            {"uploaded_by": {"$exists": False}}
        ]
    }).sort("created_at", -1)
    documents = []
    async for doc in cursor:
        doc["id"] = doc["_id"]
        documents.append(doc)
    return documents

@router.delete("/{doc_id}", status_code=status.HTTP_200_OK)
async def delete_document(
    doc_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Deletes document record from MongoDB and its associated vector chunks from ChromaDB."""
    doc = await db["documents"].find_one({"_id": doc_id})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
        
    # Delete from ChromaDB
    chroma_ids = doc.get("chroma_ids", [])
    RAGPipeline.delete_document_vectors(doc_id, chroma_ids)
    
    # Delete from MongoDB
    await db["documents"].delete_one({"_id": doc_id})
    
    return {"message": "Document successfully deleted", "document_id": doc_id}
