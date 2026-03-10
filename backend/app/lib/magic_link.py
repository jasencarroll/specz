import base64
import secrets
import time

from sqlalchemy.orm import Session

from ..config import settings
from ..models import MagicLink


def generate_magic_link_token() -> str:
    return base64.urlsafe_b64encode(secrets.token_bytes(18)).decode()


def hash_token(token: str) -> str:
    import hashlib

    return hashlib.sha256(token.encode()).hexdigest()


def create_magic_link(db: Session, email: str) -> str:
    token = generate_magic_link_token()
    token_hash = hash_token(token)
    now = int(time.time())
    expires_at = now + settings.magic_link_expiry_minutes * 60

    # Delete existing links for this email
    db.query(MagicLink).filter(MagicLink.email == email).delete()

    link = MagicLink(id=token_hash, email=email, expires_at=expires_at, created_at=now)
    db.add(link)
    db.commit()

    return token


def validate_magic_link(db: Session, token: str) -> dict[str, str] | None:
    token_hash = hash_token(token)
    now = int(time.time())

    link = (
        db.query(MagicLink)
        .filter(MagicLink.id == token_hash, MagicLink.expires_at > now)
        .first()
    )

    if not link:
        return None

    email = link.email
    db.delete(link)
    db.commit()

    return {"email": email}
