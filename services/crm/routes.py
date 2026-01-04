from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List, Optional
from uuid import UUID

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from shared.database import get_db
from shared.search import search_client
from services.crm import models, schemas, logic
from services.auth import dependencies
from services.email_sync import models as email_models
from sqlalchemy import or_, func, desc

router = APIRouter(prefix="/api/v1/crm", tags=["crm"])

@router.get("/search", response_model=List[dict])
async def search_crm(
    q: str,
    index_type: str = Query("contacts", enum=["contacts", "deals", "companies"]),
    user = Depends(dependencies.get_current_active_user)
):
    """
    Search across CRM entities using ElasticSearch.
    """
    # Create index name usually namespaced by environment or user, 
    # but for simplicity assuming strict RBAC on filtered results or shared index with user_id field.
    # Here we assume a simple index name like "contacts"
    
    # In a real multi-tenant app, we must filter search results by user_id.
    # ES doesn't automatically do this unless encoded in the query.
    
    # Construct a complex query in shared/search.py would be better, 
    # but passing raw query str for now.
    
    fields_map = {
        "contacts": ["first_name", "last_name", "email", "phone"],
        "deals": ["title", "stage"],
        "companies": ["name", "industry"]
    }
    
    # We really need to filter by user_id in ES query.
    # The `search_client.search` wrapper is too simple for this.
    # Implementing a basic check:
    
    results = await search_client.search(
        index=index_type, 
        query=q, 
        fields=fields_map.get(index_type, [])
    )
    
    # In-memory filtering (Bad for simple production, but safe for MVP without complex ES mapping setup)
    # Ideally, we index `user_id` and add a `filter` clause in ES query.
    # Assuming the document was indexed with `user_id`.
    
    filtered = [r for r in results if r.get("user_id") == str(user.id)]
    return filtered

# --- Contacts ---

