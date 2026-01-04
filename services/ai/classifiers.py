"""
AI Service - Email Classification and Lead Scoring
Architecture Section 4.5
"""
import os
import json
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class AIClassifier:
    """Email classification and lead scoring using AI."""
    
    def __init__(self):
        self.provider = os.getenv('AI_PROVIDER', 'mock')  # openai, gemini, or mock
        self.openai_key = os.getenv('OPENAI_API_KEY')
        self.gemini_key = os.getenv('GEMINI_API_KEY')
    
    async def classify_email(self, email_content: str, subject: str, from_address: str) -> Dict[str, Any]:
        """
        Classify email into categories.
        
        Returns:
            {
                "category": str,  # inquiry, proposal, objection, follow_up, etc.
                "confidence": float,  # 0.0 to 1.0
                "sentiment": str,  # positive, negative, neutral
                "priority": str  # high, medium, low
            }
        """
        if self.provider == 'openai':
            return await self._classify_with_openai(email_content, subject, from_address)
        elif self.provider == 'gemini':
            return await self._classify_with_gemini(email_content, subject, from_address)
        else:
            return await self._classify_mock(email_content, subject, from_address)
    
    async def _classify_with_openai(self, content: str, subject: str, from_addr: str) -> Dict[str, Any]:
        """Classify using OpenAI GPT-4."""
        try:
            import openai
            openai.api_key = self.openai_key
            
            prompt = f"""Classify this email into one of these categories: inquiry, proposal, objection, follow_up, meeting_request, thank_you, complaint, other.
Also determine sentiment (positive, negative, neutral) and priority (high, medium, low).

Subject: {subject}
From: {from_addr}
Content: {content[:500]}

Respond in JSON format:
{{"category": "...", "confidence": 0.0-1.0, "sentiment": "...", "priority": "..."}}"""
            
            response = await openai.ChatCompletion.acreate(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
        except Exception as e:
            logger.error(f"OpenAI classification error: {e}")
            return await self._classify_mock(content, subject, from_addr)
    
    async def _classify_with_gemini(self, content: str, subject: str, from_addr: str) -> Dict[str, Any]:
        """Classify using Google Gemini."""
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.gemini_key)
            
            model = genai.GenerativeModel('gemini-pro')
            
            prompt = f"""Classify this email into one of these categories: inquiry, proposal, objection, follow_up, meeting_request, thank_you, complaint, other.
Also determine sentiment (positive, negative, neutral) and priority (high, medium, low).

Subject: {subject}
From: {from_addr}
Content: {content[:500]}

Respond in JSON format:
{{"category": "...", "confidence": 0.0-1.0, "sentiment": "...", "priority": "..."}}"""
            
            response = await model.generate_content_async(prompt)
            result = json.loads(response.text)
            return result
        except Exception as e:
            logger.error(f"Gemini classification error: {e}")
            return await self._classify_mock(content, subject, from_addr)
    
    async def _classify_mock(self, content: str, subject: str, from_addr: str) -> Dict[str, Any]:
        """Mock classification for testing."""
        # Simple keyword-based classification
        content_lower = (content + " " + subject).lower()
        
        # Determine category
        if any(word in content_lower for word in ['inquiry', 'question', 'asking', 'wondering']):
            category = 'inquiry'
            confidence = 0.85
        elif any(word in content_lower for word in ['proposal', 'offer', 'suggest', 'recommend']):
            category = 'proposal'
            confidence = 0.80
        elif any(word in content_lower for word in ['objection', 'concern', 'issue', 'problem']):
            category = 'objection'
            confidence = 0.75
        elif any(word in content_lower for word in ['meeting', 'schedule', 'calendar', 'appointment']):
            category = 'meeting_request'
            confidence = 0.90
        elif any(word in content_lower for word in ['thank', 'appreciate', 'grateful']):
            category = 'thank_you'
            confidence = 0.95
        else:
            category = 'other'
            confidence = 0.60
        
        # Determine sentiment
        positive_words = ['great', 'excellent', 'perfect', 'love', 'happy', 'excited']
        negative_words = ['bad', 'terrible', 'awful', 'hate', 'angry', 'disappointed']
        
        pos_count = sum(1 for word in positive_words if word in content_lower)
        neg_count = sum(1 for word in negative_words if word in content_lower)
        
        if pos_count > neg_count:
            sentiment = 'positive'
        elif neg_count > pos_count:
            sentiment = 'negative'
        else:
            sentiment = 'neutral'
        
        # Determine priority
        if any(word in content_lower for word in ['urgent', 'asap', 'immediately', 'critical']):
            priority = 'high'
        elif category in ['inquiry', 'proposal', 'meeting_request']:
            priority = 'medium'
        else:
            priority = 'low'
        
        return {
            "category": category,
            "confidence": confidence,
            "sentiment": sentiment,
            "priority": priority
        }
    
    async def score_lead(self, contact_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate lead score based on multiple factors.
        
        Args:
            contact_data: {
                "email_count": int,
                "last_email_date": datetime,
                "avg_response_time_hours": float,
                "email_sentiment": str,
                "company_size": int,
                "industry": str
            }
        
        Returns:
            {
                "score": int (0-100),
                "rating": str (hot, warm, cold),
                "factors": dict
            }
        """
        score = 0
        factors = {}
        
        # Email engagement (0-30 points)
        email_count = contact_data.get('email_count', 0)
        if email_count > 10:
            email_score = 30
        elif email_count > 5:
            email_score = 20
        elif email_count > 0:
            email_score = 10
        else:
            email_score = 0
        score += email_score
        factors['email_engagement'] = email_score
        
        # Response time (0-20 points)
        avg_response = contact_data.get('avg_response_time_hours', 999)
        if avg_response < 2:
            response_score = 20
        elif avg_response < 24:
            response_score = 15
        elif avg_response < 72:
            response_score = 10
        else:
            response_score = 5
        score += response_score
        factors['response_time'] = response_score
        
        # Sentiment (0-20 points)
        sentiment = contact_data.get('email_sentiment', 'neutral')
        if sentiment == 'positive':
            sentiment_score = 20
        elif sentiment == 'neutral':
            sentiment_score = 10
        else:
            sentiment_score = 0
        score += sentiment_score
        factors['sentiment'] = sentiment_score
        
        # Company size (0-15 points)
        company_size = contact_data.get('company_size', 0)
        if company_size > 500:
            company_score = 15
        elif company_size > 100:
            company_score = 10
        elif company_size > 10:
            company_score = 5
        else:
            company_score = 0
        score += company_score
        factors['company_size'] = company_score
        
        # Industry match (0-15 points)
        industry = contact_data.get('industry', '').lower()
        target_industries = ['technology', 'software', 'saas', 'finance']
        if any(target in industry for target in target_industries):
            industry_score = 15
        else:
            industry_score = 5
        score += industry_score
        factors['industry_match'] = industry_score
        
        # Determine rating
        if score >= 80:
            rating = 'hot'
        elif score >= 50:
            rating = 'warm'
        else:
            rating = 'cold'
        
        return {
            "score": min(score, 100),
            "rating": rating,
            "factors": factors
        }
    
    async def suggest_follow_up(self, contact_history: Dict[str, Any]) -> Dict[str, Any]:
        """
        Suggest follow-up actions based on contact history.
        
        Returns:
            {
                "action": str,  # email, call, meeting
                "timing": str,  # immediate, today, this_week, next_week
                "message_template": str,
                "reason": str
            }
        """
        days_since_contact = contact_history.get('days_since_last_contact', 999)
        last_email_category = contact_history.get('last_email_category', 'other')
        deal_stage = contact_history.get('deal_stage', None)
        
        # Determine action and timing
        if last_email_category == 'inquiry' and days_since_contact < 1:
            action = 'email'
            timing = 'immediate'
            reason = 'Respond to inquiry quickly to maintain engagement'
            template = 'Thank you for your inquiry. I'd be happy to help...'
        elif last_email_category == 'proposal' and days_since_contact < 3:
            action = 'call'
            timing = 'today'
            reason = 'Follow up on proposal with personal touch'
            template = 'Schedule a call to discuss the proposal in detail'
        elif deal_stage == 'negotiation' and days_since_contact > 7:
            action = 'email'
            timing = 'immediate'
            reason = 'Deal in negotiation stage needs attention'
            template = 'Checking in on our proposal. Do you have any questions?'
        elif days_since_contact > 30:
            action = 'email'
            timing = 'this_week'
            reason = 'Re-engage dormant lead'
            template = 'Just wanted to check in and see how things are going...'
        else:
            action = 'email'
            timing = 'next_week'
            reason = 'Regular follow-up'
            template = 'Hope this email finds you well...'
        
        return {
            "action": action,
            "timing": timing,
            "message_template": template,
            "reason": reason
        }


# Global classifier instance
ai_classifier = AIClassifier()


async def get_ai_classifier() -> AIClassifier:
    """Dependency for getting AI classifier."""
    return ai_classifier
