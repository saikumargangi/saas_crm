from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from services.email_sync import models, gmail_client
from shared.database import get_db
from shared.pubsub import publisher
from services.email_sync import utils  # Local utils for parsing
import datetime
import logging
import os
import base64
from typing import List, Dict

logger = logging.getLogger(__name__)

class SyncManager:
    def __init__(self, db: AsyncSession, client: gmail_client.GmailClient, user_id: str):
        self.db = db
        self.client = client
        self.user_id = user_id

    async def initial_sync(self, max_results=20):
        """Fetches the latest emails to bootstrap the account"""
        
        # 1. Update state
        await self._update_sync_state(status="active")
        
        try:
            # 2. Fetch messages
            response = self.client.list_messages(max_results=max_results)
            messages = response.get('messages', [])
            
            # 3. Process each message
            for msg_meta in messages:
                await self.process_message(msg_meta['id'])
                
            # 4. Update history ID
            # Ideally we get the latest history ID from the profile or the last message
            profile = self.client.get_profile()
            history_id = profile.get('historyId')
            await self._update_sync_state(status="active", history_id=history_id)
            
        except Exception as e:
            logger.error(f"Sync failed for user {self.user_id}: {e}")
            await self._update_sync_state(status="error", error=str(e))
            raise e

    async def delta_sync(self, start_history_id: str):
        """Fetches storage changes since start_history_id"""
        try:
            response = self.client.list_history(start_history_id=start_history_id)
            history = response.get('history', [])
            
            for record in history:
                # Handle messagesAdded
                if 'messagesAdded' in record:
                    for item in record['messagesAdded']:
                        await self.process_message(item['message']['id'])
                
                # We could also handle labelsRemoved, labelsAdded etc.
            
            # Update history ID to the new one provided in response (or calculate max)
            # For simplicity, getting profile's current historyId is safest
            profile = self.client.get_profile()
            new_history_id = profile.get('historyId')
            await self._update_sync_state(status="active", history_id=new_history_id)
            
        except Exception as e:
            # History ID might be too old (404/400), trigger full sync
            logger.error(f"Delta sync failed: {e}")
            await self.initial_sync(max_results=50)

    async def process_message(self, message_id: str):
        """Fetches full message, parses it, and saves to DB"""
        
        # Check if exists
        result = await self.db.execute(select(models.Email).where(models.Email.gmail_id == message_id))
        if result.scalars().first():
            return # Already processed

        raw_msg = self.client.get_message(message_id)
        
        # Parse content (Helper function needed)
        parsed = utils.parse_gmail_message(raw_msg)
        
        email_db = models.Email(
            user_id=self.user_id,
            gmail_id=message_id,
            thread_id=raw_msg.get('threadId'),
            from_address=parsed['from'],
            to_addresses=parsed['to'],
            cc_addresses=parsed['cc'],
            bcc_addresses=parsed['bcc'],
            subject=parsed['subject'],
            body_text=parsed['body_text'],
            body_html=parsed['body_html'],
            snippet=raw_msg.get('snippet'),
            received_at=parsed['date'],
            gmail_labels=raw_msg.get('labelIds', []),
            has_attachment=parsed['has_attachment']
        )
        
        self.db.add(email_db)
        await self.db.commit()
        await self.db.refresh(email_db)
        
        # Handle Attachments
        if parsed['has_attachment']:
             await self._process_attachments(email_db.id, raw_msg)
        
        # Publish Event
        publisher.publish_event("email.received", {
            "email_id": str(email_db.id),
            "user_id": str(self.user_id),
            "gmail_id": message_id,
            "subject": parsed['subject']
        })
        
        return email_db

    async def _process_attachments(self, email_id: str, raw_msg: Dict):
        """Finds attachment parts, downloads them, uploads to GCS, and saves metadata"""
        try:
            parts = raw_msg.get('payload', {}).get('parts', [])
            
            def find_attachments(parts):
                found = []
                for part in parts:
                    if part.get('filename') and part.get('body', {}).get('attachmentId'):
                        found.append(part)
                    if 'parts' in part:
                        found.extend(find_attachments(part['parts']))
                return found
            
            attachments = find_attachments(parts)
            
            from google.cloud import storage
            # GCS Client (should ideally be shared/injected)
            try:
                storage_client = storage.Client()
                bucket_name = os.getenv("GCS_BUCKET_NAME", "crm-email-attachments")
                bucket = storage_client.bucket(bucket_name)
            except Exception as e:
                logger.warning(f"GCS init failed (attachments skipped): {e}")
                return

            for att_part in attachments:
                att_id = att_part['body']['attachmentId']
                filename = att_part['filename']
                mime_type = att_part['mimeType']
                
                # 1. Download from Gmail
                # (Gmail Client needs method for this)
                att_data = self.client.get_attachment(raw_msg['id'], att_id)
                data_b64 = att_data.get('data', '')
                file_data = base64.urlsafe_b64decode(data_b64)
                
                # 2. Upload to GCS
                blob_name = f"user_{self.user_id}/{email_id}/{filename}"
                blob = bucket.blob(blob_name)
                blob.upload_from_string(file_data, content_type=mime_type)
                
                # 3. Save to DB
                db_att = models.EmailAttachment(
                    email_id=email_id,
                    filename=filename,
                    mime_type=mime_type,
                    size_bytes=len(file_data),
                    gcs_path=f"gs://{bucket_name}/{blob_name}"
                )
                self.db.add(db_att)
            
            await self.db.commit()
            
        except Exception as e:
            logger.error(f"Failed to process attachments for email {email_id}: {e}")
            # Don't fail the whole sync, just log error


    async def _update_sync_state(self, status: str, history_id: str = None, error: str = None):
        stmt = select(models.SyncState).where(models.SyncState.user_id == self.user_id)
        result = await self.db.execute(stmt)
        state = result.scalars().first()
        
        if not state:
            state = models.SyncState(user_id=self.user_id)
            self.db.add(state)
        
        state.sync_status = status
        state.last_sync_at = datetime.datetime.utcnow()
        if history_id:
            state.last_history_id = history_id
        if error:
            state.error_message = error
            
        await self.db.commit()
