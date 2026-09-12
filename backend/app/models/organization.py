from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    domain=Column(String, nullable=True,unique=True,index=True)
    created_at=Column(DateTime(timezone=True), server_default=func.now())

    #Relationships

    users= relationship("User", back_populates="organization")
    invites=relationship("Invite", back_populates="organization", cascade="all, delete-orphan")
    issues=relationship("Issue", back_populates="organization")