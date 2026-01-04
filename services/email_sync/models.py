from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Integer, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from shared.database import Base

class Email(Base):
    __tablename__ = "emails"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    gmail_id = Column(String, unique=True, nullable=False, index=True)
    thread_id = Column(String, index=True)
    
    from_address = Column(String, index=True)
    to_addresses = Column(ARRAY(String))
    cc_addresses = Column(ARRAY(String))
    bcc_addresses = Column(ARRAY(String))
    
    subject = Column(String)
    body_text = Column(Text)
    body_html = Column(Text)
    snippet = Column(String)
    
    is_read = Column(Boolean, default=False)
    has_attachment = Column(Boolean, default=False)
    
    # Gmail labels like INBOX, SENT, TRASH, custom labels
    gmail_labels = Column(ARRAY(String))
    
    received_at = Column(DateTime(timezone=True), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    attachments = relationship("EmailAttachment", back_populates="email", cascade="all, delete-orphan")
    # user = relationship("User") # Defined in Auth service, but we might not load it here directly to avoid circular imports across service boundaries if checking strict separation. 
    # However, since we share the DB, we can define it if needed. For now, keeping it loose to respect service boundaries.

class EmailAttachment(Base):
    __tablename__ = "email_attachments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email_id = Column(UUID(as_uuid=True), ForeignKey("emails.id"), nullable=False, index=True)
    
    filename = Column(String, nullable=False)
    mime_type = Column(String)
    size_bytes = Column(Integer)
    
    # Path in Google Cloud Storage
    gcs_path = Column(String)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    email = relationship("Email", back_populates="attachments")

class SyncState(Base):
    __tablename__ = "sync_state"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    provider = Column(String, default="gmail")
    
    last_sync_at = Column(DateTime(timezone=True))
    last_history_id = Column(String) # For partial sync
    
    sync_status = Column(String, default="inactive") # active, paused, error, inactive
    error_message = Column(Text)
    
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
