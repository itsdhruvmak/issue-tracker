from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class OrganizationCreate(BaseModel):
    name: str
    domain: Optional[str] = None

class OrganizationRead(BaseModel):
    id: int
    name: str
    domain: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class OrgAdminInviteRequest(BaseModel):
    email: EmailStr