from fastapi import FastAPI
from contextlib import asynccontextmanager
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from shared.database import engine, Base
from services.crm import routes, models

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure CRM-specific tables exist (for dev)
    async with engine.begin() as conn:
        # Only create tables defined in this service, not all tables
        await conn.run_sync(
            lambda sync_conn: models.Company.__table__.create(sync_conn, checkfirst=True)
        )
        await conn.run_sync(
            lambda sync_conn: models.Contact.__table__.create(sync_conn, checkfirst=True)
        )
        await conn.run_sync(
            lambda sync_conn: models.Deal.__table__.create(sync_conn, checkfirst=True)
        )
        await conn.run_sync(
            lambda sync_conn: models.Activity.__table__.create(sync_conn, checkfirst=True)
        )
    yield

app = FastAPI(title="CRM Core Service", version="1.0.0", lifespan=lifespan)

app.include_router(routes.router)

@app.get("/health")
async def health_check():
    return {"status": "ok"}
