from typing import Dict, Any

class LeadScoringEngine:
    def evaluate(self, contact_data: Dict[str, Any], activities: list) -> int:
        """
        Calculates a lead score (0-100) based on profile data and engagement.
        Heuristic approach for MVP.
        """
        score = 0
        
        # 1. Profile Completeness (+20 max)
        if contact_data.get('email'): score += 5
        if contact_data.get('phone'): score += 5
        if contact_data.get('title'): score += 5
        if contact_data.get('company_name'): score += 5
        
        # 2. Company Size/Revenue (Ideal Customer Profile) (+20 max)
        revenue = contact_data.get('company_revenue', 0)
        employees = contact_data.get('employee_count', 0)
        
        if revenue > 1_000_000: score += 10
        elif revenue > 100_000: score += 5
        
        if employees > 50: score += 10
        elif employees > 10: score += 5
        
        # 3. Engagement (Activities) (+60 max)
        # Weights: Email Open (1), Click (3), Reply (10), Meeting (20)
        
        for act in activities:
            type_ = act.get('type')
            if type_ == 'email_open': score += 1
            elif type_ == 'email_click': score += 3
            elif type_ == 'email_reply': score += 10
            elif type_ == 'meeting': score += 20
            elif type_ == 'call': score += 5
            
        return min(score, 100)

scorer = LeadScoringEngine()
