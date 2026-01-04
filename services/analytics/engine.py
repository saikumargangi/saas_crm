from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from typing import Dict, Any, List
import datetime

# We need to access models from other services.
# In a true microservices, we'd query via API or read from a Data Warehouse / Read Replica.
# For this monolith, we import models directly.
from services.crm import models as crm_models
from services.email_sync import models as email_models
from services.auth import models as auth_models

class AnalyticsEngine:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_pipeline_metrics(self, user_id: str) -> Dict[str, Any]:
        """
        Returns pipeline summary: Total Value, Count by Stage, Win Rate.
        """
        # 1. Total Pipeline Value & Count
        stmt_total = select(
            func.sum(crm_models.Deal.amount),
            func.count(crm_models.Deal.id)
        ).where(
            crm_models.Deal.user_id == user_id,
            crm_models.Deal.stage != 'lost' # Exclude lost for value
        )
        total_res = await self.db.execute(stmt_total)
        row = total_res.first()
        total_value = row[0] or 0
        total_count = row[1] or 0
        
        # 2. Key Metrics for Win Rate
        # Win Rate = Won / (Won + Lost)
        stmt_win = select(func.count(crm_models.Deal.id)).where(
            crm_models.Deal.user_id == user_id,
            crm_models.Deal.stage == 'won'
        )
        stmt_closed = select(func.count(crm_models.Deal.id)).where(
            crm_models.Deal.user_id == user_id,
            crm_models.Deal.stage.in_(['won', 'lost'])
        )
        
        won_count = (await self.db.execute(stmt_win)).scalar() or 0
        closed_count = (await self.db.execute(stmt_closed)).scalar() or 0
        win_rate = (won_count / closed_count * 100) if closed_count > 0 else 0
        
        # 3. Count/Value by Stage
        stmt_stages = select(
            crm_models.Deal.stage, 
            func.count(crm_models.Deal.id), 
            func.sum(crm_models.Deal.amount)
        ).where(
            crm_models.Deal.user_id == user_id
        ).group_by(crm_models.Deal.stage)
        
        stages_res = await self.db.execute(stmt_stages)
        by_stage = {}
        for row in stages_res:
             # row[0] = stage name
            by_stage[row[0]] = {
                "count": row[1], 
                "value": float(row[2] or 0)
            }
            
        return {
            "total_value": float(total_value),
            "deal_count": total_count,
            "win_rate": round(win_rate, 1),
            "by_stage": by_stage
        }

    async def get_activity_metrics(self, user_id: str, days: int = 7) -> Dict[str, Any]:
        """
        Returns activity counts for the last N days.
        """
        since = datetime.datetime.utcnow() - datetime.timedelta(days=days)
        
        stmt = select(
            crm_models.Activity.type,
            func.count(crm_models.Activity.id)
        ).where(
            crm_models.Activity.user_id == user_id,
            crm_models.Activity.created_at >= since
        ).group_by(crm_models.Activity.type)
        
        result = await self.db.execute(stmt)
        return {row[0]: row[1] for row in result}

    async def get_email_stats(self, user_id: str) -> Dict[str, Any]:
        """
        Returns email sync stats (Total processed, Unread).
        """
        stmt_total = select(func.count(email_models.Email.id)).where(email_models.Email.user_id == user_id)
        stmt_unread = select(func.count(email_models.Email.id)).where(
            email_models.Email.user_id == user_id, 
            email_models.Email.is_read == False
        )
        
        total = (await self.db.execute(stmt_total)).scalar() or 0
        unread = (await self.db.execute(stmt_unread)).scalar() or 0
        
        return {
            "total_synced": total,
            "unread_count": unread
        }
