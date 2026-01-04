from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict, Any
from uuid import UUID

from services.integration import models, schemas
from services.auth import dependencies
from shared.database import get_db

router = APIRouter(prefix="/api/v1/integrations", tags=["integrations"])

@router.get("", response_model=List[schemas.IntegrationResponse])
async def list_integrations(
    user = Depends(dependencies.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(models.Integration).where(models.Integration.user_id == user.id))
    return result.scalars().all()

@router.post("", response_model=schemas.IntegrationResponse, status_code=status.HTTP_201_CREATED)
async def create_integration(
    integration: schemas.IntegrationCreate,
    user = Depends(dependencies.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    db_int = models.Integration(**integration.model_dump(), user_id=user.id)
    db.add(db_int)
    await db.commit()
    await db.refresh(db_int)
    return db_int

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_integration(
    id: UUID,
    user = Depends(dependencies.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(models.Integration).where(models.Integration.id == id, models.Integration.user_id == user.id))
    db_int = result.scalars().first()
    if not db_int:
        raise HTTPException(status_code=404, detail="Integration not found")
        
    await db.delete(db_int)
    await db.commit()
    return

# --- Webhook Handler (External) ---
# This might be used by external services (Slack, Stripe, etc.) to notify our system.
# The URL would be: POST /api/v1/integrations/webhooks/{integration_id}

@router.post("/webhooks/{integration_id}")
async def receive_webhook(
    integration_id: UUID,
    payload: Dict[str, Any] = Body(...),
    db: AsyncSession = Depends(get_db)
):
    # Public endpoint, verify integration existence and potentially a signature check
    result = await db.execute(select(models.Integration).where(models.Integration.id == integration_id))
    db_int = result.scalars().first()
    
    if not db_int or not db_int.is_active:
         raise HTTPException(status_code=404, detail="Integration not found or inactive")
         
    # Trigger event in our system?
    # For now, just log it.
    return {"status": "received", "provider": db_int.provider}
