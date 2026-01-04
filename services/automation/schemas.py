from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime

class WorkflowBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True
    trigger_type: str
    conditions: List[Dict[str, Any]] = []
    actions: List[Dict[str, Any]] = []

class WorkflowCreate(WorkflowBase):
    pass

class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None
    conditions: Optional[List[Dict[str, Any]]] = None
    actions: Optional[List[Dict[str, Any]]] = None

class WorkflowResponse(WorkflowBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class WorkflowExecutionResponse(BaseModel):
    id: UUID
    workflow_id: UUID
    status: str
    executed_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
