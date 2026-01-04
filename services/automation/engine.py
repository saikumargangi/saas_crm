from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any, List
import logging
import json

from services.automation import models

logger = logging.getLogger(__name__)

class AutomationEngine:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def process_event(self, trigger_type: str, user_id: str, payload: Dict[str, Any]):
        """
        Main entry point. Finds workflows for trigger_type + user_id, checks conditions, executes actions.
        """
        # 1. Fetch Active Workflows
        stmt = select(models.Workflow).where(
            models.Workflow.user_id == user_id,
            models.Workflow.trigger_type == trigger_type,
            models.Workflow.is_active == True
        )
        result = await self.db.execute(stmt)
        workflows = result.scalars().all()
        
        results = []
        for wf in workflows:
            execution_id = await self._log_start(wf.id, payload)
            try:
                if self._check_conditions(wf.conditions, payload):
                    action_results = await self._execute_actions(wf.actions, payload)
                    await self._log_success(execution_id, action_results)
                    results.append({"workflow": wf.name, "status": "executed"})
                else:
                    await self._log_skipped(execution_id)
                    results.append({"workflow": wf.name, "status": "skipped"})
            except Exception as e:
                logger.error(f"Workflow {wf.id} failed: {e}")
                await self._log_failure(execution_id, str(e))
                results.append({"workflow": wf.name, "status": "failed"})
                
        return results

    def _check_conditions(self, conditions: List[Dict], payload: Dict) -> bool:
        """
        Evaluates list of conditions. AND logic by default.
        Condition format: {"field": "deal.amount", "operator": "gt", "value": 1000}
        """
        if not conditions:
            return True
            
        for cond in conditions:
            field_path = cond.get('field', '').split('.')
            val = payload
            for p in field_path:
                val = val.get(p, {}) if isinstance(val, dict) else None
                if val is None: break
            
            # If val is still None/dict but we expected a value comparison, might be mismatch
            # Simplified logic:
            operator = cond.get('operator')
            target = cond.get('value')
            
            if not self._compare(val, operator, target):
                return False
                
        return True

    def _compare(self, actual, operator, target):
        if operator == 'eq': return actual == target
        if operator == 'neq': return actual != target
        if operator == 'gt': return (actual or 0) > target
        if operator == 'lt': return (actual or 0) < target
        if operator == 'contains': return target in (actual or "")
        return False

    async def _execute_actions(self, actions: List[Dict], payload: Dict):
        """
        Executes list of actions.
        Action format: {"type": "send_email", ...}
        """
        results = []
        for action in actions:
            act_type = action.get('type')
            
            if act_type == 'log_activity':
                # Call CRM Activity endpoint (internal or stub)
                results.append(f"Logged activity for {payload.get('id')}")
                
            elif act_type == 'update_field':
                # Update logic
                results.append(f"Updated field {action.get('field')}")
                
            elif act_type == 'send_email':
                # Email logic
                results.append("Sent email")
            
            else:
                results.append(f"Unknown action {act_type}")
                
        return results

    # --- Logging Helpers ---
    async def _log_start(self, wf_id, payload):
        ex = models.WorkflowExecution(workflow_id=wf_id, trigger_data=payload, status="running")
        self.db.add(ex)
        await self.db.commit()
        await self.db.refresh(ex)
        return ex.id

    async def _log_success(self, ex_id, results):
        await self._update_ex(ex_id, "success", result=results)

    async def _log_failure(self, ex_id, error):
        await self._update_ex(ex_id, "failed", error=error)
        
    async def _log_skipped(self, ex_id):
        await self._update_ex(ex_id, "skipped")

    async def _update_ex(self, ex_id, status, result=None, error=None):
        stmt = select(models.WorkflowExecution).where(models.WorkflowExecution.id == ex_id)
        res = await self.db.execute(stmt)
        ex = res.scalars().first()
        ex.status = status
        if result: ex.result = result
        if error: ex.error_message = error
        await self.db.commit()
