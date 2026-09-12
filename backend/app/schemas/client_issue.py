from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.issue import IssueAttachmentOut

class ClientIssueCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Optional[str] = "medium"

class ClientIssueRead(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    attachments: List[IssueAttachmentOut] = []

    class Config: 
        from_attributes = True
        