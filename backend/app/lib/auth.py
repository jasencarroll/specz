import base64
import hashlib
import secrets
import time

from sqlalchemy.orm import Session

from ..config import settings
from ..models import Session as SessionModel
from ..models import User

DAY_IN_S = 60 * 60 * 24


def generate_session_token() -> str:
    return base64.urlsafe_b64encode(secrets.token_bytes(18)).decode()


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def create_session(db: Session, token: str, user_id: str) -> SessionModel:
    session_id = hash_token(token)
    expires_at = int(time.time()) + DAY_IN_S * settings.session_expiry_days
    session = SessionModel(id=session_id, user_id=user_id, expires_at=expires_at)
    db.add(session)
    db.commit()
    return session


def validate_session_token(
    db: Session, token: str
) -> tuple[SessionModel | None, User | None]:
    session_id = hash_token(token)
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()

    if not session:
        return None, None

    now = int(time.time())

    if now >= session.expires_at:
        db.delete(session)
        db.commit()
        return None, None

    user = db.query(User).filter(User.id == session.user_id).first()
    if not user:
        return None, None

    # Renew if within 15 days of expiry
    renew_threshold = session.expires_at - DAY_IN_S * 15
    if now >= renew_threshold:
        session.expires_at = now + DAY_IN_S * settings.session_expiry_days
        db.commit()

    return session, user


def invalidate_session(db: Session, session_id: str) -> None:
    db.query(SessionModel).filter(SessionModel.id == session_id).delete()
    db.commit()
