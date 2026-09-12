from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import require_role
from app.core.security import generate_invite_token, hash_token, hash_password
from app.crud import user as crud_user
from app.db.session import get_db
from app.models.user import User
from app.models.organization import Organization
from app.models.invite import Invite
from app.schemas.organization import OrganizationCreate, OrganizationRead,OrgAdminInviteRequest 
from app.schemas.user import UserOut

router = APIRouter(prefix="/admin", tags=["admin"])


class UpdateRoleRequest(BaseModel):
    role: str  

class UpdateStatusRequest(BaseModel):
    is_active: bool


@router.get("/users", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role("internal_admin", "admin")),
):
    """List all registered users (Internal Admin only)."""
    return crud_user.get_all(db)


@router.patch("/users/{user_id}/role", response_model=UserOut)
def update_user_role(
    user_id: int,
    body: UpdateRoleRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role("internal_admin", "admin")),
):
    """Promote or demote a user role (Internal Admin only)."""
    target_user = crud_user.get_by_id(db, user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    return crud_user.change_role(db, target_user, body.role)


@router.patch("/users/{user_id}/status", response_model=UserOut)
def update_user_status(
    user_id: int,
    body: UpdateStatusRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role("internal_admin", "admin")),
):
    """Activate or deactivate a user account (Internal Admin only)."""
    target_user = crud_user.get_by_id(db, user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if target_user.id == admin_user.id:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own admin account")

    return crud_user.toggle_active(db, target_user, body.is_active)

# -- Organization & Client Management --#

@router.post("/organizations",
response_model=OrganizationRead)
def create_organization(
    payload: OrganizationCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role("internal_admin", "admin")),
):

    """Create a new client tenant organization (Internal Admin Only)."""
    existing=db.query(Organization).filter(Organization.name == payload.name).first()

    if existing:
        raise HTTPException(status_code=400, detail="Organization with this name already exists.")

    org = Organization(name=payload.name, domain=payload.domain)
    db.add(org)
    db.commit()
    db.refresh(org)
    return org

@router.get("/organizations",response_model=list[OrganizationRead])
def list_organizations(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role("internal_admin", "admin")),
):

    """List all client organizations (internal Admin only.)"""
    return db.query(Organization).order_by(Organization.id.desc()).all()


@router.post("/organizations/{org_id}/invite")
def invite_org_admin(
    org_id: int,
    payload: OrgAdminInviteRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role("internal_admin", "admin")),
):
    """Provision and create an invite for the client firm's first org_admin"""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists.")
    
    #Generate token & hashes
    raw_token = generate_invite_token()
    token_hashed = hash_token(raw_token)
    expires = datetime.now(timezone.utc) + timedelta(days=7)

    #Create pending user
    temp_password = hash_password(generate_invite_token())
    new_user = User(
        email=payload.email,
        username=payload.email,
        hashed_password=temp_password,
        role="org_admin",
        organization_id=org.id,
        status= "pending",
        is_active=True,
        is_verified=False
    )

    db.add(new_user)
    db.flush()

    #Create invite entry

    invite = Invite(
        email=payload.email,
        organization_id=org.id,
        role="org_admin",
        token_hash=token_hashed,
        invited_by=admin_user.id,
        expires_at=expires
    )

    db.add(invite)
    db.commit()

    invite_url=f"http://localhost:3000/accept-invite?token={raw_token}"
    return {
        "message": f"invite generated for {payload.email}",
        "invite_token": raw_token,
        "invite_url": invite_url,
        "expires_at": expires,
    }