# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Build and Development Commands

### Backend (Python/FastAPI)

```bash
cd backend
uv sync                            # Install dependencies
uv run uvicorn app.main:app --reload --port 8000  # Start dev server
uv run ruff check .                # Lint
uv run ruff format .               # Format
uv run pytest                      # Run tests
```

### Frontend (React/Vite)

```bash
cd frontend
bun install                        # Install dependencies
bun run dev                        # Start Vite dev server (port 5173)
bun run build                      # Production build (dist/)
bun run lint                       # Biome lint
bun run format                     # Biome auto-format
```

### Development

Run both servers in separate terminals:
- **Backend**: `cd backend && uv run uvicorn app.main:app --reload --port 8000`
- **Frontend**: `cd frontend && bun run dev`

Vite proxies `/api/*` and `/auth/verify` to the FastAPI server.

### Database

SQLite database at `backend/data/specz.db`. Tables are auto-created on server startup via SQLAlchemy `create_all`.

## Architecture

Specz is a conversational AI tool that conducts product intake interviews and generates software specifications.

**Two modes** (stored as `mode` field in spec table):
- **specz**: Interview → Generate spec (AI says `READY_TO_GENERATE` when done interviewing)
- **speczcheck**: Analyze existing spec → Feedback

### Tech Stack

- **Frontend**: React 19, React Router v7, Tailwind CSS v4, shadcn/ui, Biome
- **Backend**: FastAPI, SQLAlchemy, SQLite, Ruff
- **AI**: Mistral API (devstral-small-latest) for chat streaming and spec generation
- **Auth**: Custom magic link implementation via Resend
- **Package managers**: uv (backend), bun (frontend)

### Key Directories

```
backend/
  app/
    main.py              # FastAPI app, CORS, router registration
    config.py            # Pydantic Settings (env vars)
    database.py          # SQLAlchemy engine + session
    models.py            # ORM models (User, Session, MagicLink, Spec)
    schemas.py           # Pydantic request/response schemas
    dependencies.py      # Auth dependencies (get_current_user)
    routes/              # API route handlers (auth, chat, generate, specs, health)
    lib/                 # Utilities (auth, magic_link, email)
    prompts/             # System prompts for Mistral (specz, generate, check)

frontend/
  src/
    main.tsx             # React entry point
    App.tsx              # Routes
    index.css            # Tailwind + shadcn theme (warm neutral palette)
    components/
      ui/                # shadcn/ui primitives (Button, Card, Input, Badge, etc.)
      Header.tsx         # Auth-aware nav
      Chat.tsx           # SSE streaming chat
      SpecView.tsx       # Rendered spec with copy/download
      ProtectedRoute.tsx # Auth guard
    pages/               # Route pages (Home, Auth, SpecList, SpecDetail, SpeczCheck)
    hooks/               # useAuth context
    lib/                 # API helpers, cn() utility
```

### Database Schema

- **user**: id, email, created_at, updated_at
- **session**: id (SHA256 hash of token), user_id, expires_at
- **magic_link**: id (SHA256 hash of token), email, expires_at, created_at
- **spec**: id, user_id, title, mode (specz|speczcheck), status (draft|complete), conversation (JSON text), output, created_at, updated_at

Timestamps are stored as Unix epoch integers.

### Authentication

Magic link authentication via Resend:
- User enters email at `/auth` → POST `/api/auth/send-magic-link` → email sent
- Click magic link → GET `/auth/verify?token=...` → session created → redirect to `/specs`
- Tokens: 18 random bytes, stored as SHA256 hash, 15-min expiry, single-use
- Sessions: 30-day expiry, auto-renewed within 15-day window
- Auth dependency via FastAPI `Depends(get_current_user)`

### API Streaming

Chat endpoint (`POST /api/chat`) uses Mistral streaming with SSE format via `StreamingResponse`. The Chat component reads the stream and updates UI incrementally.

### Environment

Backend `.env` requires:
- `DATABASE_URL` - SQLite URL (e.g., `sqlite:///./data/specz.db`)
- `MISTRAL_API_KEY` - Mistral API key
- `RESEND_API_KEY` - Resend API key for magic link emails

### Production

In production, FastAPI serves the built React static files from `../frontend/dist/`. Build frontend first (`bun run build`), then run FastAPI.
