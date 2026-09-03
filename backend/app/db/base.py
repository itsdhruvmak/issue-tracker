# This module imports all models so that SQLAlchemy's metadata
# is fully populated when Alembic (or create_all) runs.
# Import order matters: base_class first, then all models.

from app.db.base_class import Base  # noqa: F401
from app.models.user import User, RefreshToken, EmailVerificationToken  # noqa: F401
from app.models.issue import Issue, IssueAttachment  # noqa: F401
