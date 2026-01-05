from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Dict, Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from services.ai.scoring import scorer
from services.ai.classification import classifier
from services.ai.actions import generator
from services.auth import dependencies
from shared.database import get_db

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])

@router.post("/score/lead")
async def score_lead(
    profile: Dict[str, Any] = Body(...),
    activities: List[Dict[str, Any]] = Body(...),
    user = Depends(dependencies.get_current_active_user)
):
    """
    Calculates lead score based on profile and activity history.
    """
    score = scorer.evaluate(profile, activities)
    return {"score": score}

@router.post("/classify/email")
async def classify_email(
    subject: str = Body(...),
    body: str = Body(...),
    user = Depends(dependencies.get_current_active_user)
):
    """
    Classifies email intent.
    """
    scores = classifier.classify(subject, body)
    return {"classification": scores}

@router.post("/suggest/actions")
async def suggest_next_actions(
    classification: Dict[str, float] = Body(...),
    context: Dict[str, Any] = Body(...),
    user = Depends(dependencies.get_current_active_user)
):
    """
    Suggests next actions based on classification.
    """
    suggestions = generator.suggest_actions(classification, context)
    return {"actions": suggestions}

# ============================================================================
# MVP FEATURE 3: AI Email Drafting
# ============================================================================

@router.post("/draft-email")
async def draft_follow_up_email(
    draft_request: dict,
    user = Depends(dependencies.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate AI-powered email draft based on contact history and context.
    
    Request body:
    {
        "contact_id": "uuid",
        "context": "reason for follow-up",
        "tone": "professional|casual|friendly"
    }
    """
    from services.ai.email_drafter import email_drafter
    from services.crm.models import Contact
    from services.email_sync.models import Email
    
    contact_id = draft_request.get('contact_id')
    context = draft_request.get('context', 'general follow-up')
    tone = draft_request.get('tone', 'professional')
    
    # Get contact
    result = await db.execute(select(Contact).where(
        Contact.id == UUID(contact_id),
        Contact.user_id == user.id
    ))
    contact = result.scalars().first()
    
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    # Get email history with this contact
    email_query = select(Email).where(
        Email.user_id == user.id,
        or_(
            Email.from_address == contact.email,
            Email.to_addresses.contains([contact.email])
        )
    ).order_by(Email.received_at.desc()).limit(10)
    
    email_result = await db.execute(email_query)
    emails = email_result.scalars().all()
    
    # Prepare email history for AI
    email_history = []
    for e in emails:
        email_history.append({
            "subject": e.subject,
            "body": e.body_text or e.snippet,
            "direction": "received" if e.from_address == contact.email else "sent",
            "date": e.received_at.isoformat()
        })
    
    # Generate draft using AI
    draft = await email_drafter.draft_follow_up_email(
        contact_email=contact.email,
        contact_name=f"{contact.first_name} {contact.last_name}" if contact.first_name else None,
        email_history=email_history,
        context=context,
        tone=tone
    )
    
    return {
        "contact_id": str(contact.id),
        "contact_email": contact.email,
        "draft": draft
    }
