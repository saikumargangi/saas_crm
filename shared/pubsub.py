from google.cloud import pubsub_v1
import os
import json
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

PROJECT_ID = os.getenv("GCP_PROJECT_ID", "local-project")
TOPIC_PREFIX = os.getenv("PUBSUB_TOPIC_PREFIX", "")

class EventPublisher:
    def __init__(self):
        try:
            self.publisher = pubsub_v1.PublisherClient()
            self.enabled = True
        except Exception as e:
            logger.warning(f"PubSub not available (likely missing creds): {e}")
            self.enabled = False

    def publish_event(self, topic_name: str, data: Dict[str, Any], attributes: Dict[str, str] = None):
        if not self.enabled:
            logger.info(f"[MOCK PUBSUB] Published to {topic_name}: {json.dumps(data)}")
            return "mock-message-id"

        full_topic_path = self.publisher.topic_path(PROJECT_ID, f"{TOPIC_PREFIX}{topic_name}")
        
        data_bytes = json.dumps(data).encode("utf-8")
        
        future = self.publisher.publish(full_topic_path, data_bytes, **(attributes or {}))
        return future.result()

publisher = EventPublisher()
