"""
Analytics Metrics Calculations
Architecture Section 4.7
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
import logging

logger = logging.getLogger(__name__)


class AnalyticsCalculator:
    """Calculate analytics metrics for CRM system."""
    
    async def calculate_dashboard_metrics(self, user_id: str, db: AsyncSession) -> Dict[str, Any]:
        """
        Calculate all dashboard metrics.
        
        Returns comprehensive dashboard data including:
        - Lead conversion rate
        - Average sales cycle
        - Pipeline value
        - Email metrics
        - Lead distribution
        """
        from services.crm.models import Contact, Deal
        from services.email_sync.models import Email
        
        # Lead conversion rate
        total_leads = await db.scalar(
            select(func.count(Contact.id)).where(Contact.user_id == user_id)
        )
        converted_leads = await db.scalar(
            select(func.count(Contact.id)).where(
                and_(Contact.user_id == user_id, Contact.lead_status == 'converted')
            )
        )
        conversion_rate = (converted_leads / total_leads * 100) if total_leads > 0 else 0
        
        # Average sales cycle (days from deal creation to close)
        closed_deals_query = select(Deal).where(
            and_(
                Deal.user_id == user_id,
                Deal.stage.in_(['won', 'lost']),
                Deal.actual_close_date.isnot(None)
            )
        )
        closed_deals = await db.execute(closed_deals_query)
        closed_deals_list = closed_deals.scalars().all()
        
        if closed_deals_list:
            cycle_days = [
                (deal.actual_close_date - deal.created_at.date()).days
                for deal in closed_deals_list
            ]
            avg_sales_cycle = sum(cycle_days) / len(cycle_days)
        else:
            avg_sales_cycle = 0
        
        # Pipeline value by stage
        pipeline_query = select(
            Deal.stage,
            func.sum(Deal.amount).label('total_amount'),
            func.count(Deal.id).label('deal_count')
        ).where(
            and_(Deal.user_id == user_id, Deal.stage.notin_(['won', 'lost']))
        ).group_by(Deal.stage)
        
        pipeline_result = await db.execute(pipeline_query)
        pipeline_by_stage = {
            row.stage: {"amount": float(row.total_amount or 0), "count": row.deal_count}
            for row in pipeline_result
        }
        
        total_pipeline_value = sum(stage['amount'] for stage in pipeline_by_stage.values())
        
        # Email metrics (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        total_emails = await db.scalar(
            select(func.count(Email.id)).where(
                and_(Email.user_id == user_id, Email.received_at >= thirty_days_ago)
            )
        )
        
        # Lead score distribution
        score_distribution_query = select(
            func.count(Contact.id).label('count'),
            Contact.lead_status
        ).where(Contact.user_id == user_id).group_by(Contact.lead_status)
        
        score_dist_result = await db.execute(score_distribution_query)
        lead_distribution = {
            row.lead_status: row.count
            for row in score_dist_result
        }
        
        return {
            "lead_conversion_rate": round(conversion_rate, 2),
            "average_sales_cycle_days": round(avg_sales_cycle, 1),
            "total_pipeline_value": round(total_pipeline_value, 2),
            "pipeline_by_stage": pipeline_by_stage,
            "total_emails_30d": total_emails,
            "lead_distribution": lead_distribution,
            "total_contacts": total_leads,
            "converted_contacts": converted_leads
        }
    
    async def calculate_pipeline_analytics(self, user_id: str, db: AsyncSession) -> Dict[str, Any]:
        """Calculate detailed pipeline analytics."""
        from services.crm.models import Deal
        
        # Deals by stage with amounts
        stage_query = select(
            Deal.stage,
            func.count(Deal.id).label('count'),
            func.sum(Deal.amount).label('total_amount'),
            func.avg(Deal.amount).label('avg_amount'),
            func.avg(Deal.probability).label('avg_probability')
        ).where(Deal.user_id == user_id).group_by(Deal.stage)
        
        stage_result = await db.execute(stage_query)
        
        stages = {}
        for row in stage_result:
            stages[row.stage] = {
                "count": row.count,
                "total_amount": float(row.total_amount or 0),
                "average_amount": float(row.avg_amount or 0),
                "average_probability": float(row.avg_probability or 0)
            }
        
        # Win rate
        won_count = stages.get('won', {}).get('count', 0)
        lost_count = stages.get('lost', {}).get('count', 0)
        total_closed = won_count + lost_count
        win_rate = (won_count / total_closed * 100) if total_closed > 0 else 0
        
        # Expected revenue (sum of amount * probability for open deals)
        expected_revenue_query = select(
            func.sum(Deal.amount * Deal.probability / 100).label('expected')
        ).where(
            and_(Deal.user_id == user_id, Deal.stage.notin_(['won', 'lost']))
        )
        
        expected_revenue = await db.scalar(expected_revenue_query) or 0
        
        return {
            "stages": stages,
            "win_rate": round(win_rate, 2),
            "expected_revenue": round(float(expected_revenue), 2),
            "total_closed_deals": total_closed
        }
    
    async def forecast_revenue(self, user_id: str, db: AsyncSession, months: int = 3) -> Dict[str, Any]:
        """
        Forecast revenue for next N months.
        
        Simple forecast based on:
        - Historical win rate
        - Current pipeline
        - Average deal size
        - Average sales cycle
        """
        from services.crm.models import Deal
        
        # Get historical data (last 6 months)
        six_months_ago = datetime.utcnow() - timedelta(days=180)
        
        historical_query = select(Deal).where(
            and_(
                Deal.user_id == user_id,
                Deal.stage == 'won',
                Deal.actual_close_date >= six_months_ago.date()
            )
        )
        
        historical_deals = await db.execute(historical_query)
        historical_list = historical_deals.scalars().all()
        
        if not historical_list:
            return {
                "forecast_months": months,
                "monthly_forecast": [],
                "total_forecast": 0,
                "confidence": "low",
                "note": "Insufficient historical data"
            }
        
        # Calculate average monthly revenue
        monthly_revenue = {}
        for deal in historical_list:
            month_key = deal.actual_close_date.strftime('%Y-%m')
            if month_key not in monthly_revenue:
                monthly_revenue[month_key] = 0
            monthly_revenue[month_key] += float(deal.amount or 0)
        
        avg_monthly_revenue = sum(monthly_revenue.values()) / len(monthly_revenue)
        
        # Generate forecast
        forecast = []
        current_date = datetime.utcnow()
        
        for i in range(months):
            forecast_date = current_date + timedelta(days=30 * (i + 1))
            month_key = forecast_date.strftime('%Y-%m')
            
            # Simple forecast: average + 10% growth
            forecast_amount = avg_monthly_revenue * (1.1 ** i)
            
            forecast.append({
                "month": month_key,
                "forecast_amount": round(forecast_amount, 2)
            })
        
        total_forecast = sum(f['forecast_amount'] for f in forecast)
        
        return {
            "forecast_months": months,
            "monthly_forecast": forecast,
            "total_forecast": round(total_forecast, 2),
            "average_historical_monthly": round(avg_monthly_revenue, 2),
            "confidence": "medium"
        }
    
    async def calculate_email_metrics(self, user_id: str, db: AsyncSession, days: int = 30) -> Dict[str, Any]:
        """Calculate email engagement metrics."""
        from services.email_sync.models import Email
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Total emails
        total_emails = await db.scalar(
            select(func.count(Email.id)).where(
                and_(Email.user_id == user_id, Email.received_at >= start_date)
            )
        )
        
        # Emails by classification
        classification_query = select(
            Email.classification,
            func.count(Email.id).label('count')
        ).where(
            and_(Email.user_id == user_id, Email.received_at >= start_date)
        ).group_by(Email.classification)
        
        classification_result = await db.execute(classification_query)
        by_classification = {
            row.classification or 'unclassified': row.count
            for row in classification_result
        }
        
        # Sentiment distribution
        sentiment_query = select(
            Email.sentiment,
            func.count(Email.id).label('count')
        ).where(
            and_(Email.user_id == user_id, Email.received_at >= start_date)
        ).group_by(Email.sentiment)
        
        sentiment_result = await db.execute(sentiment_query)
        by_sentiment = {
            row.sentiment or 'neutral': row.count
            for row in sentiment_result
        }
        
        return {
            "total_emails": total_emails,
            "by_classification": by_classification,
            "by_sentiment": by_sentiment,
            "period_days": days
        }


# Global analytics calculator instance
analytics_calculator = AnalyticsCalculator()


async def get_analytics_calculator() -> AnalyticsCalculator:
    """Dependency for getting analytics calculator."""
    return analytics_calculator
