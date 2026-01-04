from typing import List, Dict

class ActionGenerator:
    def suggest_actions(self, classification: Dict[str, float], context: Dict) -> List[str]:
        """
        Suggests next best actions based on classification and context.
        """
        # Determine top intent
        intent = max(classification, key=classification.get)
        score = classification[intent]
        
        actions = []
        
        if intent == 'sales_inquiry' and score > 0.5:
            actions.append("Draft 'Schedule a Demo' email")
            actions.append("Create new Deal in CRM")
            
        elif intent == 'complaint':
            actions.append("Flag for immediate review")
            actions.append("Draft apology/follow-up email")
            
        elif intent == 'support':
             actions.append("Create Support Ticket (or link to external system)")
             
        else:
             actions.append("Mark as Read")
             
        return actions

generator = ActionGenerator()
