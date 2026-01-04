from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from typing import List, Dict, Optional, Any
import base64

class GmailClient:
    def __init__(self, token: str, refresh_token: str, client_id: str, client_secret: str):
        self.creds = Credentials(
            token=token,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=client_id,
            client_secret=client_secret,
        )
        self.service = build('gmail', 'v1', credentials=self.creds)

    def get_profile(self) -> Dict:
        return self.service.users().getProfile(userId='me').execute()

    def list_messages(self, query: str = None, page_token: str = None, max_results: int = 100) -> Dict:
        return self.service.users().messages().list(
            userId='me', q=query, pageToken=page_token, maxResults=max_results
        ).execute()

    def list_history(self, start_history_id: str, page_token: str = None) -> Dict:
        return self.service.users().history().list(
            userId='me', startHistoryId=start_history_id, pageToken=page_token
        ).execute()

    def get_message(self, message_id: str) -> Dict:
        return self.service.users().messages().get(
            userId='me', id=message_id, format='full'
        ).execute()
    
    def get_attachment(self, message_id: str, attachment_id: str) -> Dict:
         return self.service.users().messages().attachments().get(
            userId='me', messageId=message_id, id=attachment_id
        ).execute()

    def watch(self, topic_name: str) -> Dict:
        request = {
            'labelIds': ['INBOX'],
            'topicName': topic_name,
            'labelFilterAction': 'include'
        }
        return self.service.users().watch(userId='me', body=request).execute()

    def stop_watch(self) -> Dict:
        return self.service.users().stop(userId='me').execute()