@router.get("/contacts", response_model=List[schemas.ContactResponse])
async def list_contacts(
    skip: int = 0, 
    limit: int = 50,
    status: Optional[str] = None,
    company_id: Optional[UUID] = None,
    user = Depends(dependencies.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(models.Contact).where(models.Contact.user_id == user.id)
    if status:
        query = query.where(models.Contact.lead_status == status)
    if company_id:
        query = query.where(models.Contact.company_id == company_id)
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/contacts", response_model=schemas.ContactResponse, status_code=status.HTTP_201_CREATED)
async def create_contact(
    contact: schemas.ContactCreate,
    user = Depends(dependencies.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    crm_validator = logic.CRMLogic(db)
    if contact.email:
        await crm_validator.check_contact_duplication(contact.email, user.id)

    db_contact = models.Contact(**contact.model_dump(), user_id=user.id)
    db.add(db_contact)
    await db.commit()
    await db.refresh(db_contact)
    
    # Index for Search (Async)
    # Ideally use a background task or event listener
    doc = contact.model_dump(mode='json')
    doc['user_id'] = str(user.id)
    await search_client.index_document("contacts", str(db_contact.id), doc)
    
    return db_contact

@router.get("/contacts/{id}", response_model=schemas.ContactResponse)
async def get_contact(
    id: UUID, 
    user = Depends(dependencies.get_current_active_user), 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(models.Contact).where(models.Contact.id == id, models.Contact.user_id == user.id))
    contact = result.scalars().first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact

@router.put("/contacts/{id}", response_model=schemas.ContactResponse)
async def update_contact(
    id: UUID, 
    contact_update: schemas.ContactUpdate,
    user = Depends(dependencies.get_current_active_user), 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(models.Contact).where(models.Contact.id == id, models.Contact.user_id == user.id))
    db_contact = result.scalars().first()
    if not db_contact:
        raise HTTPException(status_code=404, detail="Contact not found")
        
    update_data = contact_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_contact, key, value)
        
    await db.commit()
    await db.refresh(db_contact)
    return db_contact

@router.delete("/contacts/{id}")
async def delete_contact(
    id: UUID, 
    user = Depends(dependencies.get_current_active_user), 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(models.Contact).where(models.Contact.id == id, models.Contact.user_id == user.id))
    contact = result.scalars().first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
        
    await db.delete(contact)
    await db.commit()
    await db.delete(contact)
    await db.commit()
    return {"message": "Contact deleted"}

@router.get("/contacts/{id}/summary", response_model=schemas.ContactSummaryResponse)
async def get_contact_summary(
    id: UUID,
    user = Depends(dependencies.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. Get Contact
    result = await db.execute(select(models.Contact).where(models.Contact.id == id, models.Contact.user_id == user.id))
    contact = result.scalars().first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    if not contact.email:
        return schemas.ContactSummaryResponse(contact_id=id, summary_text="No email associated with contact.")

    # 2. Query Emails (Sent or Received)
    # We look for emails where FROM is contact OR TO/CC/BCC contains contact.
    # Note: to_addresses is ARRAY(String). Postgres 'ANY' operator or similar logic.
    # Using simple 'scan' logic or specific array operators is tricky in pure ORM sometimes.
    # We'll use strict overlaps or check.
    # Simplified: where from_address = contact.email OR contact.email = ANY(to_addresses)
    
    query = select(email_models.Email).where(
        email_models.Email.user_id == user.id,
        or_(
            email_models.Email.from_address == contact.email,
            email_models.Email.to_addresses.any(contact.email)
        )
    ).order_by(desc(email_models.Email.received_at))
    
    # Execute
    email_result = await db.execute(query)
    emails = email_result.scalars().all()
    
    if not emails:
        return schemas.ContactSummaryResponse(
            contact_id=id, 
            summary_text="No interactions found."
        )

    # 3. Calculate Stats
    total = len(emails)
    last_email = emails[0]
    first_email = emails[-1]
    
    return schemas.ContactSummaryResponse(
        contact_id=id,
        first_interaction=first_email.received_at,
        last_interaction=last_email.received_at,
        last_email_snippet=last_email.snippet,
        total_emails=total,
        summary_text=f"You have exchanged {total} emails with {contact.first_name}. Last interaction was on {last_email.received_at.strftime('%Y-%m-%d')}."
    )

# --- Deals ---

@router.get("/deals", response_model=List[schemas.DealResponse])
async def list_deals(
    skip: int = 0, 
    limit: int = 50,
    stage: Optional[str] = None,
    company_id: Optional[UUID] = None,
    user = Depends(dependencies.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(models.Deal).where(models.Deal.user_id == user.id)
    if stage:
        query = query.where(models.Deal.stage == stage)
    if company_id:
        query = query.where(models.Deal.company_id == company_id)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/deals", response_model=schemas.DealResponse, status_code=status.HTTP_201_CREATED)
async def create_deal(
    deal: schemas.DealCreate,
    user = Depends(dependencies.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    db_deal = models.Deal(**deal.model_dump(), user_id=user.id)
    db.add(db_deal)
    await db.commit()
    await db.refresh(db_deal)
    return db_deal

@router.post("/deals/{id}/stages")
async def update_deal_stage(
    id: UUID,
    stage_update: schemas.DealStageUpdate,
    user = Depends(dependencies.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(models.Deal).where(models.Deal.id == id, models.Deal.user_id == user.id))
    deal = result.scalars().first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
        
    crm_validator = logic.CRMLogic(db)
    await crm_validator.validate_deal_stage_transition(deal.id, stage_update.stage, deal.stage)
    
    deal.stage = stage_update.stage
    deal.probability = await crm_validator.calculate_deal_probability(deal.stage)
    
    await db.commit()
    return {"message": "Stage updated", "new_stage": deal.stage, "probability": deal.probability}


# --- Companies ---

@router.get("/companies", response_model=List[schemas.CompanyResponse])
async def list_companies(
    skip: int = 0, 
    limit: int = 50,
    user = Depends(dependencies.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(models.Company).where(models.Company.user_id == user.id).offset(skip).limit(limit)
    )
    return result.scalars().all()

@router.get("/companies/{id}", response_model=schemas.CompanyResponse)
async def get_company(
    id: UUID, 
    user = Depends(dependencies.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(models.Company).where(models.Company.id == id, models.Company.user_id == user.id))
    company = result.scalars().first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@router.post("/companies", response_model=schemas.CompanyResponse, status_code=status.HTTP_201_CREATED)
async def create_company(
    company: schemas.CompanyCreate,
    user = Depends(dependencies.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    db_company = models.Company(**company.model_dump(), user_id=user.id)
    db.add(db_company)
    await db.commit()
    await db.refresh(db_company)
    return db_company

# --- Activities ---

@router.get("/activities", response_model=List[schemas.ActivityResponse])
async def list_activities(
    skip: int = 0, 
    limit: int = 50,
    contact_id: Optional[UUID] = None,
    user = Depends(dependencies.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(models.Activity).where(models.Activity.user_id == user.id)
    if contact_id:
        query = query.where(models.Activity.contact_id == contact_id)
    query = query.order_by(models.Activity.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/activities", response_model=schemas.ActivityResponse, status_code=status.HTTP_201_CREATED)
async def log_activity(
    activity: schemas.ActivityCreate,
    user = Depends(dependencies.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    db_activity = models.Activity(**activity.model_dump(), user_id=user.id)
    db.add(db_activity)
    await db.commit()
    await db.refresh(db_activity)
    
    # Update last_contact_date on Contact
    if activity.contact_id:
        # We need to act carefully not to break if contact doesn't exist (though FK constraint usually handles this)
        # Assuming we just fire and forget or simple update
        await db.execute(
            select(models.Contact).where(models.Contact.id == activity.contact_id)
        )
        # Ideally we fetch and update.
        # Keeping it simple for now.    
        
    return db_activity
