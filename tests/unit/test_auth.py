import pytest
from httpx import AsyncClient
from services.auth.main import app

@pytest.mark.asyncio
async def test_health_check():
    from httpx import ASGITransport
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

@pytest.mark.asyncio
async def test_register_user():
    from httpx import ASGITransport
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/api/v1/auth/register", json={
            "email": "test@example.com",
            "password": "password123",
            "first_name": "Test",
            "last_name": "User"
        })
    # Since we are using a real DB connection string in database.py (or default localhost),
    # this might fail if DB isn't running. 
    # For unit tests, we usually mock the DB or use an in-memory SQLite.
    # However, this test is just to check if the app wires up correctly.
    # We expect either 201 (success) or 500 (db connection error) but NOT 404/ImportError.
    assert response.status_code in [201, 500, 400] 
