from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class Issue(Base):
    __tablename__ = "issues"

    id          = Column(Integer, primary_key=True, index=True)
    title       = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status      = Column(String, default="open")        # open / in_progress / closed
    priority    = Column(String, default="medium")      # low / medium / high
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)

    # Legacy free-text fields (kept for backward compatibility)
    reporter    = Column(String, nullable=True)
    assignee    = Column(String, nullable=True)

    # FK relationships to User (added in parallel — non-breaking)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    organization= relationship("Organization", back_populates="issues")

    attachments = relationship(
        "IssueAttachment",
        back_populates="issue",
        cascade="all, delete-orphan",
    )
    reporter_user = relationship(
        "User",
        foreign_keys=[reporter_id],
        back_populates="reported_issues",
    )
    assignee_user = relationship(
        "User",
        foreign_keys=[assignee_id],
        back_populates="assigned_issues",
    )


class IssueAttachment(Base):
    __tablename__ = "issue_attachments"

    id            = Column(Integer, primary_key=True, index=True)
    issue_id      = Column(Integer, ForeignKey("issues.id"), nullable=False)
    file_name     = Column(String, nullable=False)
    file_url      = Column(String, nullable=False)
    public_id     = Column(String, nullable=True)
    resource_type = Column(String, nullable=False)
    file_type     = Column(String, nullable=True)
    file_size     = Column(Integer, nullable=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())

    issue = relationship("Issue", back_populates="attachments")
