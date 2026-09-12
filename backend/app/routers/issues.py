import cloudinary.uploader
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app import cloudinary_config  # noqa: ensures cloudinary is configured
from app.core.dependencies import require_role
from app.crud import issue as crud_issue
from app.db.session import get_db
from app.models.user import User
from app.schemas.issue import (
    IssueAttachmentCreate,
    IssueAttachmentOut,
    IssueCreate,
    IssueOut,
    IssueUpdate,
)

router = APIRouter(prefix="/issues", tags=["issues"])

# Internal roles authorized to access full issue tracking
INTERNAL_ROLES = ("internal_admin", "internal_member", "admin", "member")


@router.get("/", response_model=list[IssueOut])
def list_issues(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(*INTERNAL_ROLES)),
):
    """Fetch all internal issues (Internal Team only)."""
    return crud_issue.get_issues(db)


@router.get("/{issue_id}", response_model=IssueOut)
def get_issue(
    issue_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(*INTERNAL_ROLES)),
):
    """Fetch an internal issue detail (Internal Team only)."""
    issue = crud_issue.get_issue(db, issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue


@router.post("/", response_model=IssueOut, status_code=201)
def create_issue(
    issue: IssueCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(*INTERNAL_ROLES)),
):
    """Create an internal issue (Internal Team only)."""
    return crud_issue.create_issue(db, issue)


@router.patch("/{issue_id}", response_model=IssueOut)
def update_issue(
    issue_id: int,
    issue: IssueUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(*INTERNAL_ROLES)),
):
    """Update an internal issue (Internal Team only)."""
    updated = crud_issue.update_issue(db, issue_id, issue)
    if not updated:
        raise HTTPException(status_code=404, detail="Issue not found")
    return updated


@router.delete("/{issue_id}", status_code=204)
def delete_issue(
    issue_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(*INTERNAL_ROLES)),
):
    """Delete an internal issue (Internal Team only)."""
    deleted = crud_issue.delete_issue(db, issue_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Issue not found")


@router.post(
    "/{issue_id}/attachments",
    response_model=list[IssueAttachmentOut],
    status_code=201,
)
def upload_attachments(
    issue_id: int,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_role(*INTERNAL_ROLES)),
):
    """Upload attachments to an issue (Internal Team only)."""
    issue = crud_issue.get_issue(db, issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    if issue.status == "closed":
        raise HTTPException(
            status_code=400, detail="Cannot upload attachments to a closed issue"
        )

    saved_attachments = []
    for file in files:
        result = cloudinary.uploader.upload(
            file.file,
            resource_type="auto",
            folder="issue_tracker",
        )
        attachment = IssueAttachmentCreate(
            file_name=file.filename,
            file_url=result["secure_url"],
            public_id=result["public_id"],
            resource_type=result["resource_type"],
            file_type=file.content_type,
            file_size=result.get("bytes"),
        )
        saved_attachments.append(crud_issue.create_attachment(db, issue_id, attachment))

    return saved_attachments


@router.get("/{issue_id}/attachments", response_model=list[IssueAttachmentOut])
def list_attachments(
    issue_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(*INTERNAL_ROLES)),
):
    """List attachments of an issue (Internal Team only)."""
    issue = crud_issue.get_issue(db, issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return crud_issue.get_attachments(db, issue_id)


@router.delete("/attachments/{attachment_id}", status_code=204)
def remove_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(*INTERNAL_ROLES)),
):
    """Remove an attachment (Internal Team only)."""
    deleted = crud_issue.delete_attachment(db, attachment_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Attachment not found")
