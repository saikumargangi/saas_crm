from typing import Dict, List

class EmailClassifier:
    def classify(self, subject: str, body: str) -> Dict[str, float]:
        """
        Classifies incoming email intent.
        Returns probabilities for: [sales_inquiry, support, complaint, other]
        Simple keyword matching for MVP.
        """
        text = (subject + " " + body).lower()
        
        scores = {
            "sales_inquiry": 0.0,
            "support": 0.0,
            "complaint": 0.0,
            "other": 0.1
        }
        
        # Keywords
        sales_kw = ['price', 'quote', 'demo', 'purchase', 'buy', 'cost', 'service']
        support_kw = ['help', 'issue', 'problem', 'bug', 'error', 'fail', 'login']
        complaint_kw = ['refund', 'cancel', 'angry', 'waiting', 'disappointed']
        
        for w in sales_kw:
            if w in text: scores['sales_inquiry'] += 0.2
            
        for w in support_kw:
            if w in text: scores['support'] += 0.2
            
        for w in complaint_kw:
            if w in text: scores['complaint'] += 0.3
            
        # Normalize (Softmax-ish)
        total = sum(scores.values())
        if total > 0:
            for k in scores:
                scores[k] /= total
        else:
            return {"other": 1.0}
            
        return scores

classifier = EmailClassifier()
