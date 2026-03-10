import base64
import json
import secrets
import time

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models import Spec, User
from ..schemas import (
    ChatMessage,
    SpecCreateRequest,
    SpecCreateResponse,
    SpecResponse,
    SpecUpdateRequest,
    SuccessResponse,
)

router = APIRouter(prefix="/api/specs", tags=["specs"])


def generate_id() -> str:
    return base64.b32encode(secrets.token_bytes(15)).decode().lower()


def spec_to_response(spec: Spec) -> SpecResponse:
    conversation = json.loads(spec.conversation) if spec.conversation else []
    return SpecResponse(
        id=spec.id,
        user_id=spec.user_id,
        title=spec.title,
        mode=spec.mode,
        status=spec.status,
        conversation=[ChatMessage(**m) for m in conversation],
        output=spec.output,
        created_at=spec.created_at,
        updated_at=spec.updated_at,
    )


@router.get("/")
def list_specs(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> list[SpecResponse]:
    specs = (
        db.query(Spec)
        .filter(Spec.user_id == user.id)
        .order_by(Spec.updated_at.desc())
        .all()
    )
    return [spec_to_response(s) for s in specs]


@router.post("/")
def create_spec(
    body: SpecCreateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SpecCreateResponse:
    mode = "speczcheck" if body.mode == "speczcheck" else "specz"
    spec_id = generate_id()
    now = int(time.time())

    spec = Spec(
        id=spec_id,
        user_id=user.id,
        mode=mode,
        created_at=now,
        updated_at=now,
    )
    db.add(spec)
    db.commit()
    return SpecCreateResponse(id=spec_id)


@router.get("/{spec_id}")
def get_spec(
    spec_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SpecResponse:
    spec = db.query(Spec).filter(Spec.id == spec_id, Spec.user_id == user.id).first()
    if not spec:
        raise HTTPException(status_code=404, detail="Spec not found")
    return spec_to_response(spec)


@router.patch("/{spec_id}")
def update_spec(
    spec_id: str,
    body: SpecUpdateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SuccessResponse:
    spec = db.query(Spec).filter(Spec.id == spec_id, Spec.user_id == user.id).first()
    if not spec:
        raise HTTPException(status_code=404, detail="Spec not found")

    if body.title is not None:
        spec.title = body.title
    if body.conversation is not None:
        spec.conversation = json.dumps([m.model_dump() for m in body.conversation])
    if body.output is not None:
        spec.output = body.output
    if body.status is not None:
        spec.status = body.status
    spec.updated_at = int(time.time())

    db.commit()
    return SuccessResponse()


@router.delete("/{spec_id}")
def delete_spec(
    spec_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SuccessResponse:
    rows = db.query(Spec).filter(Spec.id == spec_id, Spec.user_id == user.id).delete()
    db.commit()
    if rows == 0:
        raise HTTPException(status_code=404, detail="Spec not found")
    return SuccessResponse()
