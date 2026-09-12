from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class User(Base):
    __tablename__ = "users"

    id               = Column(Integer, primary_key=True, index=True)
    email            = Column(String, unique=True, index=True, nullable=False)
    username         = Column(String, unique=True, index=True, nullable=False)
    full_name        = Column(String, nullable=True)
    hashed_password  = Column(String, nullable=False)
    role             = Column(String, default="member")   # "admin" | "member" | "org_admin" | "client_member"
    organization_id  = Column(Integer, ForeignKey('organizations.id'), nullable=True)
    status           = Column(String, default="active")  # "pending" | "active"
    is_active        = Column(Boolean, default=True)
    is_verified      = Column(Boolean, default=False)     # email verification gate
    created_at       = Column(DateTime(timezone=True), server_default=func.now())
    updated_at       = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    organization = relationship("Organization", back_populates="users")
    refresh_tokens      = relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    verification_tokens = relationship(
        "EmailVerificationToken",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    reported_issues = relationship(
        "Issue",
        foreign_keys="[Issue.reporter_id]",
        back_populates="reporter_user",
    )
    assigned_issues = relationship(
        "Issue",
        foreign_keys="[Issue.assignee_id]",
        back_populates="assignee_user",
    )


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id         = Column(Integer, primary_key=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    token      = Column(String, unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked    = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="refresh_tokens")


class EmailVerificationToken(Base):
    __tablename__ = "email_verification_tokens"

    id         = Column(Integer, primary_key=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    token      = Column(String, unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used       = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="verification_tokens")
