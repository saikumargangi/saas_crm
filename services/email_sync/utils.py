from typing import Dict, Any, List
import base64
from bs4 import BeautifulSoup
from dateutil import parser as date_parser

def parse_gmail_message(raw_msg: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parses a raw Gmail API message resource into a simplified dictionary.
    """
    payload = raw_msg.get('payload', {})
    headers = payload.get('headers', [])
    
    def get_header(name: str) -> str:
        for h in headers:
            if h['name'].lower() == name.lower():
                return h['value']
        return ""

    subject = get_header('Subject')
    sender = get_header('From')
    recipient = get_header('To')
    cc = get_header('Cc')
    bcc = get_header('Bcc')
    date_str = get_header('Date')
    
    # Simple Date Parsing (could be more robust)
    try:
        received_at = date_parser.parse(date_str) if date_str else None
    except:
        received_at = None

    body_text = raw_msg.get('snippet', '')
    
    # Check for attachments
    has_attachment = False
    # logic to check attachments in parts usually requires checking filename present
    
    # Extract body content (simplistic approach for multipart)
    body_html = ""
    parts = payload.get('parts', [])
    
    # Helper to check attachment
    def check_has_attachment(parts_list):
        for part in parts_list:
            if part.get('filename') and part.get('body', {}).get('attachmentId'):
                return True
            if part.get('parts'):
                if check_has_attachment(part['parts']):
                    return True
        return False

    if check_has_attachment(parts):
        has_attachment = True

    # If no parts, payload body might have data directly (text/plain or text/html)
    if not parts and payload.get('body', {}).get('data'):
        data = payload['body']['data']
        # ... (decoding logic same as before)
        try:
            decoded = base64.urlsafe_b64decode(data).decode('utf-8')
            if payload.get('mimeType') == 'text/html':
                body_html = decoded
            else:
                body_text = decoded # override snippet if we have full text
        except:
             pass

    # Recursive part traversal (simplified)
    def find_body(parts_list):
        html = ""
        text = ""
        for part in parts_list:
            if part.get('mimeType') == 'text/html':
                data = part['body'].get('data', '')
                if data:
                    try:
                       html = base64.urlsafe_b64decode(data).decode('utf-8')
                    except: pass
            elif part.get('mimeType') == 'text/plain':
                data = part['body'].get('data', '')
                if data:
                    try:
                        text = base64.urlsafe_b64decode(data).decode('utf-8')
                    except: pass
            
            if part.get('parts'):
                h, t = find_body(part['parts'])
                if not html: html = h
                if not text: text = t
        return html, text

    if parts:
        found_html, found_text = find_body(parts)
        if found_html: body_html = found_html
        if found_text: body_text = found_text # prefer full text over snippet

    return {
        "gmail_id": raw_msg.get('id'),
        "thread_id": raw_msg.get('threadId'),
        "subject": subject,
        "from": sender,
        "to": recipient,
        "cc": cc,
        "bcc": bcc,
        "date": received_at,
        "body_text": body_text,
        "body_html": body_html,
        "snippet": raw_msg.get('snippet'),
        "labels": raw_msg.get('labelIds', []),
        "has_attachment": has_attachment
    }
