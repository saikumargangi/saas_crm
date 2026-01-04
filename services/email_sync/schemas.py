from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import UUID

class EmailBase(BaseModel):
    gmail_id: str
    from_address: Optional[str] = None
    to_addresses: Optional[List[str]] = []
    cc_addresses: Optional[List[str]] = []
    bcc_addresses: Optional[List[str]] = []
    subject: Optional[str] = None
    body_text: Optional[str] = None
    body_html: Optional[str] = None
    snippet: Optional[str] = None
    is_read: bool = False
    
class EmailResponse(EmailBase):
    id: UUID
    received_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class SyncStatusResponse(BaseModel):
    status: str
    last_sync: Optional[datetime] = None
    message: Optional[str] = None
