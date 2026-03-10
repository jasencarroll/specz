import json
import time
from collections.abc import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from mistralai.client import Mistral
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..dependencies import get_current_user
from ..models import Spec, User
from ..prompts import select_system_prompt
from ..schemas import ChatRequest

router = APIRouter(prefix="/api", tags=["chat"])

client = Mistral(api_key=settings.mistral_api_key)


async def stream_chat(
    messages: list[dict], system_prompt: str
) -> AsyncGenerator[str, None]:
    stream = client.chat.stream(
        model="devstral-small-latest",
        messages=[{"role": "system", "content": system_prompt}, *messages],
    )
    for event in stream:
        data = json.dumps(event.data.model_dump())
        yield f"data: {data}\n\n"
    yield "data: [DONE]\n\n"


@router.post("/chat")
async def chat(
    body: ChatRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not body.messages:
        raise HTTPException(status_code=400, detail="Messages are required")

    system_prompt = select_system_prompt(body.mode)
    messages = [m.model_dump() for m in body.messages]

    if body.spec_id:
        spec = (
            db.query(Spec)
            .filter(Spec.id == body.spec_id, Spec.user_id == user.id)
            .first()
        )
        if spec:
            spec.conversation = json.dumps(messages)
            spec.updated_at = int(time.time())
            db.commit()

    return StreamingResponse(
        stream_chat(messages, system_prompt),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
