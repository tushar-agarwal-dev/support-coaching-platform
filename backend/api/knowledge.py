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

@router.post("/load-demo", response_model=DocumentResponse)
async def load_demo_knowledge_base(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Preloads the predefined VantrixAI standard knowledge base rules instantly."""
    demo_name = "VantrixAI_Demo_Knowledge_Base.txt"
    
    # Check if this user has already loaded it
    existing = await db["documents"].find_one({"name": demo_name, "uploaded_by": current_user["id"]})
    if existing:
        existing["id"] = existing["_id"]
        return existing

    demo_content = """========================================================================
                      VANTRIXAI PLATFORM KNOWLEDGE BASE
                   STANDARD OPERATING PROCEDURES & POLICIES
========================================================================
Effective: August 2026
Version: 2.1
Status: ACTIVE
Target: Frontline Support Agents & AI Coach Integration

------------------------------------------------------------------------
SECTION 1: GENERAL REFUND AND BILLING POLICIES
------------------------------------------------------------------------
1.1 Refund Processing Timeline:
All approved refunds are processed back to the original payment method. 
* Standard refunds take 5 to 7 business days to reflect in the customer's bank statement.
* Under no circumstances should an agent promise an instant or same-day refund back to a card, as banking network clearances are outside our control.
* Compensatory credits (store credits) can be applied instantly to the user's account dashboard.

1.2 Double Charges & Billing Discrepancies:
If a customer reports a duplicate transaction (double charge):
1. Ask the customer for the transaction IDs or screenshots of the bank statement.
2. Cross-reference the transaction history in the Billing Panel.
3. If confirmed, process a refund for the second transaction immediately.
4. Apologize sincerely and offer a $10 courtesy account credit for the inconvenience.

1.3 Cancellations & Grace Periods:
* Subscriptions can be canceled at any time from the account settings.
* Annual plans have a 14-day money-back guarantee. Cancellations requested after 14 days of activation are eligible for pro-rated credits only, not direct cash refunds.

------------------------------------------------------------------------
SECTION 2: E-COMMERCE & LOGISTICS SUPPORT
------------------------------------------------------------------------
2.1 Shipping & Late Deliveries:
* Standard Delivery: 3 to 5 business days.
* Express Delivery: 1 to 2 business days.
* If a package is delayed beyond the estimated delivery date:
  1. Check the shipping carrier tracking ID in the admin panel.
  2. If the package is stuck at a transit hub, issue a status update to the customer.
  3. If delayed by more than 3 business days, refund the shipping fee ($5.99 for standard, $14.99 for express) as an apology.
  4. If a package is declared lost, offer a free replacement shipment or a full refund.

2.2 Returns & Damaged Goods:
* Customers can return items within 30 days of delivery. Items must be in original packaging.
* For goods that arrive damaged or broken:
  1. Express empathy immediately. Do not sound defensive.
  2. Request a photo of the damaged item for validation.
  3. Once validated, schedule a free replacement delivery with priority shipping, or issue a full refund including shipping costs.
  4. Do not require the customer to return the broken item if it poses a safety hazard.

------------------------------------------------------------------------
SECTION 3: SAAS & TECHNICAL SUPPORT
------------------------------------------------------------------------
3.1 Password Resets & Login Troubleshooting:
* If a customer is locked out of their account:
  1. Ask for their registered email address.
  2. Instruct them to use the "Forgot Password" link on the login page.
  3. If they do not receive the email, verify that the email address is correct in the database and check if the email is in the spam folder.
  4. If MFA (Multi-Factor Authentication) is locked (lost device), request identity verification (security questions or ID check) before disabling MFA. Never disable MFA without verification.

3.2 API Rate Limits & Keys:
* Developer (Free) Tier: 60 requests per minute.
* Professional Tier: 1,000 requests per minute.
* Enterprise Tier: Custom/Unlimited limits.
* If a developer receives "429 Too Many Requests":
  1. Instruct them to implement exponential backoff retry logic.
  2. Suggest upgrading to the Professional Tier if their production requirements exceed 60 RPM.
  3. Do not manually whitelist free accounts for higher limits.

3.3 Data Backups & Retention:
* Accounts in good standing are backed up daily. Backups are retained for 30 days.
* If a user requests restoration of deleted data:
  1. Confirm the deletion timestamp.
  2. Initiate restoration from the nearest recovery point.
  3. Inform the customer that restoration can take up to 2 hours.

------------------------------------------------------------------------
SECTION 4: TELECOM & MOBILITY SUPPORT
------------------------------------------------------------------------
4.1 SIM Card Activation & eSIM Configuration:
* Physical SIMs activate within 2 hours of insertion.
* eSIM profiles are delivered via email as a QR code.
* If eSIM QR code scan fails:
  1. Ensure the device is connected to a stable Wi-Fi network during activation.
  2. Verify that the device is carrier-unlocked and supports eSIM technology.
  3. If it still fails, regenerate the activation profile from the carrier portal and email the new QR code.

4.2 International Roaming & Travel Passes:
* International roaming must be enabled in the mobile settings before departure.
* Daily Travel Pass is $10/day (includes unlimited talk/text and 500MB high-speed data).
* Pay-as-you-go international roaming rates: Voice: $1.50/min, SMS: $0.50/msg, Data: $2.00/MB. Strongly advise customers to purchase a Travel Pass to avoid massive bills.

4.3 Network Outages & Connectivity Issues:
* If a user reports "No Service":
  1. Check the local coverage map for scheduled maintenance or outages.
  2. If an outage is active, inform the customer of the estimated resolution time.
  3. If no outage is active, guide the user to toggle Airplane Mode, restart the device, or reset Network Settings.

========================================================================
                   COACHING PROTOCOL & COMPLIANCE RULES
========================================================================
1. Empathy Score Requirement: Empathy must be shown in the first two turns of any billing or damage dispute.
2. Accuracy: Never quote fake SLA times (e.g. promising a system recovery in 5 minutes when standard SLA is 2 hours).
3. Escalation Limit: Only escalate to a manager if the customer explicitly requests it, or if the frustration score exceeds 8.0 after 3 turns of active troubleshooting.
========================================================================
"""
    doc_id = str(uuid.uuid4())
    content_bytes = demo_content.encode("utf-8")
    file_size = len(content_bytes)

    doc_record = {
        "_id": doc_id,
        "name": demo_name,
        "file_type": "txt",
        "status": DocumentStatus.PROCESSING,
        "chunk_count": 0,
        "file_size": file_size,
        "chroma_ids": [],
        "uploaded_by": current_user["id"],
        "created_at": datetime.utcnow()
    }
    await db["documents"].insert_one(doc_record)

    try:
        result = RAGPipeline.ingest_document(
            file_name=demo_name,
            file_content=content_bytes,
            file_size=file_size,
            doc_id=doc_id
        )
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
        doc_record["status"] = DocumentStatus.COMPLETED
        doc_record["chunk_count"] = result["chunk_count"]
        doc_record["chroma_ids"] = result["chroma_ids"]
    except Exception as e:
        logger.error(f"Failed to load demo knowledge base: {e}")
        await db["documents"].update_one(
            {"_id": doc_id},
            {
                "$set": {
                    "status": DocumentStatus.FAILED,
                    "metadata": {"error": str(e)}
                }
            }
        )
        doc_record["status"] = DocumentStatus.FAILED
        doc_record["metadata"] = {"error": str(e)}

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
