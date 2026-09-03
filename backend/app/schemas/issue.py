from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ── Attachment Schemas ────────────────────────────────────────────────────────

class IssueAttachmentCreate(BaseModel):
    file_name: str
    file_url: str
    public_id: Optional[str] = None
    resource_type: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None


class IssueAttachmentOut(IssueAttachmentCreate):
    id: int
    issue_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Issue Schemas ─────────────────────────────────────────────────────────────

class IssueBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = "open"
    priority: Optional[str] = "medium"
    reporter: Optional[str] = None
    assignee: Optional[str] = None


class IssueCreate(IssueBase):
    pass


class IssueUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    reporter: Optional[str] = None
    assignee: Optional[str] = None


class IssueOut(IssueBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    attachments: List[IssueAttachmentOut] = []

    class Config:
        from_attributes = True
