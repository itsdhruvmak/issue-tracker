from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_token, hash_password
from app.db.session import get_db
from app.models.invite import Invite
from app.models.organization import Organization
from app.models.user import User
from app.schemas.invite import InvitePublicInfo, InviteAcceptPayload

router = APIRouter(prefix="/invites", tags=["invites"])


@router.get("/{token}", response_model=InvitePublicInfo)
def get_invite_info(token: str, db: Session = Depends(get_db)):
    """Public endpoint to validate an invite token and retrieve tenant info."""
    token_hashed = hash_token(token)
    invite = db.query(Invite).filter(Invite.token_hash == token_hashed).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invalid or expired invite token")

    org = db.query(Organization).filter(Organization.id == invite.organization_id).first()
    org_name = org.name if org else "Organization"

    expires_at_aware = invite.expires_at if invite.expires_at.tzinfo else invite.expires_at.replace(tzinfo=timezone.utc)
    is_expired = expires_at_aware < datetime.now(timezone.utc)
    is_valid = not is_expired and invite.accepted_at is None

    return InvitePublicInfo(
        email=invite.email,
        organization_name=org_name,
        expires_at=invite.expires_at,
        is_valid=is_valid,
    )


@router.post("/{token}/accept")
def accept_invite(
    token: str,
    payload: InviteAcceptPayload,
    db: Session = Depends(get_db),
):
    """Public endpoint to accept an invite, set password, and activate account."""
    token_hashed = hash_token(token)
    invite = db.query(Invite).filter(Invite.token_hash == token_hashed).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invalid invite token")

    if invite.accepted_at is not None:
        raise HTTPException(status_code=400, detail="Invite has already been accepted")

    expires_at_aware = invite.expires_at if invite.expires_at.tzinfo else invite.expires_at.replace(tzinfo=timezone.utc)
    if expires_at_aware < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invite has expired. Please ask your administrator to resend.")

    user = db.query(User).filter(
        User.email == invite.email,
        User.organization_id == invite.organization_id,
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="Associated user account not found")

    # Update user details
    user.username = payload.username
    if payload.full_name:
        user.full_name = payload.full_name
    user.hashed_password = hash_password(payload.password)
    user.status = "active"
    user.is_verified = True

    # Mark invite as accepted
    invite.accepted_at = datetime.now(timezone.utc)

    db.commit()
    return {"message": "Account activated successfully! You can now log in."}
