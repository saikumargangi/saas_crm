"""
Cloud Tasks utilities for delayed job execution and workflow scheduling
"""
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import json
import asyncio

logger = logging.getLogger(__name__)


class MockTaskQueue:
    """Mock task queue for local development"""
    
    def __init__(self):
        self.tasks = []
        self.running = False
    
    async def enqueue_task(
        self,
        task_name: str,
        payload: Dict[str, Any],
        delay_seconds: int = 0,
        schedule_time: Optional[datetime] = None
    ):
        """Enqueue a task for execution"""
        task = {
            "name": task_name,
            "payload": payload,
            "scheduled_at": schedule_time or (datetime.utcnow() + timedelta(seconds=delay_seconds)),
            "status": "pending"
        }
        
        self.tasks.append(task)
        logger.info(f"Enqueued task {task_name} (delay: {delay_seconds}s)")
        
        # Execute immediately if no delay (for local dev)
        if delay_seconds == 0 and schedule_time is None:
            await self._execute_task(task)
        
        return task
    
    async def _execute_task(self, task: Dict[str, Any]):
        """Execute a task"""
        task_name = task["name"]
        payload = task["payload"]
        
        try:
            # Route to appropriate handler
            if task_name == "execute_workflow":
                await self._execute_workflow(payload)
            elif task_name == "send_notification":
                await self._send_notification(payload)
            elif task_name == "sync_integration":
                await self._sync_integration(payload)
            else:
                logger.warning(f"Unknown task type: {task_name}")
            
            task["status"] = "completed"
        except Exception as e:
            logger.error(f"Task execution failed: {e}")
            task["status"] = "failed"
            task["error"] = str(e)
    
    async def _execute_workflow(self, payload: Dict[str, Any]):
        """Execute a workflow"""
        workflow_id = payload.get("workflow_id")
        logger.info(f"Executing workflow {workflow_id}")
        # Implementation would call automation service
    
    async def _send_notification(self, payload: Dict[str, Any]):
        """Send a notification"""
        user_id = payload.get("user_id")
        message = payload.get("message")
        logger.info(f"Sending notification to {user_id}: {message}")
        # Implementation would call notification service
    
    async def _sync_integration(self, payload: Dict[str, Any]):
        """Sync an integration"""
        integration_id = payload.get("integration_id")
        logger.info(f"Syncing integration {integration_id}")
        # Implementation would call integration service


# Global task queue instance
_task_queue = MockTaskQueue()


async def schedule_task(
    task_name: str,
    payload: Dict[str, Any],
    delay_seconds: int = 0,
    schedule_time: Optional[datetime] = None
):
    """
    Schedule a task for execution
    
    Args:
        task_name: Task identifier (e.g., 'execute_workflow', 'send_notification')
        payload: Task payload data
        delay_seconds: Delay in seconds before execution
        schedule_time: Specific time to execute (overrides delay_seconds)
    
    Returns:
        Task object
    """
    return await _task_queue.enqueue_task(task_name, payload, delay_seconds, schedule_time)


async def schedule_workflow_execution(workflow_id: str, delay_seconds: int = 0):
    """Schedule a workflow for execution"""
    return await schedule_task(
        "execute_workflow",
        {"workflow_id": workflow_id},
        delay_seconds=delay_seconds
    )


async def schedule_notification(user_id: str, message: str, delay_seconds: int = 0):
    """Schedule a notification"""
    return await schedule_task(
        "send_notification",
        {"user_id": user_id, "message": message},
        delay_seconds=delay_seconds
    )


async def schedule_integration_sync(integration_id: str, interval_seconds: int = 1800):
    """Schedule periodic integration sync (default: 30 minutes)"""
    return await schedule_task(
        "sync_integration",
        {"integration_id": integration_id},
        delay_seconds=interval_seconds
    )


# Task types
class TaskTypes:
    """Standard task types"""
    EXECUTE_WORKFLOW = "execute_workflow"
    SEND_NOTIFICATION = "send_notification"
    SYNC_INTEGRATION = "sync_integration"
    CLASSIFY_EMAIL = "classify_email"
    SCORE_LEAD = "score_lead"
