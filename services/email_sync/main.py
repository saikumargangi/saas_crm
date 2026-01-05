from fastapi import FastAPI
from contextlib import asynccontextmanager
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from shared.database import engine, Base
from services.email_sync import routes, models

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure email_sync-specific tables exist (for dev)
    async with engine.begin() as conn:
        # Only create tables defined in this service, not all tables
        await conn.run_sync(
            lambda sync_conn: models.Email.__table__.create(sync_conn, checkfirst=True)
        )
        await conn.run_sync(
            lambda sync_conn: models.EmailAttachment.__table__.create(sync_conn, checkfirst=True)
        )
        await conn.run_sync(
            lambda sync_conn: models.SyncState.__table__.create(sync_conn, checkfirst=True)
        )
    yield

app = FastAPI(title="CRM Email Sync Service", version="1.0.0", lifespan=lifespan)

app.include_router(routes.router)

@app.get("/health")
async def health_check():
    return {"status": "ok"}
