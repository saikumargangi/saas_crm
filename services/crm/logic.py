from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from uuid import UUID

from services.crm import models
from services.crm import schemas

class CRMLogic:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def validate_deal_stage_transition(self, deal_id: UUID, new_stage: str, old_stage: str) -> bool:
        """
        Validates if a deal can move from old_stage to new_stage.
        Rules:
        - Cannot move from 'lost' to 'prospect' (example rule)
        - Cannot move from 'won' to 'negotiation'
        """
        if old_stage == "lost" and new_stage != "lost":
            # Just an example rule, maybe we allow reopening, maybe not.
            # Let's say we allow it but log it.
            pass
            
        if old_stage == "won" and new_stage != "won":
             raise HTTPException(status_code=400, detail="Cannot change stage of a won deal")

        return True

    async def check_contact_duplication(self, email: str, user_id: UUID) -> bool:
        result = await self.db.execute(
            select(models.Contact).where(
                models.Contact.email == email, 
                models.Contact.user_id == user_id
            )
        )
        if result.scalars().first():
            raise HTTPException(status_code=400, detail=f"Contact with email {email} already exists")
        return False

    async def calculate_deal_probability(self, stage: str) -> int:
        """Returns standard probability for a given stage"""
        mapping = {
            "prospect": 10,
            "qualified": 20,
            "negotiation": 50,
            "committed": 80,
            "won": 100,
            "lost": 0
        }
        return mapping.get(stage, 0)
