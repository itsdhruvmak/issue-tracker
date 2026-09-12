from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class Invite(Base):
    __tablename__ = "invites"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, nullable=False, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    role=Column(String, nullable=False)
    #"org_admin" | "client_member"
    token_hash = Column(String,unique=True,index=True, nullable=False )
    invited_by=Column(Integer, ForeignKey('users.id'), nullable=False)
    expires_at=Column(DateTime(timezone=True),nullable=False)
    accepted_at=Column(DateTime(timezone=True), nullable=True)

    #Relationships
    organization=relationship("Organization", back_populates="invites")
    inviter = relationship("User", foreign_keys=[invited_by])