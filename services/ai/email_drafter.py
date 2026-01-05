"""
AI Email Drafter - MVP Feature 3
Generates contextual follow-up emails using Gemini AI
"""

import os
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


class EmailDrafter:
    """AI-powered email draft generation using Gemini."""
    
    def __init__(self):
        self.api_key = os.getenv('GEMINI_API_KEY')
        
    async def draft_follow_up_email(
        self,
        contact_email: str,
        contact_name: Optional[str],
        email_history: List[Dict],
        context: str,
        tone: str = "professional"
    ) -> Dict[str, str]:
        """
        Generate a follow-up email draft based on conversation history.
        
        Args:
            contact_email: Recipient email address
            contact_name: Recipient name (if available)
            email_history: List of previous emails with this person
            context: User's context/reason for follow-up
            tone: Email tone (professional, casual, friendly)
            
        Returns:
            Dict with 'subject', 'body', 'suggested_send_time'
        """
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            model = genai.GenerativeModel('gemini-pro')
            
            # Prepare conversation context
            conversation_summary = self._summarize_conversation(email_history)
            
            # Create prompt for Gemini
            prompt = self._create_draft_prompt(
                contact_name or contact_email,
                conversation_summary,
                context,
                tone
            )
            
            # Generate draft
            response = model.generate_content(prompt)
            draft_text = response.text
            
            # Parse response into subject and body
            subject, body = self._parse_draft_response(draft_text)
            
            return {
                "subject": subject,
                "body": body,
                "suggested_send_time": "now",  # Could be enhanced with ML
                "tone": tone
            }
            
        except Exception as e:
            logger.error(f"Email draft generation failed: {e}")
            # Fallback to template-based draft
            return self._fallback_draft(contact_name or contact_email, context)
    
    def _summarize_conversation(self, email_history: List[Dict]) -> str:
        """Summarize recent email conversation."""
        if not email_history:
            return "No previous conversation history."
        
        summary_parts = []
        for email in email_history[:5]:  # Last 5 emails
            direction = email.get('direction', 'unknown')
            subject = email.get('subject', 'No subject')
            snippet = email.get('body', '')[:200]
            summary_parts.append(f"{direction.upper()}: {subject}\n{snippet}")
        
        return "\n\n".join(summary_parts)
    
    def _create_draft_prompt(
        self,
        recipient_name: str,
        conversation_summary: str,
        context: str,
        tone: str
    ) -> str:
        """Create prompt for Gemini to generate email draft."""
        
        tone_instructions = {
            "professional": "Use professional business language. Be courteous and formal.",
            "casual": "Use friendly, conversational language. Keep it light and approachable.",
            "friendly": "Use warm, personable language. Show genuine interest."
        }
        
        prompt = f"""You are a professional email writer. Generate a follow-up email based on the following information:

RECIPIENT: {recipient_name}

PREVIOUS CONVERSATION SUMMARY:
{conversation_summary}

FOLLOW-UP CONTEXT: {context}

TONE: {tone_instructions.get(tone, tone_instructions['professional'])}

Generate a complete email with:
1. A compelling subject line (start with "SUBJECT:")
2. A well-structured email body that:
   - References the previous conversation naturally
   - Addresses the follow-up context
   - Includes a clear call-to-action
   - Maintains the specified tone
   - Is concise (under 200 words)

Format your response as:
SUBJECT: [your subject line]

BODY:
[your email body]

Do not include greetings like "Dear" or signatures - just the core content."""

        return prompt
    
    def _parse_draft_response(self, draft_text: str) -> tuple:
        """Parse Gemini response into subject and body."""
        lines = draft_text.strip().split('\n')
        
        subject = ""
        body_lines = []
        in_body = False
        
        for line in lines:
            if line.startswith("SUBJECT:"):
                subject = line.replace("SUBJECT:", "").strip()
            elif line.startswith("BODY:"):
                in_body = True
            elif in_body:
                body_lines.append(line)
        
        body = "\n".join(body_lines).strip()
        
        # Fallback if parsing fails
        if not subject:
            subject = "Following up on our conversation"
        if not body:
            body = draft_text
        
        return subject, body
    
    def _fallback_draft(self, recipient_name: str, context: str) -> Dict[str, str]:
        """Fallback template-based draft if AI fails."""
        return {
            "subject": f"Following up - {context[:50]}",
            "body": f"""Hi {recipient_name},

I wanted to follow up regarding {context}.

I'd love to hear your thoughts on this.

Looking forward to your response.

Best regards""",
            "suggested_send_time": "now",
            "tone": "professional"
        }


# Global instance
email_drafter = EmailDrafter()


async def get_email_drafter() -> EmailDrafter:
    """Dependency for getting email drafter."""
    return email_drafter
