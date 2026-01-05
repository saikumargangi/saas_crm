from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, Float, Date, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from shared.database import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False, index=True)
    website = Column(String)
    industry = Column(String)
    annual_revenue = Column(Numeric(precision=15, scale=2))
    employee_count = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    contacts = relationship("Contact", back_populates="company")
    deals = relationship("Deal", back_populates="company")

class Contact(Base):
    __tablename__ = "contacts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    email = Column(String, index=True)
    first_name = Column(String)
    last_name = Column(String)
    phone = Column(String)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"))
    
    lead_score = Column(Integer, default=0)
    lead_status = Column(String, default="new", index=True) # new, qualified, contacted, converted, lost
    source = Column(String) # email, manual, import, api
    custom_fields = Column(JSONB)
    
    # MVP Feature: Follow-up tracking
    needs_follow_up = Column(Boolean, default=False, index=True)
    follow_up_note = Column(Text)
    follow_up_priority = Column(String) # high, medium, low
    follow_up_date = Column(DateTime(timezone=True))
    
    last_email_date = Column(DateTime(timezone=True))
    last_contact_date = Column(DateTime(timezone=True))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())


    company = relationship("Company", back_populates="contacts")
    deals = relationship("Deal", back_populates="contact")
    activities = relationship("Activity", back_populates="contact")

class Deal(Base):
    __tablename__ = "deals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id"))
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"))
    
    title = Column(String, nullable=False)
    amount = Column(Numeric(precision=15, scale=2))
    currency = Column(String, default='USD')
    stage = Column(String, default="prospect", index=True) # prospect, negotiation, committed, won, lost
    probability = Column(Integer)
    expected_close_date = Column(Date)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    contact = relationship("Contact", back_populates="deals")
    company = relationship("Company", back_populates="deals")
    activities = relationship("Activity", back_populates="deal")

class Activity(Base):
    __tablename__ = "activities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id"), index=True)
    deal_id = Column(UUID(as_uuid=True), ForeignKey("deals.id"))
    email_id = Column(UUID(as_uuid=True), ForeignKey("emails.id"))
    
    type = Column(String, nullable=False) # email, call, meeting, note, task
    subject = Column(String)
    description = Column(Text)
    activity_metadata = Column(JSONB)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    contact = relationship("Contact", back_populates="activities")
    deal = relationship("Deal", back_populates="activities")
    # email relationship is loose to avoid circular dep, but we can define if needed
