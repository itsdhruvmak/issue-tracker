from app.models import organization
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class InviteCreate(BaseModel):
    email: EmailStr

class InviteRead(BaseModel):
    id: int
    email: str
    organization_id: int
    role: str
    expires_at: datetime
    created_at: datetime
    accepted_at: Optional[datetime] = None

    class Config:
        from_attributes=True

class InvitePublicInfo(BaseModel):
    email: str
    organization_name: str
    expires_at: datetime
    is_valid: bool

class InviteAcceptPayload(BaseModel):
    username: str
    full_name: Optional[str] = None
    password: str
    