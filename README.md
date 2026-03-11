# Specz

A conversational AI tool that conducts structured product interviews and generates software specifications.

**Live Demo:** [specz.jasencarroll.com](https://specz.jasencarroll.com)

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, React Router v7, Tailwind CSS v4, shadcn/ui |
| **Backend** | FastAPI, SQLAlchemy, PostgreSQL |
| **AI** | Mistral API (devstral-small-latest), SSE streaming |
| **Auth** | Custom magic link implementation via Resend |
| **Tooling** | uv, Ruff, Bun, Biome |
| **CI/CD** | GitHub Actions (lint, test, build), Railway (Dockerfile) |

## Features

- **Specz Mode** -- AI-driven interview that asks targeted questions about your project, then generates a structured software specification from the conversation
- **SpeczCheck Mode** -- Paste an existing spec and receive AI-powered analysis with actionable feedback
- **Magic Link Auth** -- Passwordless authentication via email; tokens are SHA-256 hashed with 15-minute expiry
- **Streaming Chat** -- Real-time SSE streaming from Mistral AI with incremental UI rendering
- **Spec Management** -- List, view, copy, and download generated specifications as Markdown

## Architecture

### Interview and Generation Flow

```
User starts a new spec
       |
       v
  Select mode: specz or speczcheck
       |
       +--> specz: AI conducts a product interview
       |         |
       |         v
       |    AI signals READY_TO_GENERATE
       |         |
       |         v
       |    POST /api/generate --> structured spec
       |
       +--> speczcheck: User pastes existing spec
                 |
                 v
            AI analyzes and returns feedback
```

### Backend

FastAPI serves both the REST API and the built React frontend in production. Key routes:

- `POST /api/auth/send-magic-link` -- send login email via Resend
- `GET /api/auth/verify` -- validate token, create session, set cookie
- `POST /api/chat` -- SSE streaming chat with Mistral AI
- `POST /api/generate` -- generate a complete spec from conversation history
- `GET /api/specs` -- list and retrieve saved specifications
- `GET /api/health` -- health check for Railway

### Frontend

Single-page React app with client-side routing. The chat component reads SSE streams and renders Markdown incrementally. Protected routes require an active session.

### Database Schema

Four tables: `user`, `session`, `magic_link`, and `spec`. Sessions have 30-day expiry with automatic renewal. Specs store the full conversation as JSON alongside the generated output.

## Getting Started

### Prerequisites

- [Python 3.13+](https://www.python.org/) with [uv](https://docs.astral.sh/uv/)
- [Bun](https://bun.sh/)
- [PostgreSQL](https://www.postgresql.org/)
- [Mistral API key](https://console.mistral.ai/)
- [Resend API key](https://resend.com/) (for magic link emails)

### Setup

```sh
# Clone
git clone https://github.com/jasencarroll/specz.git
cd specz

# Backend
cd backend
uv sync
cp .env.example .env   # then fill in your keys

# Frontend
cd ../frontend
bun install
```

### Environment Variables

Create `backend/.env`:

```
DATABASE_URL=postgresql://localhost/specz
MISTRAL_API_KEY=your_mistral_key
RESEND_API_KEY=your_resend_key
```

### Development

Run both servers in separate terminals:

```sh
# Terminal 1 -- Backend (port 8000)
cd backend
uv run uvicorn app.main:app --reload --port 8000

# Terminal 2 -- Frontend (port 5173, proxies /api to backend)
cd frontend
bun run dev
```

### Testing

```sh
# Backend
cd backend
uv run ruff check .       # lint
uv run ruff format .      # format
uv run pytest             # tests (requires PostgreSQL)

# Frontend
cd frontend
bun run lint              # Biome lint
bun run build             # type-check + build
```

## Deployment

The app deploys to Railway using a multi-stage Dockerfile:

1. **Stage 1** -- `oven/bun` image builds the React frontend
2. **Stage 2** -- `ghcr.io/astral-sh/uv` image installs backend dependencies and serves both the API and static frontend

Railway configuration is defined in `railway.json` with a health check at `/api/health`.

## Project Structure

```
specz/
├── backend/
│   └── app/
│       ├── main.py            # FastAPI app, CORS, static file serving
│       ├── config.py          # Pydantic Settings
│       ├── database.py        # SQLAlchemy engine + session
│       ├── models.py          # ORM models
│       ├── schemas.py         # Request/response schemas
│       ├── dependencies.py    # Auth dependencies
│       ├── routes/            # auth, chat, generate, specs, health
│       ├── lib/               # auth, magic_link, email utilities
│       └── prompts/           # Mistral system prompts (specz, generate, check)
├── frontend/
│   └── src/
│       ├── App.tsx            # Route definitions
│       ├── components/        # Chat, Header, SpecView, ProtectedRoute, ui/
│       ├── pages/             # Home, Auth, SpecList, SpecDetail, SpeczCheck
│       ├── hooks/             # useAuth context
│       └── lib/               # API helpers, cn() utility
├── Dockerfile                 # Multi-stage production build
├── railway.json               # Railway deployment config
└── .github/workflows/ci.yml   # CI pipeline
```

## License

See [LICENSE.txt](LICENSE.txt).
