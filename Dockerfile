# Stage 1: Build frontend
FROM oven/bun:1 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/bun.lock* ./
RUN bun install
COPY frontend/ .
RUN bun run build

# Stage 2: Production
FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim AS production
WORKDIR /app

COPY backend/pyproject.toml backend/uv.lock* ./backend/
RUN cd backend && uv sync --no-dev

COPY backend/ ./backend/
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

CMD sh -c "cd backend && .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"
