from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any

from services.analytics import engine
from services.auth import dependencies
from shared.database import get_db

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])

@router.get("/dashboard/summary")
async def get_dashboard_summary(
    user = Depends(dependencies.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Aggregates high-level metrics for the main dashboard.
    """
    analytics = engine.AnalyticsEngine(db)
    
    pipeline_metrics = await analytics.get_pipeline_metrics(user.id)
    activity_metrics = await analytics.get_activity_metrics(user.id, days=30)
    email_stats = await analytics.get_email_stats(user.id)
    
    return {
        "pipeline": pipeline_metrics,
        "recent_activity": activity_metrics,
        "email_stats": email_stats
    }

@router.get("/reports/pipeline")
async def get_pipeline_report(
    user = Depends(dependencies.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    analytics = engine.AnalyticsEngine(db)
    return await analytics.get_pipeline_metrics(user.id)
