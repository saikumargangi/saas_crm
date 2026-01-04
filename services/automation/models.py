from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from shared.database import Base

class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    
    # Trigger Event: e.g. "email.received", "deal.created", "contact.updated"
    trigger_type = Column(String, nullable=False, index=True)
    
    # Conditions: JSON Logic format or list of rules
    # e.g. {"field": "lead_score", "operator": "gt", "value": 50}
    conditions = Column(JSONB, default=list)
    
    # Actions: List of actions to take if conditions met
    # e.g. [{"type": "send_email", "template_id": "...", "to": "..."}]
    actions = Column(JSONB, default=list)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    
    # Execution history could be a separate table "WorkflowExecution"
    executions = relationship("WorkflowExecution", back_populates="workflow", cascade="all, delete-orphan")

class WorkflowExecution(Base):
    __tablename__ = "workflow_executions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("workflows.id"), nullable=False, index=True)
    
    status = Column(String, default="pending") # pending, success, failed
    trigger_data = Column(JSONB) # Snapshot of data that triggered it
    result = Column(JSONB) # Output of actions
    error_message = Column(Text)
    
    executed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    workflow = relationship("Workflow", back_populates="executions")
