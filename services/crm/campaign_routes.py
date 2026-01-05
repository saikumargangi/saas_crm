"""
Campaign Routes - MVP Feature 4
Search and resend cold emails by product
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from typing import List, Optional
from uuid import UUID
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from shared.database import get_db
from services.crm.campaign_models import Campaign, CampaignEmail
from services.crm.models import Contact
from services.email_sync.models import Email
from services.auth import dependencies

router = APIRouter(prefix="/api/v1/campaigns", tags=["campaigns"])


@router.get("/cold-emails")
async def list_cold_email_campaigns(
    skip: int = 0,
    limit: int = 50,
    user = Depends(dependencies.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all cold email campaigns created by the user.
    """
    query = select(Campaign).where(
        Campaign.user_id == user.id
    ).order_by(Campaign.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    campaigns = result.scalars().all()
    
    # Enrich with email counts
    response = []
    for campaign in campaigns:
        # Count emails in this campaign
        count_query = select(func.count(CampaignEmail.id)).where(
            CampaignEmail.campaign_id == campaign.id
        )
        count_result = await db.execute(count_query)
        email_count = count_result.scalar()
        
        response.append({
            "id": str(campaign.id),
            "name": campaign.name,
            "product": campaign.product,
            "description": campaign.description,
            "email_count": email_count,
            "created_at": campaign.created_at.isoformat()
        })
    
    return {"campaigns": response, "total": len(response)}


@router.post("/search")
async def search_contacts_by_product(
    search_request: dict,
    user = Depends(dependencies.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Search for contacts who were contacted about a specific product.
    Uses AI to detect product mentions in email content.
    
    Request body:
    {
        "product": "Product Name",
        "date_range": {"start": "2024-01-01", "end": "2024-12-31"} (optional)
    }
    """
    product = search_request.get('product', '')
    date_range = search_request.get('date_range')
    
    if not product:
        raise HTTPException(status_code=400, detail="Product name is required")
    
    # Search emails for product mentions
    # Using simple text search for MVP, can be enhanced with AI later
    query = select(Email).where(
        Email.user_id == user.id,
        or_(
            Email.subject.ilike(f'%{product}%'),
            Email.body_text.ilike(f'%{product}%'),
            Email.snippet.ilike(f'%{product}%')
        )
    )
    
    # Apply date range filter if provided
    if date_range:
        from datetime import datetime
        start_date = datetime.fromisoformat(date_range.get('start'))
        end_date = datetime.fromisoformat(date_range.get('end'))
        query = query.where(
            Email.received_at >= start_date,
            Email.received_at <= end_date
        )
    
    result = await db.execute(query)
    emails = result.scalars().all()
    
    # Extract unique contacts from these emails
    contact_emails = set()
    for email in emails:
        # Add recipients (to_addresses)
        if email.to_addresses:
            contact_emails.update(email.to_addresses)
    
    # Get contact details
    contacts = []
    for email_addr in contact_emails:
        contact_query = select(Contact).where(
            Contact.user_id == user.id,
            Contact.email == email_addr
        )
        contact_result = await db.execute(contact_query)
        contact = contact_result.scalars().first()
        
        if contact:
            # Count emails about this product with this contact
            email_count_query = select(func.count(Email.id)).where(
                Email.user_id == user.id,
                or_(
                    Email.from_address == email_addr,
                    Email.to_addresses.contains([email_addr])
                ),
                or_(
                    Email.subject.ilike(f'%{product}%'),
                    Email.body_text.ilike(f'%{product}%')
                )
            )
            count_result = await db.execute(email_count_query)
            email_count = count_result.scalar()
            
            contacts.append({
                "id": str(contact.id),
                "name": f"{contact.first_name} {contact.last_name}" if contact.first_name else email_addr,
                "email": email_addr,
                "email_count": email_count,
                "last_email_date": contact.last_email_date.isoformat() if contact.last_email_date else None
            })
    
    return {
        "product": product,
        "contacts": contacts,
        "total": len(contacts)
    }


@router.post("/resend")
async def resend_to_contacts(
    resend_request: dict,
    background_tasks: BackgroundTasks,
    user = Depends(dependencies.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a campaign and prepare to send emails to selected contacts.
    
    Request body:
    {
        "campaign_name": "New Product Launch",
        "product": "Product X",
        "contact_ids": ["uuid1", "uuid2", ...],
        "email_template": {
            "subject": "...",
            "body": "..."
        }
    }
    """
    campaign_name = resend_request.get('campaign_name', 'Untitled Campaign')
    product = resend_request.get('product', '')
    contact_ids = resend_request.get('contact_ids', [])
    email_template = resend_request.get('email_template', {})
    
    if not contact_ids:
        raise HTTPException(status_code=400, detail="No contacts selected")
    
    if not email_template.get('subject') or not email_template.get('body'):
        raise HTTPException(status_code=400, detail="Email template is required")
    
    # Create campaign
    campaign = Campaign(
        user_id=user.id,
        name=campaign_name,
        product=product,
        description=f"Campaign for {product} to {len(contact_ids)} contacts"
    )
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)
    
    # Create campaign email records
    campaign_emails_created = []
    for contact_id_str in contact_ids:
        try:
            contact_id = UUID(contact_id_str)
            
            # Verify contact exists and belongs to user
            contact_query = select(Contact).where(
                Contact.id == contact_id,
                Contact.user_id == user.id
            )
            contact_result = await db.execute(contact_query)
            contact = contact_result.scalars().first()
            
            if contact:
                campaign_email = CampaignEmail(
                    campaign_id=campaign.id,
                    contact_id=contact.id,
                    email_id=None  # Will be set when email is actually sent
                )
                db.add(campaign_email)
                campaign_emails_created.append({
                    "contact_id": str(contact.id),
                    "email": contact.email
                })
        except Exception as e:
            continue
    
    await db.commit()
    
    # TODO: Actually send emails via Gmail API in background task
    # For MVP, we just create the campaign and records
    # background_tasks.add_task(send_campaign_emails, campaign.id, email_template)
    
    return {
        "campaign_id": str(campaign.id),
        "campaign_name": campaign_name,
        "product": product,
        "contacts_added": len(campaign_emails_created),
        "status": "created",
        "message": "Campaign created. Email sending will be implemented in next phase."
    }
