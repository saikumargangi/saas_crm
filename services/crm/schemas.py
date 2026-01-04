from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, date
from decimal import Decimal

# --- Company Schemas ---
class CompanyBase(BaseModel):
    name: str
    website: Optional[str] = None
    industry: Optional[str] = None
    annual_revenue: Optional[Decimal] = None
    employee_count: Optional[int] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(CompanyBase):
    name: Optional[str] = None

class CompanyResponse(CompanyBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Contact Schemas ---
class ContactBase(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    company_id: Optional[UUID] = None
    lead_status: Optional[str] = "new"
    source: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None

class ContactCreate(ContactBase):
    pass

class ContactUpdate(ContactBase):
    pass

class ContactResponse(ContactBase):
    id: UUID
    lead_score: int
    last_email_date: Optional[datetime] = None
    last_contact_date: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Nested company for convenience (optional)
    company: Optional[CompanyResponse] = None

    class Config:
        from_attributes = True

class ContactSummaryResponse(BaseModel):
    contact_id: UUID
    first_interaction: Optional[datetime] = None
    last_interaction: Optional[datetime] = None
    last_email_snippet: Optional[str] = None
    total_emails: int = 0
    summary_text: Optional[str] = None

# --- Deal Schemas ---
class DealBase(BaseModel):
    title: str
    amount: Optional[Decimal] = None
    currency: Optional[str] = "USD"
    stage: str = "prospect"
    probability: Optional[int] = None
    expected_close_date: Optional[date] = None
    contact_id: Optional[UUID] = None
    company_id: Optional[UUID] = None

class DealCreate(DealBase):
    pass

class DealResponse(DealBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        
class DealStageUpdate(BaseModel):
    stage: str

# --- Activity Schemas ---
class ActivityBase(BaseModel):
    type: str
    subject: Optional[str] = None
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    contact_id: Optional[UUID] = None
    deal_id: Optional[UUID] = None
    email_id: Optional[UUID] = None

class ActivityCreate(ActivityBase):
    pass

class ActivityResponse(ActivityBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
