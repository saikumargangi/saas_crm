from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime

class IntegrationBase(BaseModel):
    provider: str
    name: Optional[str] = None
    config: Dict[str, Any] = {}
    is_active: bool = True

class IntegrationCreate(IntegrationBase):
    pass

class IntegrationUpdate(BaseModel):
    name: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class IntegrationResponse(IntegrationBase):
    id: UUID
    executed_at: Optional[datetime] = None # Placeholder if needed
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
