from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    """
    Decode the Bearer token and return the corresponding User.
    Raises HTTP 401 if token is missing, invalid, expired, or user not found/inactive.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except ValueError:
        raise credentials_exception

    # Import here to avoid circular imports at module load time
    from app.crud.user import get_by_id
    from app.models.user import User

    user = get_by_id(db, int(user_id))
    if user is None or not user.is_active:
        raise credentials_exception

    # Check pending invitation status
    if hasattr(user, "status") and user.status == "pending":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is pending invitation acceptance.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user

def get_verified_user(user=Depends(get_current_user)):
    """Like get_current_user but also requires email to be verified."""
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email address first.",
        )
    return user

def require_role(*roles: str):
    """
    Dependency factory to check if the current user has one of the allowed roles.
    Usage:
        user = Depends(require_role("internal_admin", "internal_member"))
        user = Depends(require_role("org_admin", "client_member"))
    """
    def role_checker(user=Depends(get_verified_user)):
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User role '{user.role}' does not have access to this resource.",
            )
        return user
    return role_checker


def require_admin(user=Depends(get_verified_user)):
    """Backwards-compatible check requiring internal admin access."""
    if user.role not in ("internal_admin", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )
    return user

