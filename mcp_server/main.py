import os
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

BACKEND_URL = os.getenv('BACKEND_URL', 'http://backend:3001')
AI_USER_EMAIL = os.getenv('AI_USER_EMAIL', 'ai@example.com')
AI_USER_PASSWORD = os.getenv('AI_USER_PASSWORD', 'ai123')

app = FastAPI(title='MCP RBAC Bridge')


def _headers() -> dict[str, str]:
    token = app.state.jwt
    if not token:
        raise HTTPException(status_code=500, detail='JWT not initialized')
    return {'Authorization': f'Bearer {token}'}


async def _login_ai_agent() -> str:
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            f'{BACKEND_URL}/auth/login/ai-agent',
            json={'email': AI_USER_EMAIL, 'password': AI_USER_PASSWORD},
        )
        response.raise_for_status()
        return response.json()['token']


@app.on_event('startup')
async def startup_event() -> None:
    app.state.jwt = await _login_ai_agent()


@app.get('/tools/list_projects')
async def list_projects() -> Any:
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(f'{BACKEND_URL}/api/projects', headers=_headers())
    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return response.json()


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None


@app.post('/tools/create_project')
async def create_project(payload: ProjectCreate) -> Any:
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            f'{BACKEND_URL}/api/projects', headers=_headers(), json=payload.model_dump()
        )
    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return response.json()


class ProjectUpdate(ProjectCreate):
    id: int


@app.put('/tools/update_project')
async def update_project(payload: ProjectUpdate) -> Any:
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.put(
            f'{BACKEND_URL}/api/projects/{payload.id}',
            headers=_headers(),
            json={'name': payload.name, 'description': payload.description},
        )
    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return response.json()


@app.delete('/tools/delete_project/{project_id}')
async def delete_project(project_id: int) -> Any:
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.delete(f'{BACKEND_URL}/api/projects/{project_id}', headers=_headers())
    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return {'status': 'deleted'}
