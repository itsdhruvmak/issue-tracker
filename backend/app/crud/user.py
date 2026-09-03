import secrets
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.models.user import User, RefreshToken, EmailVerificationToken
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import hash_password, verify_password


# ── User Queries ──────────────────────────────────────────────────────────────

def get_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def get_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_by_username(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == username).first()


def get_all(db: Session) -> list[User]:
    return db.query(User).order_by(User.id.asc()).all()


def create(db: Session, user_in: UserCreate) -> User:
    db_user = User(
        email=user_in.email,
        username=user_in.username,
        full_name=user_in.full_name,
        hashed_password=hash_password(user_in.password),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update(db: Session, user: User, update_in: UserUpdate) -> User:
    if update_in.full_name is not None:
        user.full_name = update_in.full_name
    if update_in.password is not None:
        user.hashed_password = hash_password(update_in.password)
    db.commit()
    db.refresh(user)
    return user


def change_role(db: Session, user: User, role: str) -> User:
    user.role = role
    db.commit()
    db.refresh(user)
    return user


def toggle_active(db: Session, user: User, is_active: bool) -> User:
    user.is_active = is_active
    db.commit()
    db.refresh(user)
    return user


def authenticate(db: Session, email: str, password: str) -> User | None:
    """Return user if email+password match, else None."""
    user = get_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


# ── Refresh Token ─────────────────────────────────────────────────────────────

def save_refresh_token(
    db: Session, user_id: int, token: str, expires_at: datetime
) -> RefreshToken:
    db_token = RefreshToken(user_id=user_id, token=token, expires_at=expires_at)
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    return db_token


def get_refresh_token(db: Session, token: str) -> RefreshToken | None:
    return db.query(RefreshToken).filter(RefreshToken.token == token).first()


def revoke_refresh_token(db: Session, token: str) -> None:
    db_token = get_refresh_token(db, token)
    if db_token:
        db_token.revoked = True
        db.commit()


# ── OTP Email Verification ───────────────────────────────────────────────────

def create_verification_otp(db: Session, user_id: int) -> str:
    """Generate a 6-digit OTP code valid for 10 minutes."""
    otp_code = f"{secrets.randbelow(1000000):06d}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    # Invalidate previous unused OTPs for this user
    existing_tokens = db.query(EmailVerificationToken).filter(
        EmailVerificationToken.user_id == user_id,
        EmailVerificationToken.used == False
    ).all()
    for t in existing_tokens:
        t.used = True

    db_token = EmailVerificationToken(
        user_id=user_id, token=otp_code, expires_at=expires_at
    )
    db.add(db_token)
    db.commit()
    return otp_code


def verify_otp(db: Session, email: str, otp: str) -> tuple[bool, str]:
    """
    Verify 6-digit OTP for given email.
    Returns (success: bool, message: str)
    """
    user = get_by_email(db, email)
    if not user:
        return False, "User not found"
    
    if user.is_verified:
        return True, "Email is already verified"

    token_record = (
        db.query(EmailVerificationToken)
        .filter(
            EmailVerificationToken.user_id == user.id,
            EmailVerificationToken.token == otp,
            EmailVerificationToken.used == False,
        )
        .order_by(EmailVerificationToken.created_at.desc())
        .first()
    )

    if not token_record:
        return False, "Invalid OTP code"

    expires_at = token_record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < datetime.now(timezone.utc):
        return False, "OTP code has expired. Please request a new one."

    # Mark token used and user verified
    user.is_verified = True
    token_record.used = True
    db.commit()
    return True, "Email verified successfully. You can now log in."
