from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import require_admin
from app.crud import user as crud_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserOut

router = APIRouter(prefix="/admin", tags=["admin"])


class UpdateRoleRequest(BaseModel):
    role: str  # "admin" or "member"


class UpdateStatusRequest(BaseModel):
    is_active: bool


@router.get("/users", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """List all registered users (Admin only)."""
    return crud_user.get_all(db)


@router.patch("/users/{user_id}/role", response_model=UserOut)
def update_user_role(
    user_id: int,
    body: UpdateRoleRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Promote or demote a user role (Admin only)."""
    if body.role not in ["admin", "member"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'admin' or 'member'")

    target_user = crud_user.get_by_id(db, user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    return crud_user.change_role(db, target_user, body.role)


@router.patch("/users/{user_id}/status", response_model=UserOut)
def update_user_status(
    user_id: int,
    body: UpdateStatusRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Activate or deactivate a user account (Admin only)."""
    target_user = crud_user.get_by_id(db, user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if target_user.id == admin_user.id:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own admin account")

    return crud_user.toggle_active(db, target_user, body.is_active)
