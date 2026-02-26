# Secure AI-Powered Project Management App (Bun + Custom RBAC)

## Stack
- Frontend: React + Vite
- Backend: Bun + Hono
- DB: PostgreSQL
- AI Bridge: Python MCP-style HTTP tool server
- Orchestration: Docker Compose

## Quick Start
```bash
docker compose up --build
```

Services:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- MCP bridge: http://localhost:8000

## Seeded Users
- human admin: `admin@example.com` / `admin123`
- ai user: `ai@example.com` / `ai123`

## Auth & RBAC behavior
- `POST /auth/login` sets an `HttpOnly` auth cookie for web users.
- `POST /auth/login/ai-agent` always issues token with `ai_agent` role and returns token in JSON.
- `POST /auth/login?source=ai` behaves similarly to AI mode on same endpoint.

Roles:
- `human_admin`: GET/POST/PUT/PATCH/DELETE
- `ai_agent`: GET/POST only

API endpoints protected by JWT + RBAC:
- `/api/projects` and `/api/projects/:id`
- `/api/tasks` and `/api/tasks/:id`

## MCP tools
- `GET /tools/list_projects`
- `POST /tools/create_project`
- `PUT /tools/update_project`
- `DELETE /tools/delete_project/{project_id}`

The MCP server forwards the stored JWT in `Authorization: Bearer <token>` and leaves authorization decisions to the backend RBAC middleware.
