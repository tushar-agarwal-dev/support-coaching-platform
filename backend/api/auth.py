import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from backend.database.mongodb import get_database
from backend.schemas.user import UserCreate, UserResponse, UserRole
from backend.schemas.auth import Token
from backend.services.auth import get_password_hash, verify_password, create_access_token

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_in: UserCreate, db = Depends(get_database)):
    # Check if user already exists
    email_normalized = user_in.email.strip().lower()
    existing_user = await db["users"].find_one({"email": email_normalized})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Prepare user record
    hashed_pwd = get_password_hash(user_in.password)
    user_id = str(uuid.uuid4())
    
    new_user = {
        "_id": user_id,
        "email": email_normalized,
        "hashed_password": hashed_pwd,
        "full_name": user_in.full_name,
        "role": user_in.role,
        "created_at": datetime.utcnow()
    }
    
    await db["users"].insert_one(new_user)
    
    # Return user info
    new_user["id"] = user_id
    return new_user

@router.post("/login", response_model=Token)
async def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db = Depends(get_database)):
    # Look up user by email
    email_normalized = form_data.username.strip().lower()
    user = await db["users"].find_one({"email": email_normalized})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate token
    token_data = {"sub": user["email"], "role": user["role"]}
    access_token = create_access_token(data=token_data)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user["role"],
        "email": user["email"],
        "full_name": user["full_name"]
    }

@router.post("/guest-login", response_model=Token)
async def guest_login(db = Depends(get_database)):
    # Generate random guest details
    guest_uuid = str(uuid.uuid4())[:8]
    guest_email = f"guest_{guest_uuid}@vantrixai.demo"
    guest_name = f"Guest Agent {guest_uuid}"
    
    # Store guest user record in MongoDB
    hashed_pwd = get_password_hash(guest_uuid)
    
    new_user = {
        "_id": guest_uuid,
        "email": guest_email,
        "hashed_password": hashed_pwd,
        "full_name": guest_name,
        "role": UserRole.AGENT,
        "is_guest": True,
        "created_at": datetime.utcnow()
    }
    await db["users"].insert_one(new_user)
    
    # Generate token
    token_data = {"sub": guest_email, "role": UserRole.AGENT}
    access_token = create_access_token(data=token_data)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": UserRole.AGENT,
        "email": guest_email,
        "full_name": guest_name
    }

from backend.services.auth import get_current_user
from backend.rag.pipeline import RAGPipeline

@router.post("/guest-cleanup")
async def guest_cleanup(current_user: dict = Depends(get_current_user), db = Depends(get_database)):
    # Check if the user is indeed a guest
    if not current_user.get("is_guest") and not current_user["email"].endswith("@vantrixai.demo"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not a guest"
        )
        
    user_id = current_user["id"]
    
    # 1. Clean up sessions
    await db["sessions"].delete_many({"agent_id": user_id})
    
    # 2. Clean up knowledge base documents (MongoDB & ChromaDB)
    cursor = db["documents"].find({"uploaded_by": user_id})
    async for doc in cursor:
        doc_id = doc["_id"]
        chroma_ids = doc.get("chroma_ids", [])
        try:
            # Delete vectors
            RAGPipeline.delete_document_vectors(doc_id, chroma_ids)
        except Exception as e:
            # Continue even if chroma deletion fails
            pass
            
    await db["documents"].delete_many({"uploaded_by": user_id})
    
    # 3. Delete the user
    await db["users"].delete_one({"_id": user_id})
    
    return {"message": "Guest data successfully cleared"}
