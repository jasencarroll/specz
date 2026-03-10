from unittest.mock import patch

import pytest


@pytest.mark.asyncio
async def test_send_magic_link_valid_email(client):
    with patch("app.routes.auth.send_magic_link_email"):
        response = await client.post(
            "/api/auth/send-magic-link",
            json={"email": "user@example.com"},
        )
    assert response.status_code == 200
    assert response.json() == {"success": True}


@pytest.mark.asyncio
async def test_send_magic_link_invalid_email(client):
    response = await client.post(
        "/api/auth/send-magic-link",
        json={"email": "bad"},
    )
    assert response.status_code == 200
    assert "error" in response.json()


@pytest.mark.asyncio
async def test_me_unauthenticated(client):
    response = await client.get("/api/auth/me")
    assert response.status_code == 200
    assert response.json() == {"user": None}
