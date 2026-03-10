import json
import time

from fastapi import APIRouter, Depends, HTTPException
from mistralai.client import Mistral
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..dependencies import get_current_user
from ..models import Spec, User
from ..prompts import extract_title, format_conversation_text
from ..prompts.generate import GENERATE_PROMPT
from ..schemas import GenerateRequest, GenerateResponse

router = APIRouter(prefix="/api", tags=["generate"])

client = Mistral(api_key=settings.mistral_api_key)


@router.post("/generate")
def generate(
    body: GenerateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> GenerateResponse:
    spec = (
        db.query(Spec).filter(Spec.id == body.spec_id, Spec.user_id == user.id).first()
    )
    if not spec:
        raise HTTPException(status_code=404, detail="Spec not found")

    conversation = json.loads(spec.conversation) if spec.conversation else []
    conversation_text = format_conversation_text(conversation)

    result = client.chat.complete(
        model="devstral-small-latest",
        messages=[
            {"role": "system", "content": GENERATE_PROMPT},
            {"role": "user", "content": conversation_text},
        ],
    )

    raw_output = result.choices[0].message.content if result.choices else ""
    output = raw_output if isinstance(raw_output, str) else ""
    title = extract_title(output)

    spec.title = title
    spec.status = "complete"
    spec.output = output
    spec.updated_at = int(time.time())
    db.commit()

    return GenerateResponse(success=True, output=output, title=title)
