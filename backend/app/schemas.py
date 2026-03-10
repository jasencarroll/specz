from pydantic import BaseModel


class UserResponse(BaseModel):
    id: str
    email: str


class AuthMeResponse(BaseModel):
    user: UserResponse | None


class SendMagicLinkRequest(BaseModel):
    email: str


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    mode: str = "specz"
    spec_id: str | None = None


class GenerateRequest(BaseModel):
    spec_id: str


class GenerateResponse(BaseModel):
    success: bool
    output: str
    title: str


class SpecCreateRequest(BaseModel):
    mode: str = "specz"


class SpecCreateResponse(BaseModel):
    id: str


class SpecUpdateRequest(BaseModel):
    title: str | None = None
    conversation: list[ChatMessage] | None = None
    output: str | None = None
    status: str | None = None


class SpecResponse(BaseModel):
    id: str
    user_id: str
    title: str
    mode: str
    status: str
    conversation: list[ChatMessage]
    output: str | None
    created_at: int
    updated_at: int


class SuccessResponse(BaseModel):
    success: bool = True
