"""
Elasticsearch client and indexing utilities for CRM system.
Implements search functionality from architecture Section 5.2.
"""
import os
from typing import List, Dict, Any, Optional
from elasticsearch import AsyncElasticsearch, NotFoundError
import logging

logger = logging.getLogger(__name__)


class SearchClient:
    """Elasticsearch client for CRM search functionality."""
    
    def __init__(self):
        self.es_url = os.getenv('ELASTICSEARCH_URL', 'http://localhost:9200')
        self.client: Optional[AsyncElasticsearch] = None
    
    async def connect(self):
        """Initialize Elasticsearch connection."""
        if not self.client:
            self.client = AsyncElasticsearch([self.es_url])
            logger.info(f"Connected to Elasticsearch at {self.es_url}")
    
    async def close(self):
        """Close Elasticsearch connection."""
        if self.client:
            await self.client.close()
            self.client = None
    
    async def create_indices(self):
        """Create all required indices with mappings."""
        await self.connect()
        
        # Contacts index
        contacts_mapping = {
            "mappings": {
                "properties": {
                    "id": {"type": "keyword"},
                    "user_id": {"type": "keyword"},
                    "email": {"type": "keyword"},
                    "first_name": {"type": "text", "analyzer": "standard"},
                    "last_name": {"type": "text", "analyzer": "standard"},
                    "full_name": {"type": "text", "analyzer": "standard"},
                    "phone": {"type": "keyword"},
                    "company_name": {"type": "text", "analyzer": "standard"},
                    "lead_score": {"type": "integer"},
                    "lead_status": {"type": "keyword"},
                    "custom_fields": {"type": "object", "enabled": False},
                    "created_at": {"type": "date"},
                    "updated_at": {"type": "date"}
                }
            }
        }
        
        # Emails index
        emails_mapping = {
            "mappings": {
                "properties": {
                    "id": {"type": "keyword"},
                    "user_id": {"type": "keyword"},
                    "gmail_id": {"type": "keyword"},
                    "from_address": {"type": "keyword"},
                    "to_addresses": {"type": "keyword"},
                    "subject": {"type": "text", "analyzer": "standard"},
                    "body_text": {"type": "text", "analyzer": "standard"},
                    "classification": {"type": "keyword"},
                    "sentiment": {"type": "keyword"},
                    "received_at": {"type": "date"},
                    "created_at": {"type": "date"}
                }
            }
        }
        
        # Deals index
        deals_mapping = {
            "mappings": {
                "properties": {
                    "id": {"type": "keyword"},
                    "user_id": {"type": "keyword"},
                    "title": {"type": "text", "analyzer": "standard"},
                    "amount": {"type": "float"},
                    "stage": {"type": "keyword"},
                    "contact_name": {"type": "text", "analyzer": "standard"},
                    "company_name": {"type": "text", "analyzer": "standard"},
                    "description": {"type": "text", "analyzer": "standard"},
                    "created_at": {"type": "date"},
                    "updated_at": {"type": "date"}
                }
            }
        }
        
        # Create indices
        for index_name, mapping in [
            ("contacts", contacts_mapping),
            ("emails", emails_mapping),
            ("deals", deals_mapping)
        ]:
            try:
                exists = await self.client.indices.exists(index=index_name)
                if not exists:
                    await self.client.indices.create(index=index_name, body=mapping)
                    logger.info(f"Created index: {index_name}")
                else:
                    logger.info(f"Index already exists: {index_name}")
            except Exception as e:
                logger.error(f"Error creating index {index_name}: {e}")
    
    async def index_contact(self, contact_data: Dict[str, Any]):
        """Index a contact document."""
        await self.connect()
        
        doc = {
            "id": str(contact_data["id"]),
            "user_id": str(contact_data["user_id"]),
            "email": contact_data.get("email"),
            "first_name": contact_data.get("first_name"),
            "last_name": contact_data.get("last_name"),
            "full_name": f"{contact_data.get('first_name', '')} {contact_data.get('last_name', '')}".strip(),
            "phone": contact_data.get("phone"),
            "company_name": contact_data.get("company_name"),
            "lead_score": contact_data.get("lead_score", 0),
            "lead_status": contact_data.get("lead_status"),
            "custom_fields": contact_data.get("custom_fields"),
            "created_at": contact_data.get("created_at"),
            "updated_at": contact_data.get("updated_at")
        }
        
        await self.client.index(
            index="contacts",
            id=str(contact_data["id"]),
            document=doc
        )
        logger.debug(f"Indexed contact: {contact_data['id']}")
    
    async def index_email(self, email_data: Dict[str, Any]):
        """Index an email document."""
        await self.connect()
        
        doc = {
            "id": str(email_data["id"]),
            "user_id": str(email_data["user_id"]),
            "gmail_id": email_data.get("gmail_id"),
            "from_address": email_data.get("from_address"),
            "to_addresses": email_data.get("to_addresses", []),
            "subject": email_data.get("subject"),
            "body_text": email_data.get("body_text"),
            "classification": email_data.get("classification"),
            "sentiment": email_data.get("sentiment"),
            "received_at": email_data.get("received_at"),
            "created_at": email_data.get("created_at")
        }
        
        await self.client.index(
            index="emails",
            id=str(email_data["id"]),
            document=doc
        )
        logger.debug(f"Indexed email: {email_data['id']}")
    
    async def index_deal(self, deal_data: Dict[str, Any]):
        """Index a deal document."""
        await self.connect()
        
        doc = {
            "id": str(deal_data["id"]),
            "user_id": str(deal_data["user_id"]),
            "title": deal_data.get("title"),
            "amount": float(deal_data.get("amount", 0)),
            "stage": deal_data.get("stage"),
            "contact_name": deal_data.get("contact_name"),
            "company_name": deal_data.get("company_name"),
            "description": deal_data.get("description"),
            "created_at": deal_data.get("created_at"),
            "updated_at": deal_data.get("updated_at")
        }
        
        await self.client.index(
            index="deals",
            id=str(deal_data["id"]),
            document=doc
        )
        logger.debug(f"Indexed deal: {deal_data['id']}")
    
    async def search(
        self,
        query: str,
        index: str = "contacts,emails,deals",
        user_id: Optional[str] = None,
        size: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Search across indices.
        
        Args:
            query: Search query string
            index: Comma-separated index names
            user_id: Filter by user ID
            size: Maximum results to return
        
        Returns:
            List of search results
        """
        await self.connect()
        
        # Build query
        must_clauses = [
            {
                "multi_match": {
                    "query": query,
                    "fields": ["*"],
                    "type": "best_fields",
                    "fuzziness": "AUTO"
                }
            }
        ]
        
        if user_id:
            must_clauses.append({
                "term": {"user_id": user_id}
            })
        
        search_body = {
            "query": {
                "bool": {
                    "must": must_clauses
                }
            },
            "size": size,
            "sort": [
                {"_score": {"order": "desc"}},
                {"updated_at": {"order": "desc"}}
            ]
        }
        
        try:
            response = await self.client.search(
                index=index,
                body=search_body
            )
            
            results = []
            for hit in response["hits"]["hits"]:
                result = hit["_source"]
                result["_index"] = hit["_index"]
                result["_score"] = hit["_score"]
                results.append(result)
            
            return results
        except NotFoundError:
            logger.warning(f"Index not found: {index}")
            return []
        except Exception as e:
            logger.error(f"Search error: {e}")
            return []
    
    async def delete_document(self, index: str, doc_id: str):
        """Delete a document from index."""
        await self.connect()
        
        try:
            await self.client.delete(index=index, id=doc_id)
            logger.debug(f"Deleted document {doc_id} from {index}")
        except NotFoundError:
            logger.warning(f"Document not found: {doc_id} in {index}")
        except Exception as e:
            logger.error(f"Error deleting document: {e}")


# Global search client instance
search_client = SearchClient()


async def get_search_client() -> SearchClient:
    """Dependency for getting search client."""
    await search_client.connect()
    return search_client
