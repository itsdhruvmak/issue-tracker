from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_role
from app.core.security import generate_invite_token, hash_token, hash_password
from app.db.session import get_db
from app.models.user import User
from app.models.invite import Invite
from app.schemas.invite import InviteCreate
from app.schemas.user import UserOut

router = APIRouter(prefix="/client/team", tags=["client_team"])


@router.get("", response_model=list[UserOut])
def get_team_members(
    db: Session = Depends(get_db),
    user: User = Depends(require_role("org_admin")),
):
    """List all team members in MY organization (org_admin only)."""
    return db.query(User).filter(User.organization_id == user.organization_id).all()


@router.post("/invite")
def invite_teammate(
    payload: InviteCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("org_admin")),
):
    """Invite a colleague into MY organization as a client_member (org_admin only)."""
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="A user with this email already exists")

    raw_token = generate_invite_token()
    token_hashed = hash_token(raw_token)
    expires = datetime.now(timezone.utc) + timedelta(days=7)

    # Create pending client_member
    temp_password = hash_password(generate_invite_token())
    new_user = User(
        email=payload.email,
        username=payload.email,
        hashed_password=temp_password,
        role="client_member",  # Hardcoded privilege restriction
        organization_id=user.organization_id,  # From JWT session only
        status="pending",
        is_active=True,
        is_verified=False,
    )
    db.add(new_user)
    db.flush()

    invite = Invite(
        email=payload.email,
        organization_id=user.organization_id,
        role="client_member",
        token_hash=token_hashed,
        invited_by=user.id,
        expires_at=expires,
    )
    db.add(invite)
    db.commit()

    invite_url = f"http://localhost:3000/accept-invite?token={raw_token}"
    return {
        "message": f"Teammate invite created for {payload.email}",
        "invite_token": raw_token,
        "invite_url": invite_url,
        "expires_at": expires,
    }


@router.delete("/{user_id}")
def remove_teammate(
    user_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("org_admin")),
):
    """Remove or deactivate a colleague within MY organization (org_admin only)."""
    target = db.query(User).filter(
        User.id == user_id,
        User.organization_id == user.organization_id,
    ).first()
    if not target:
        raise HTTPException(status_code=404, detail="Teammate not found in your organization")

    if target.id == user.id:
        raise HTTPException(status_code=400, detail="You cannot remove yourself from your organization")

    target.is_active = False
    db.commit()
    return {"message": "Teammate deactivated successfully"}
