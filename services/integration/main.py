from fastapi import FastAPI
from contextlib import asynccontextmanager
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from shared.database import engine, Base
from services.integration import routes

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure integration-specific tables exist (for dev)
    async with engine.begin() as conn:
        from services.integration import models
        # Only create tables defined in this service, not all tables
        await conn.run_sync(
            lambda sync_conn: models.Integration.__table__.create(sync_conn, checkfirst=True)
        )
    yield

app = FastAPI(title="CRM Integration Service", version="1.0.0", lifespan=lifespan)

app.include_router(routes.router)

@app.get("/health")
async def health_check():
    return {"status": "ok"}
