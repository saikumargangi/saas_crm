from sqlalchemy import Column, String, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from shared.database import Base
import uuid


class Notification(Base):
    """In-app notifications for users"""
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String(50), nullable=False)  # email_received, deal_updated, etc.
    title = Column(String(255), nullable=False)
    message = Column(String(1000), nullable=False)
    link = Column(String(500))  # Optional link to related resource
    is_read = Column(Boolean, default=False, index=True)
    metadata = Column(JSON)  # Additional data
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True))


class NotificationPreference(Base):
    """User notification preferences"""
    __tablename__ = "notification_preferences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    email_enabled = Column(Boolean, default=True)
    in_app_enabled = Column(Boolean, default=True)
    webhook_enabled = Column(Boolean, default=False)
    webhook_url = Column(String(500))
    
    # Notification type preferences
    notify_new_email = Column(Boolean, default=True)
    notify_deal_update = Column(Boolean, default=True)
    notify_contact_update = Column(Boolean, default=False)
    notify_workflow_complete = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
