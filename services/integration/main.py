from fastapi import FastAPI
from contextlib import asynccontextmanager
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from shared.database import engine, Base
from services.integration import routes

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist (for dev)
    async with engine.begin() as conn:
        from services.integration import models
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(title="CRM Integration Service", version="1.0.0", lifespan=lifespan)

app.include_router(routes.router)

@app.get("/health")
async def health_check():
    return {"status": "ok"}
