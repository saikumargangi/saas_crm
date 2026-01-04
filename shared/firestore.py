"""
Cloud Firestore utilities for real-time session management and NoSQL storage
"""
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
import json

logger = logging.getLogger(__name__)


class MockFirestore:
    """Mock Firestore for local development"""
    
    def __init__(self):
        self.collections = {}
    
    def collection(self, name: str):
        """Get or create a collection"""
        if name not in self.collections:
            self.collections[name] = {}
        return MockCollection(self.collections[name], name)


class MockCollection:
    """Mock Firestore collection"""
    
    def __init__(self, data: Dict, name: str):
        self.data = data
        self.name = name
    
    def document(self, doc_id: str):
        """Get a document reference"""
        return MockDocument(self.data, doc_id, self.name)
    
    async def add(self, data: Dict[str, Any]):
        """Add a new document with auto-generated ID"""
        doc_id = f"doc_{len(self.data)}"
        self.data[doc_id] = {
            **data,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        logger.debug(f"Added document to {self.name}: {doc_id}")
        return doc_id
    
    async def get(self):
        """Get all documents in collection"""
        return [
            {"id": doc_id, **doc_data}
            for doc_id, doc_data in self.data.items()
        ]
    
    def where(self, field: str, op: str, value: Any):
        """Filter documents"""
        filtered = {}
        for doc_id, doc_data in self.data.items():
            if field in doc_data:
                if op == "==" and doc_data[field] == value:
                    filtered[doc_id] = doc_data
                elif op == ">" and doc_data[field] > value:
                    filtered[doc_id] = doc_data
                elif op == "<" and doc_data[field] < value:
                    filtered[doc_id] = doc_data
        return MockCollection(filtered, self.name)


class MockDocument:
    """Mock Firestore document"""
    
    def __init__(self, collection_data: Dict, doc_id: str, collection_name: str):
        self.collection_data = collection_data
        self.doc_id = doc_id
        self.collection_name = collection_name
    
    async def set(self, data: Dict[str, Any], merge: bool = False):
        """Set document data"""
        if merge and self.doc_id in self.collection_data:
            self.collection_data[self.doc_id].update(data)
        else:
            self.collection_data[self.doc_id] = {
                **data,
                "updated_at": datetime.utcnow().isoformat()
            }
        logger.debug(f"Set document {self.collection_name}/{self.doc_id}")
    
    async def get(self):
        """Get document data"""
        if self.doc_id in self.collection_data:
            return {
                "id": self.doc_id,
                "exists": True,
                **self.collection_data[self.doc_id]
            }
        return {"id": self.doc_id, "exists": False}
    
    async def update(self, data: Dict[str, Any]):
        """Update document fields"""
        if self.doc_id in self.collection_data:
            self.collection_data[self.doc_id].update(data)
            self.collection_data[self.doc_id]["updated_at"] = datetime.utcnow().isoformat()
            logger.debug(f"Updated document {self.collection_name}/{self.doc_id}")
    
    async def delete(self):
        """Delete document"""
        if self.doc_id in self.collection_data:
            del self.collection_data[self.doc_id]
            logger.debug(f"Deleted document {self.collection_name}/{self.doc_id}")


# Global Firestore instance
_firestore = MockFirestore()


def get_firestore():
    """Get Firestore client"""
    return _firestore


# Session management
async def create_session(user_id: str, session_data: Dict[str, Any]) -> str:
    """Create a new user session"""
    sessions = _firestore.collection("sessions")
    session_id = await sessions.add({
        "user_id": user_id,
        "data": session_data,
        "created_at": datetime.utcnow().isoformat(),
        "last_activity": datetime.utcnow().isoformat(),
        "is_active": True
    })
    logger.info(f"Created session {session_id} for user {user_id}")
    return session_id


async def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    """Get session data"""
    session_doc = _firestore.collection("sessions").document(session_id)
    session = await session_doc.get()
    
    if session.get("exists"):
        return session
    return None


async def update_session(session_id: str, data: Dict[str, Any]):
    """Update session data"""
    session_doc = _firestore.collection("sessions").document(session_id)
    await session_doc.update({
        **data,
        "last_activity": datetime.utcnow().isoformat()
    })
    logger.debug(f"Updated session {session_id}")


async def delete_session(session_id: str):
    """Delete a session"""
    session_doc = _firestore.collection("sessions").document(session_id)
    await session_doc.delete()
    logger.info(f"Deleted session {session_id}")


async def get_active_sessions(user_id: str) -> List[Dict[str, Any]]:
    """Get all active sessions for a user"""
    sessions = _firestore.collection("sessions").where("user_id", "==", user_id).where("is_active", "==", True)
    return await sessions.get()


# Real-time event storage
async def store_realtime_event(event_type: str, data: Dict[str, Any], user_id: Optional[str] = None):
    """Store a real-time event"""
    events = _firestore.collection("realtime_events")
    event_id = await events.add({
        "event_type": event_type,
        "data": data,
        "user_id": user_id,
        "timestamp": datetime.utcnow().isoformat(),
        "processed": False
    })
    logger.debug(f"Stored real-time event {event_type}: {event_id}")
    return event_id


async def get_unprocessed_events(limit: int = 100) -> List[Dict[str, Any]]:
    """Get unprocessed real-time events"""
    events = _firestore.collection("realtime_events").where("processed", "==", False)
    return await events.get()


# WebSocket connection tracking
async def register_websocket_connection(user_id: str, connection_id: str):
    """Register a WebSocket connection"""
    connections = _firestore.collection("websocket_connections")
    await connections.document(connection_id).set({
        "user_id": user_id,
        "connected_at": datetime.utcnow().isoformat(),
        "is_active": True
    })
    logger.info(f"Registered WebSocket connection {connection_id} for user {user_id}")


async def unregister_websocket_connection(connection_id: str):
    """Unregister a WebSocket connection"""
    connection_doc = _firestore.collection("websocket_connections").document(connection_id)
    await connection_doc.delete()
    logger.info(f"Unregistered WebSocket connection {connection_id}")


async def get_user_connections(user_id: str) -> List[Dict[str, Any]]:
    """Get all active WebSocket connections for a user"""
    connections = _firestore.collection("websocket_connections").where("user_id", "==", user_id).where("is_active", "==", True)
    return await connections.get()
