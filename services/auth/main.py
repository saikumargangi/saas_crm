from fastapi import FastAPI
from contextlib import asynccontextmanager
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from shared.database import engine, Base
from services.auth import routes, models

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create auth-specific tables on startup
    async with engine.begin() as conn:
        # Only create tables defined in this service (users, oauth_tokens, refresh_tokens, permissions)
        await conn.run_sync(
            lambda sync_conn: models.User.__table__.create(sync_conn, checkfirst=True)
        )
        await conn.run_sync(
            lambda sync_conn: models.OAuthToken.__table__.create(sync_conn, checkfirst=True)
        )
        await conn.run_sync(
            lambda sync_conn: models.RefreshToken.__table__.create(sync_conn, checkfirst=True)
        )
        await conn.run_sync(
            lambda sync_conn: models.Permission.__table__.create(sync_conn, checkfirst=True)
        )
    yield

app = FastAPI(title="CRM Auth Service", version="1.0.0", lifespan=lifespan)

app.include_router(routes.router)

@app.get("/health")
async def health_check():
    return {"status": "ok"}
