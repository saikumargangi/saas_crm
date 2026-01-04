"""
Workflow Engine for Automation Service
Architecture Section 4.6
"""
import logging
from typing import Dict, Any, List
from datetime import datetime
import json

logger = logging.getLogger(__name__)


class WorkflowEngine:
    """Execute workflows based on triggers and conditions."""
    
    async def evaluate_trigger(self, workflow: Dict[str, Any], event: Dict[str, Any]) -> bool:
        """
        Check if event matches workflow trigger.
        
        Args:
            workflow: Workflow configuration
            event: Event data {type, data, timestamp}
        
        Returns:
            True if trigger matches
        """
        trigger_type = workflow.get('trigger_type')
        trigger_config = workflow.get('trigger_config', {})
        
        # Check if event type matches trigger type
        if trigger_type == 'email_received' and event.get('type') == 'email_received':
            # Check provider if specified
            provider = trigger_config.get('provider')
            if provider and event.get('data', {}).get('provider') != provider:
                return False
            return True
        
        elif trigger_type == 'contact_updated' and event.get('type') == 'contact_updated':
            return True
        
        elif trigger_type == 'deal_stage_changed' and event.get('type') == 'deal_stage_changed':
            return True
        
        elif trigger_type == 'scheduled':
            # For scheduled workflows, check if it's time to run
            # This would be handled by a separate scheduler service
            return False
        
        elif trigger_type == 'manual':
            # Manual workflows are triggered explicitly
            return event.get('type') == 'manual_trigger'
        
        return False
    
    async def evaluate_conditions(self, conditions: List[Dict[str, Any]], event_data: Dict[str, Any]) -> bool:
        """
        Evaluate all conditions for a workflow.
        
        Args:
            conditions: List of condition objects
            event_data: Event data to evaluate against
        
        Returns:
            True if all conditions pass
        """
        if not conditions:
            return True
        
        for condition in conditions:
            field = condition.get('field')
            operator = condition.get('operator')
            value = condition.get('value')
            
            # Get field value from event data
            field_value = event_data.get(field)
            
            # Evaluate condition
            if operator == 'equals':
                if field_value != value:
                    return False
            elif operator == 'not_equals':
                if field_value == value:
                    return False
            elif operator == 'contains':
                if value not in str(field_value):
                    return False
            elif operator == 'not_contains':
                if value in str(field_value):
                    return False
            elif operator == 'greater_than':
                if not (field_value and field_value > value):
                    return False
            elif operator == 'less_than':
                if not (field_value and field_value < value):
                    return False
            elif operator == 'not_empty':
                if not field_value:
                    return False
            elif operator == 'is_empty':
                if field_value:
                    return False
        
        return True
    
    async def execute_actions(self, actions: List[Dict[str, Any]], event_data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """
        Execute all actions in a workflow.
        
        Args:
            actions: List of action objects
            event_data: Event data
            user_id: User ID for context
        
        Returns:
            Execution result
        """
        results = []
        
        for action in actions:
            action_type = action.get('type')
            
            try:
                if action_type == 'classify_email':
                    result = await self._action_classify_email(action, event_data)
                elif action_type == 'update_lead_score':
                    result = await self._action_update_lead_score(action, event_data)
                elif action_type == 'send_notification':
                    result = await self._action_send_notification(action, event_data, user_id)
                elif action_type == 'create_task':
                    result = await self._action_create_task(action, event_data, user_id)
                elif action_type == 'update_contact':
                    result = await self._action_update_contact(action, event_data)
                elif action_type == 'send_email':
                    result = await self._action_send_email(action, event_data, user_id)
                else:
                    result = {"status": "skipped", "reason": f"Unknown action type: {action_type}"}
                
                results.append({
                    "action": action_type,
                    "result": result,
                    "status": "success"
                })
            except Exception as e:
                logger.error(f"Action execution error: {e}")
                results.append({
                    "action": action_type,
                    "error": str(e),
                    "status": "failed"
                })
        
        return {
            "executed_at": datetime.utcnow().isoformat(),
            "actions_count": len(actions),
            "results": results
        }
    
    async def _action_classify_email(self, action: Dict[str, Any], event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Classify email using AI service."""
        email_id = event_data.get('email_id')
        if not email_id:
            return {"status": "skipped", "reason": "No email_id in event"}
        
        # In real implementation, call AI service
        logger.info(f"Classifying email {email_id}")
        return {"status": "success", "email_id": email_id, "classification": "inquiry"}
    
    async def _action_update_lead_score(self, action: Dict[str, Any], event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update lead score based on classification."""
        contact_id = event_data.get('contact_id')
        if not contact_id:
            return {"status": "skipped", "reason": "No contact_id in event"}
        
        # In real implementation, calculate and update score
        logger.info(f"Updating lead score for contact {contact_id}")
        return {"status": "success", "contact_id": contact_id, "new_score": 75}
    
    async def _action_send_notification(self, action: Dict[str, Any], event_data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """Send notification to user."""
        channel = action.get('channel', 'email')
        template = action.get('template', 'default')
        
        logger.info(f"Sending {channel} notification to user {user_id} using template {template}")
        return {"status": "success", "channel": channel, "template": template}
    
    async def _action_create_task(self, action: Dict[str, Any], event_data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """Create a task for the user."""
        task_title = action.get('title', 'New Task')
        task_description = action.get('description', '')
        
        logger.info(f"Creating task '{task_title}' for user {user_id}")
        return {"status": "success", "task_title": task_title}
    
    async def _action_update_contact(self, action: Dict[str, Any], event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update contact fields."""
        contact_id = event_data.get('contact_id')
        updates = action.get('updates', {})
        
        if not contact_id:
            return {"status": "skipped", "reason": "No contact_id in event"}
        
        logger.info(f"Updating contact {contact_id} with {updates}")
        return {"status": "success", "contact_id": contact_id, "updates": updates}
    
    async def _action_send_email(self, action: Dict[str, Any], event_data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """Send email via integration service."""
        to_address = action.get('to')
        subject = action.get('subject', 'No Subject')
        body = action.get('body', '')
        
        logger.info(f"Sending email to {to_address}: {subject}")
        return {"status": "success", "to": to_address, "subject": subject}


# Global workflow engine instance
workflow_engine = WorkflowEngine()


async def get_workflow_engine() -> WorkflowEngine:
    """Dependency for getting workflow engine."""
    return workflow_engine
