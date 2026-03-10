from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from .lib.auth import validate_session_token
from .models import User


def get_current_user_optional(
    request: Request, db: Session = Depends(get_db)
) -> User | None:
    token = request.cookies.get(settings.session_cookie_name)
    if not token:
        return None
    _, user = validate_session_token(db, token)
    return user


def get_current_user(
    user: User | None = Depends(get_current_user_optional),
) -> User:
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user
