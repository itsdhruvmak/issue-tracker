import hashlib
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
import secrets
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    """Hash a plain-text password using bcrypt."""
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Check a plain-text password against a bcrypt hash."""
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: int, role: str = None, organization_id: int = None) -> str:
    """Create a short-lived JWT access token (30 min by default)."""
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "type": "access",
    }
    if role:
        payload["role"] = role
    if organization_id is not None:
        payload["organization_id"] = organization_id
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token() -> str:
    """Generate a secure random opaque refresh token (stored in DB)."""
    return secrets.token_hex(64)

def generate_invite_token() -> str:
    """Generate an ungueassable random invite token (For link URL)."""
    return secrets.token_urlsafe(32)

def hash_token(token: str) -> str:
    """Compute SHA-256 hash of an invite token for secure DB storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

def decode_access_token(token: str) -> dict:
    """
    Decode and validate a JWT access token.
    Raises ValueError on any failure (expired, bad signature, wrong type).
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        if payload.get("type") != "access":
            raise ValueError("Invalid token type")
        return payload
    except JWTError:
        raise ValueError("Invalid or expired token")
