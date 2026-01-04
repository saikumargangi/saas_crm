from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List, Dict, Any
from uuid import UUID

from services.automation import models, schemas, engine
from services.auth import dependencies
from shared.database import get_db

router = APIRouter(prefix="/api/v1/automation", tags=["automation"])

# --- Workflow CRUD ---

@router.get("/workflows", response_model=List[schemas.WorkflowResponse])
async def list_workflows(
    user = Depends(dependencies.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(models.Workflow).where(models.Workflow.user_id == user.id))
    return result.scalars().all()

@router.post("/workflows", response_model=schemas.WorkflowResponse, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    workflow: schemas.WorkflowCreate,
    user = Depends(dependencies.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    db_wf = models.Workflow(**workflow.model_dump(), user_id=user.id)
    db.add(db_wf)
    await db.commit()
    await db.refresh(db_wf)
    return db_wf

@router.put("/workflows/{id}", response_model=schemas.WorkflowResponse)
async def update_workflow(
    id: UUID,
    workflow: schemas.WorkflowUpdate,
    user = Depends(dependencies.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(models.Workflow).where(models.Workflow.id == id, models.Workflow.user_id == user.id))
    db_wf = result.scalars().first()
    if not db_wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
        
    update_data = workflow.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_wf, key, value)
        
    await db.commit()
    await db.refresh(db_wf)
    return db_wf

@router.delete("/workflows/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow(
    id: UUID, 
    user = Depends(dependencies.get_current_active_user), 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(models.Workflow).where(models.Workflow.id == id, models.Workflow.user_id == user.id))
    db_wf = result.scalars().first()
    if not db_wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
        
    await db.delete(db_wf)
    await db.commit()
    return

# --- Trigger ---

@router.post("/events/trigger")
async def trigger_event(
    event_type: str = Body(...),
    payload: Dict[str, Any] = Body(...),
    user = Depends(dependencies.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Manually triggers an event for testing automation rules.
    """
    automation_engine = engine.AutomationEngine(db)
    results = await automation_engine.process_event(event_type, user.id, payload)
    return {"status": "processed", "results": results}
