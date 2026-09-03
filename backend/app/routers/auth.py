from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.core.security import create_access_token, create_refresh_token
from app.crud import user as crud_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import (
    RefreshRequest,
    ResendOTPRequest,
    Token,
    UserCreate,
    UserOut,
    UserUpdate,
    VerifyOTPRequest,
)
from app.services.email import send_verification_otp

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(
    user_in: UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Create a new account and send a 6-digit OTP verification code by email."""
    if crud_user.get_by_email(db, user_in.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if crud_user.get_by_username(db, user_in.username):
        raise HTTPException(status_code=400, detail="Username already taken")

    user = crud_user.create(db, user_in)
    otp_code = crud_user.create_verification_otp(db, user.id)
    background_tasks.add_task(
        send_verification_otp, user.email, user.username, otp_code
    )
    return user


@router.post("/verify-otp")
def verify_otp(body: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Verify email using the 6-digit OTP code."""
    success, message = crud_user.verify_otp(db, body.email, body.otp)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"message": message}


@router.post("/resend-otp")
def resend_otp(
    body: ResendOTPRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Resend a 6-digit verification OTP to the user's email."""
    user = crud_user.get_by_email(db, body.email)
    if not user:
        raise HTTPException(status_code=404, detail="User with this email does not exist")

    if user.is_verified:
        raise HTTPException(status_code=400, detail="Email is already verified")

    otp_code = crud_user.create_verification_otp(db, user.id)
    background_tasks.add_task(
        send_verification_otp, user.email, user.username, otp_code
    )
    return {"message": "A new 6-digit OTP code has been sent to your email."}


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """
    Authenticate with email + password (the 'username' field of the form = email).
    Returns a JWT access token + opaque refresh token.
    """
    user = crud_user.authenticate(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is inactive")

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token()
    expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    crud_user.save_refresh_token(db, user.id, refresh_token, expires_at)

    return Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=Token)
def refresh(body: RefreshRequest, db: Session = Depends(get_db)):
    """
    Exchange a valid refresh token for a new access + refresh token pair.
    Old refresh token is rotated (revoked) on each use.
    """
    token_record = crud_user.get_refresh_token(db, body.refresh_token)
    if not token_record or token_record.revoked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked refresh token",
        )

    expires_at = token_record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired",
        )

    # Rotate tokens
    crud_user.revoke_refresh_token(db, body.refresh_token)
    new_access = create_access_token(token_record.user_id)
    new_refresh = create_refresh_token()
    new_expires = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    crud_user.save_refresh_token(db, token_record.user_id, new_refresh, new_expires)

    return Token(access_token=new_access, refresh_token=new_refresh)


@router.post("/logout")
def logout(
    body: RefreshRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Revoke the provided refresh token, effectively logging out this device."""
    crud_user.revoke_refresh_token(db, body.refresh_token)
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the current authenticated user's profile."""
    return current_user


@router.patch("/me", response_model=UserOut)
def update_me(
    update_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update the current user's profile (full_name and/or password)."""
    return crud_user.update(db, current_user, update_in)
