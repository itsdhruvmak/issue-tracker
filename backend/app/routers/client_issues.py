import cloudinary.uploader
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app import cloudinary_config  # noqa: ensures cloudinary is configured
from app.core.dependencies import require_role
from app.crud import issue as crud_issue
from app.db.session import get_db
from app.models.user import User
from app.models.issue import Issue
from app.schemas.client_issue import ClientIssueCreate, ClientIssueRead
from app.schemas.issue import IssueAttachmentCreate, IssueAttachmentOut

router = APIRouter(prefix="/client/issues", tags=["client_issues"])


@router.get("", response_model=list[ClientIssueRead])
def get_my_org_issues(
    db: Session = Depends(get_db),
    user: User = Depends(require_role("org_admin", "client_member")),
):
    """Fetch issues belonging strictly to MY organization (org_admin & client_member)."""
    if not user.organization_id:
        raise HTTPException(status_code=400, detail="User does not belong to an organization")

    return db.query(Issue).filter(
        Issue.organization_id == user.organization_id
    ).order_by(Issue.created_at.desc()).all()


@router.post("", response_model=ClientIssueRead)
def create_client_issue(
    payload: ClientIssueCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("org_admin", "client_member")),
):
    """Create a new issue for MY organization (organization_id taken strictly from token)."""
    if not user.organization_id:
        raise HTTPException(status_code=400, detail="User does not belong to an organization")

    new_issue = Issue(
        title=payload.title,
        description=payload.description,
        priority=payload.priority or "medium",
        organization_id=user.organization_id,  # Hardcoded from token
        reporter_id=user.id,
        reporter=user.full_name or user.username,
        status="open",
    )
    db.add(new_issue)
    db.commit()
    db.refresh(new_issue)
    return new_issue


@router.post(
    "/{issue_id}/attachments",
    response_model=list[IssueAttachmentOut],
    status_code=201,
)
def upload_client_attachments(
    issue_id: int,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_role("org_admin", "client_member")),
):
    """Upload media attachments (images/videos/files) to a client issue via Cloudinary."""
    issue = db.query(Issue).filter(
        Issue.id == issue_id,
        Issue.organization_id == user.organization_id,
    ).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found in your organization")

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
