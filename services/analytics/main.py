from fastapi import FastAPI
from services.analytics import routes

app = FastAPI(title="CRM Analytics Service", version="1.0.0")

app.include_router(routes.router)

@app.get("/health")
async def health_check():
    return {"status": "ok"}
