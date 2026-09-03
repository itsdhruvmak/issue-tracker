from sqlalchemy.orm import Session
from app.models.issue import Issue, IssueAttachment
from app.schemas.issue import IssueCreate, IssueUpdate, IssueAttachmentCreate


def get_issues(db: Session):
    return db.query(Issue).order_by(Issue.created_at.desc()).all()


def get_issue(db: Session, issue_id: int):
    return db.query(Issue).filter(Issue.id == issue_id).first()


def create_issue(db: Session, issue: IssueCreate):
    db_issue = Issue(**issue.model_dump())
    db.add(db_issue)
    db.commit()
    db.refresh(db_issue)
    return db_issue


def update_issue(db: Session, issue_id: int, issue: IssueUpdate):
    db_issue = get_issue(db, issue_id)
    if not db_issue:
        return None
    for key, value in issue.model_dump(exclude_unset=True).items():
        setattr(db_issue, key, value)
    db.commit()
    db.refresh(db_issue)
    return db_issue


def delete_issue(db: Session, issue_id: int):
    db_issue = get_issue(db, issue_id)
    if not db_issue:
        return None
    db.delete(db_issue)
    db.commit()
    return db_issue


def create_attachment(db: Session, issue_id: int, attachment: IssueAttachmentCreate):
    db_attachment = IssueAttachment(issue_id=issue_id, **attachment.model_dump())
    db.add(db_attachment)
    db.commit()
    db.refresh(db_attachment)
    return db_attachment


def get_attachments(db: Session, issue_id: int):
    return db.query(IssueAttachment).filter(
        IssueAttachment.issue_id == issue_id
    ).all()


def get_attachment(db: Session, attachment_id: int):
    return db.query(IssueAttachment).filter(
        IssueAttachment.id == attachment_id
    ).first()


def delete_attachment(db: Session, attachment_id: int):
    db_attachment = get_attachment(db, attachment_id)
    if not db_attachment:
        return None
    db.delete(db_attachment)
    db.commit()
    return db_attachment
