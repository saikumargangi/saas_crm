from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from typing import List, Dict, Any

class SheetsClient:
    def __init__(self, token: str, refresh_token: str, client_id: str, client_secret: str):
        self.creds = Credentials(
            token=token,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=client_id,
            client_secret=client_secret,
            scopes=['https://www.googleapis.com/auth/spreadsheets']
        )
        self.service = build('sheets', 'v4', credentials=self.creds)

    def read_range(self, spreadsheet_id: str, range_name: str) -> List[List[Any]]:
        sheet = self.service.spreadsheets()
        result = sheet.values().get(spreadsheetId=spreadsheet_id, range=range_name).execute()
        return result.get('values', [])

    def write_range(self, spreadsheet_id: str, range_name: str, values: List[List[Any]]):
        body = {'values': values}
        self.service.spreadsheets().values().update(
            spreadsheetId=spreadsheet_id, range=range_name,
            valueInputOption='RAW', body=body
        ).execute()

    def append_row(self, spreadsheet_id: str, range_name: str, values: List[List[Any]]):
        body = {'values': values}
        self.service.spreadsheets().values().append(
            spreadsheetId=spreadsheet_id, range=range_name,
            valueInputOption='USER_ENTERED', body=body
        ).execute()
