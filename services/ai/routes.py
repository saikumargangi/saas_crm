from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Dict, Any
from uuid import UUID

from services.ai.scoring import scorer
from services.ai.classification import classifier
from services.ai.actions import generator
from services.auth import dependencies

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])

@router.post("/score/lead")
async def score_lead(
    profile: Dict[str, Any] = Body(...),
    activities: List[Dict[str, Any]] = Body(...),
    user = Depends(dependencies.get_current_active_user)
):
    """
    Calculates lead score based on profile and activity history.
    """
    score = scorer.evaluate(profile, activities)
    return {"score": score}

@router.post("/classify/email")
async def classify_email(
    subject: str = Body(...),
    body: str = Body(...),
    user = Depends(dependencies.get_current_active_user)
):
    """
    Classifies email intent.
    """
    scores = classifier.classify(subject, body)
    return {"classification": scores}

@router.post("/suggest/actions")
async def suggest_next_actions(
    classification: Dict[str, float] = Body(...),
    context: Dict[str, Any] = Body(...),
    user = Depends(dependencies.get_current_active_user)
):
    """
    Suggests next actions based on classification.
    """
    suggestions = generator.suggest_actions(classification, context)
    return {"actions": suggestions}
