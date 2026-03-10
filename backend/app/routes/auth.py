import base64
import re
import secrets
import time

from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..dependencies import get_current_user_optional
from ..lib.auth import (
    create_session,
    generate_session_token,
    invalidate_session,
    validate_session_token,
)
from ..lib.email import send_magic_link_email
from ..lib.magic_link import create_magic_link, validate_magic_link
from ..models import User
from ..schemas import AuthMeResponse, SendMagicLinkRequest, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def generate_user_id() -> str:
    return base64.b32encode(secrets.token_bytes(15)).decode().lower()


@router.post("/send-magic-link")
def send_magic_link(
    body: SendMagicLinkRequest, request: Request, db: Session = Depends(get_db)
):
    email = body.email.strip().lower()
    if not email or len(email) < 5 or len(email) > 255 or not EMAIL_RE.match(email):
        return {"error": "Please enter a valid email address"}

    token = create_magic_link(db, email)
    url = f"{settings.app_url}/auth/verify?token={token}"
    send_magic_link_email(to=email, url=url)
    return {"success": True}


@router.get("/me")
def auth_me(user: User | None = Depends(get_current_user_optional)):
    if not user:
        return AuthMeResponse(user=None)
    return AuthMeResponse(user=UserResponse(id=user.id, email=user.email))


@router.post("/logout")
def logout(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get(settings.session_cookie_name)
    if token:
        session, _ = validate_session_token(db, token)
        if session:
            invalidate_session(db, session.id)

    response = RedirectResponse(url="/", status_code=200)
    response.delete_cookie(settings.session_cookie_name, path="/")
    response.body = b'{"success":true}'
    response.headers["content-type"] = "application/json"
    response.status_code = 200
    return response


# Verify route — mounted separately at root
verify_router = APIRouter(tags=["auth"])


@verify_router.get("/auth/verify")
def verify_magic_link(token: str | None = None, db: Session = Depends(get_db)):
    if not token:
        return RedirectResponse(url="/?error=missing-token")

    result = validate_magic_link(db, token)
    if not result:
        return RedirectResponse(url="/?error=expired-token")

    email = result["email"]
    user = db.query(User).filter(User.email == email).first()

    if not user:
        user_id = generate_user_id()
        now = int(time.time())
        user = User(id=user_id, email=email, created_at=now, updated_at=now)
        db.add(user)
        db.commit()

    session_token = generate_session_token()
    session = create_session(db, session_token, user.id)

    response = RedirectResponse(url="/specs")
    response.set_cookie(
        key=settings.session_cookie_name,
        value=session_token,
        expires=session.expires_at,
        path="/",
        httponly=True,
        samesite="lax",
    )
    return response
