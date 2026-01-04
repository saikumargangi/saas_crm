from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import sys
import os

# Add parent directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from shared.database import get_db
from services.email_sync import models, schemas, sync_manager, gmail_client
from services.auth import dependencies

router = APIRouter(prefix="/api/v1/email", tags=["email"])

async def get_sync_manager(
    user = Depends(dependencies.get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> sync_manager.SyncManager:
    
    # 1. Fetch tokens from DB (Auth Service Table)
    # Note: Since models are in different service module, we query raw SQL or duplicated model
    # OR we import models from auth service. 
    # For monolithic codebase (which this is right now), we can import.
    from services.auth.models import OAuthToken
    
    result = await db.execute(select(OAuthToken).where(
        OAuthToken.user_id == user.id, 
        OAuthToken.provider == 'gmail'
    ))
    token_record = result.scalars().first()
    
    if not token_record:
        raise HTTPException(status_code=400, detail="Gmail not connected")
        
    # Decrypt tokens (using utils from auth or shared)
    from services.auth.utils import decrypt_token # Tight coupling, but practical for now
    
    access_token = decrypt_token(token_record.access_token)
    refresh_token = decrypt_token(token_record.refresh_token)
    
    # TODO: Load Client ID/Secret from env
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    
    g_client = gmail_client.GmailClient(access_token, refresh_token, client_id, client_secret)
    return sync_manager.SyncManager(db, g_client, user.id)

@router.post("/sync/start")
async def start_sync(
    background_tasks: BackgroundTasks,
    manager: sync_manager.SyncManager = Depends(get_sync_manager)
):
    # Run sync in background
    background_tasks.add_task(manager.initial_sync)
    return {"message": "Sync started in background"}

@router.get("/messages", response_model=List[schemas.EmailResponse])
async def list_messages(
    skip: int = 0, 
    limit: int = 50,
    user = Depends(dependencies.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(models.Email)
        .where(models.Email.user_id == user.id)
        .order_by(models.Email.received_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

@router.post("/webhooks")
async def webhook_handler(
    payload: dict,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    # Payload structure from Gmail Push:
    # {
    #   "message": {
    #     "data": "base64-encoded-json",
    #     "messageId": "..."
    #   },
    #   "subscription": "..."
    # }
    
    if not payload or 'message' not in payload:
        return {"status": "ignored", "reason": "invalid_payload"}

    try:
        import base64
        import json
        
        # Decode data
        encoded_data = payload['message']['data']
        decoded_data = base64.b64decode(encoded_data).decode('utf-8')
        data = json.loads(decoded_data)
        
        # Data structure: { "emailAddress": "user@example.com", "historyId": "12345" }
        email_address = data.get('emailAddress')
        history_id = data.get('historyId')
        
        if not email_address or not history_id:
             return {"status": "ignored", "reason": "missing_fields"}
        
        # Find user by email
        from services.auth.models import User
        result = await db.execute(select(User).where(User.email == email_address))
        user = result.scalars().first()
        
        if not user:
             # Log warning: received webhook for unknown user
             return {"status": "ignored", "reason": "user_not_found"}
             
        # Trigger Delta Sync
        # We need to construct the manager, which requires decrypting tokens again.
        # Ideally, we'd refactor `get_sync_manager` to be usable without `Depends`
        # For now, we'll replicate the construction logic inside a background task wrapper
        
        async def run_sync_job(user_id: str, start_history_id: str):
             # Create new session for background task
             # (This is pseudo-code complexity, in real app we need a fresh session factory)
             pass 
             # TO DO: Background task session management is tricky with Depends. 
             # We will just acknowledge for now as this requires architectural refinement for background workers.
             
        return {"status": "received", "historyId": history_id, "user": email_address}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

