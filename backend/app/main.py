from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import init_db
from .routes.auth import router as auth_router
from .routes.auth import verify_router
from .routes.chat import router as chat_router
from .routes.generate import router as generate_router
from .routes.health import router as health_router
from .routes.specs import router as specs_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Specz API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(verify_router)
app.include_router(chat_router)
app.include_router(generate_router)
app.include_router(specs_router)

# In production, serve the built React app with SPA catch-all
frontend_dir = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if frontend_dir.exists():
    app.mount("/assets", StaticFiles(directory=frontend_dir / "assets"), name="static")

    @app.get("/{path:path}")
    async def serve_spa(path: str) -> FileResponse:
        file = frontend_dir / path
        if file.exists() and file.is_file():
            return FileResponse(file)
        return FileResponse(frontend_dir / "index.html")
