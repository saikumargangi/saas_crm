from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
import sys
import os

# Add parent directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from shared.database import get_db
from services.email_sync import models, schemas, sync_manager, gmail_client
from services.auth import dependencies

router = APIRouter(prefix="/api/v1/email", tags=["email"])

# ============================================================================
# MVP FEATURE 1: Person-Based Email Grouping & AI Summaries
# ============================================================================

@router.get("/by-person")
async def get_emails_by_person(
    user = Depends(dependencies.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Group all emails by person (sender/recipient).
    Returns list of people with email counts and last interaction date.
    """
    from sqlalchemy import func, case, distinct
    from services.crm.models import Contact
    
    # Get all unique email addresses from emails table
    # Union of from_address and to_addresses
    query = select(
        models.Email.from_address.label('email'),
        func.count(models.Email.id).label('email_count'),
        func.max(models.Email.received_at).label('last_email_date'),
        func.min(models.Email.received_at).label('first_email_date')
    ).where(
        models.Email.user_id == user.id
    ).group_by(models.Email.from_address)
    
    result = await db.execute(query)
    people = result.all()
    
    # Enrich with contact information
    response = []
    for person in people:
        # Try to find matching contact
        contact_query = select(Contact).where(
            Contact.user_id == user.id,
            Contact.email == person.email
        )
        contact_result = await db.execute(contact_query)
        contact = contact_result.scalars().first()
        
        response.append({
            "email": person.email,
            "name": f"{contact.first_name} {contact.last_name}" if contact and contact.first_name else person.email,
            "email_count": person.email_count,
            "last_email_date": person.last_email_date.isoformat() if person.last_email_date else None,
            "first_email_date": person.first_email_date.isoformat() if person.first_email_date else None,
            "contact_id": str(contact.id) if contact else None,
            "needs_follow_up": contact.needs_follow_up if contact else False
        })
    
    # Sort by last email date (most recent first)
    response.sort(key=lambda x: x['last_email_date'] or '', reverse=True)
    
    return {"people": response, "total": len(response)}

@router.get("/person/{email}/summary")
async def get_person_email_summary(
    email: str,
    user = Depends(dependencies.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    AI-generated summary of all interactions with a specific person.
    Uses Gemini to analyze email thread and generate insights.
    """
    # Get all emails with this person
    query = select(models.Email).where(
        models.Email.user_id == user.id,
        or_(
            models.Email.from_address == email,
            models.Email.to_addresses.contains([email])
        )
    ).order_by(models.Email.received_at.desc())
    
    result = await db.execute(query)
    emails = result.scalars().all()
    
    if not emails:
        return {
            "email": email,
            "summary": "No email interactions found with this person.",
            "total_emails": 0
        }
    
    # Use AI to generate summary
    from services.ai.classifiers import ai_classifier
    import os
    
    # Prepare context for AI
    email_texts = []
    for e in emails[:10]:  # Last 10 emails for context
        direction = "from" if e.from_address == email else "to"
        email_texts.append(f"{direction.upper()}: {e.subject}\n{e.body_text[:500] if e.body_text else e.snippet}")
    
    context = "\n\n---\n\n".join(email_texts)
    
    # Generate AI summary using Gemini
    try:
        import google.generativeai as genai
        genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
        model = genai.GenerativeModel('gemini-pro')
        
        prompt = f"""Analyze this email conversation history and provide a concise summary.

Email conversation with: {email}
Total emails: {len(emails)}

Recent emails:
{context}

Provide a summary that includes:
1. Main topics discussed
2. Current status of the relationship
3. Key action items or next steps
4. Overall sentiment (positive/neutral/negative)

Keep the summary under 200 words."""
        
        response = model.generate_content(prompt)
        summary_text = response.text
        
    except Exception as e:
        # Fallback to basic summary if AI fails
        summary_text = f"You have exchanged {len(emails)} emails with {email}. Last email was on {emails[0].received_at.strftime('%Y-%m-%d')}."
    
    return {
        "email": email,
        "summary": summary_text,
        "total_emails": len(emails),
        "first_email_date": emails[-1].received_at.isoformat() if emails else None,
        "last_email_date": emails[0].received_at.isoformat() if emails else None
    }

@router.get("/person/{email}/thread")
async def get_person_email_thread(
    email: str,
    skip: int = 0,
    limit: int = 50,
    user = Depends(dependencies.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all emails with a specific person in chronological order.
    Shows full conversation thread.
    """
    query = select(models.Email).where(
        models.Email.user_id == user.id,
        or_(
            models.Email.from_address == email,
            models.Email.to_addresses.contains([email])
        )
    ).order_by(models.Email.received_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    emails = result.scalars().all()
    
    thread = []
    for e in emails:
        thread.append({
            "id": str(e.id),
            "subject": e.subject,
            "from": e.from_address,
            "to": e.to_addresses,
            "body": e.body_text or e.snippet,
            "received_at": e.received_at.isoformat(),
            "is_read": e.is_read,
            "direction": "received" if e.from_address == email else "sent"
        })
    
    return {
        "email": email,
        "thread": thread,
        "total": len(thread)
    }

# ============================================================================
# Existing Endpoints
# ============================================================================

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

@router.get("/sync/status")
async def get_sync_status(
    user = Depends(dependencies.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current sync status for the user"""
    try:
        # Check if user has OAuth token
        from services.auth.models import OAuthToken
        result = await db.execute(select(OAuthToken).where(
            OAuthToken.user_id == user.id,
            OAuthToken.provider == 'gmail'
        ))
        token_record = result.scalars().first()
        
        if not token_record:
            return {
                "status": "not_connected",
                "sync_status": "inactive",
                "message": "Gmail not connected"
            }
        
        # Check sync state
        sync_state_result = await db.execute(
            select(models.SyncState).where(models.SyncState.user_id == user.id)
        )
        sync_state = sync_state_result.scalars().first()
        
        if not sync_state:
            return {
                "status": "connected",
                "sync_status": "not_started",
                "email": user.email,
                "last_sync_at": None
            }
        
        return {
            "status": "connected",
            "sync_status": "active" if sync_state.sync_status == 'active' else "idle",
            "email": user.email,
            "last_sync_at": sync_state.last_sync_at.isoformat() if sync_state.last_sync_at else None,
            "last_history_id": sync_state.last_history_id,
            "total_emails": 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get sync status: {str(e)}")

@router.post("/sync/start")
async def start_sync(
    background_tasks: BackgroundTasks,
    manager: sync_manager.SyncManager = Depends(get_sync_manager)
):
    """Start email synchronization"""
    # Run sync in background
    background_tasks.add_task(manager.initial_sync)
    return {"message": "Sync started in background", "status": "started"}

@router.post("/sync/stop")
async def stop_sync(
    user = Depends(dependencies.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Stop ongoing email synchronization"""
    try:
        # Update sync state to stop syncing
        sync_state_result = await db.execute(
            select(models.SyncState).where(models.SyncState.user_id == user.id)
        )
        sync_state = sync_state_result.scalars().first()
        
        if sync_state:
            sync_state.sync_status = "inactive"
            await db.commit()
            return {"message": "Sync stopped", "status": "stopped"}
        
        return {"message": "No active sync found", "status": "not_running"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stop sync: {str(e)}")



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

