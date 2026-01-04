from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from dotenv import load_dotenv
# Load .env from root
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")
load_dotenv(env_path)

from shared.database import engine, Base
from shared.logging_utils import get_logger
from services.auth import routes as auth_routes
from services.email_sync import routes as email_routes
from services.crm import routes as crm_routes
from services.ai import routes as ai_routes

logger = get_logger(__name__)

# In a real microservices deployment, this Gateway might just proxy requests.
# For this implementation/local dev, we will mount the routers directly.

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup (simplifies dev)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request

app = FastAPI(
    title="CRM & Email Intelligence System API",
    version="1.0.0",
    lifespan=lifespan,
    description="Unified API Gateway for CRM Services"
)

# Rate Limiter Setup
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Audit Trail Middleware
@app.middleware("http")
async def audit_logging_middleware(request: Request, call_next):
    if request.method not in ["GET", "OPTIONS", "HEAD"]:
        # Log critical actions (state changes)
        username = "anonymous" 
        # In a real app, we'd extract the user from the token here or relies on downstream services to log strict audit.
        # For this gateway level audit, we log the attempt.
        logger.info(f"AUDIT: {request.method} {request.url} from {request.client.host}")
    
    response = await call_next(request)
    return response

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    return response

# CORS (Architecture 8.3)
origins = [
    "http://localhost:3000",
    "https://app.domain.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Route Mounting
# Auth Service -> /api/v1/auth
app.include_router(auth_routes.router)

# Email Service -> /api/v1/email
app.include_router(email_routes.router)

# CRM Service -> /api/v1/crm
app.include_router(crm_routes.router)

# AI Service -> /api/v1/ai
app.include_router(ai_routes.router)

from services.automation import routes as auto_routes
# Automation Service -> /api/v1/automation
app.include_router(auto_routes.router)

from services.analytics import routes as analytics_routes
# Analytics Service -> /api/v1/analytics
app.include_router(analytics_routes.router)

from services.integration import routes as integration_routes
# Integration Service -> /api/v1/integrations
app.include_router(integration_routes.router)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "services": ["auth", "email", "crm", "ai", "automation", "analytics", "integration"]
    }
