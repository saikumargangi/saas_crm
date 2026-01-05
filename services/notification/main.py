from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List, Optional
from datetime import datetime
import httpx
import logging

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from shared.database import get_db
from services.auth import dependencies, models as auth_models
from .models import Notification, NotificationPreference

logger = logging.getLogger(__name__)

app = FastAPI(title="Notification Service", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "notification"}


# Get notifications
@app.get("/api/v1/notifications")
async def get_notifications(
    skip: int = 0,
    limit: int = 20,
    unread_only: bool = False,
    current_user: auth_models.User = Depends(dependencies.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user notifications"""
    query = select(Notification).where(Notification.user_id == current_user.id)
    
    if unread_only:
        query = query.where(Notification.is_read == False)
    
    query = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    notifications = result.scalars().all()
    
    return {
        "data": [
            {
                "id": str(n.id),
                "type": n.type,
                "title": n.title,
                "message": n.message,
                "link": n.link,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat(),
                "read_at": n.read_at.isoformat() if n.read_at else None
            }
            for n in notifications
        ]
    }


# Mark notification as read
@app.put("/api/v1/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: auth_models.User = Depends(dependencies.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark notification as read"""
    stmt = (
        update(Notification)
        .where(Notification.id == notification_id)
        .where(Notification.user_id == current_user.id)
        .values(is_read=True, read_at=datetime.utcnow())
    )
    
    await db.execute(stmt)
    await db.commit()
    
    return {"success": True}


# Mark all as read
@app.put("/api/v1/notifications/mark-all-read")
async def mark_all_read(
    current_user: auth_models.User = Depends(dependencies.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark all notifications as read"""
    stmt = (
        update(Notification)
        .where(Notification.user_id == current_user.id)
        .where(Notification.is_read == False)
        .values(is_read=True, read_at=datetime.utcnow())
    )
    
    await db.execute(stmt)
    await db.commit()
    
    return {"success": True}


# Get notification preferences
@app.get("/api/v1/notifications/preferences")
async def get_preferences(
    current_user: auth_models.User = Depends(dependencies.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user notification preferences"""
    result = await db.execute(
        select(NotificationPreference).where(
            NotificationPreference.user_id == current_user.id
        )
    )
    prefs = result.scalar_one_or_none()
    
    if not prefs:
        # Create default preferences
        prefs = NotificationPreference(user_id=current_user.id)
        db.add(prefs)
        await db.commit()
        await db.refresh(prefs)
    
    return {
        "email_enabled": prefs.email_enabled,
        "in_app_enabled": prefs.in_app_enabled,
        "webhook_enabled": prefs.webhook_enabled,
        "webhook_url": prefs.webhook_url,
        "notify_new_email": prefs.notify_new_email,
        "notify_deal_update": prefs.notify_deal_update,
        "notify_contact_update": prefs.notify_contact_update,
        "notify_workflow_complete": prefs.notify_workflow_complete
    }


# Update notification preferences
@app.put("/api/v1/notifications/preferences")
async def update_preferences(
    preferences: dict,
    current_user: auth_models.User = Depends(dependencies.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user notification preferences"""
    result = await db.execute(
        select(NotificationPreference).where(
            NotificationPreference.user_id == current_user.id
        )
    )
    prefs = result.scalar_one_or_none()
    
    if not prefs:
        prefs = NotificationPreference(user_id=current_user.id)
        db.add(prefs)
    
    # Update fields
    for key, value in preferences.items():
        if hasattr(prefs, key):
            setattr(prefs, key, value)
    
    await db.commit()
    
    return {"success": True}


# Create notification (internal use)
async def create_notification(
    user_id: str,
    notification_type: str,
    title: str,
    message: str,
    link: Optional[str] = None,
    metadata: Optional[dict] = None,
    db: AsyncSession = None
):
    """Create a new notification and send via configured channels"""
    
    # Create in-app notification
    notification = Notification(
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        link=link,
        metadata=metadata
    )
    db.add(notification)
    await db.commit()
    
    # Get user preferences
    result = await db.execute(
        select(NotificationPreference).where(NotificationPreference.user_id == user_id)
    )
    prefs = result.scalar_one_or_none()
    
    if prefs:
        # Send webhook if enabled
        if prefs.webhook_enabled and prefs.webhook_url:
            try:
                async with httpx.AsyncClient() as client:
                    await client.post(
                        prefs.webhook_url,
                        json={
                            "type": notification_type,
                            "title": title,
                            "message": message,
                            "link": link,
                            "timestamp": datetime.utcnow().isoformat()
                        },
                        timeout=5.0
                    )
            except Exception as e:
                logger.error(f"Failed to send webhook notification: {e}")
    
    return notification


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8008)
