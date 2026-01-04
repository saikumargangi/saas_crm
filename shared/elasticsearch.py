"""
Elasticsearch indexing utilities for full-text search
"""
from elasticsearch import AsyncElasticsearch
from typing import List, Dict, Any, Optional
import logging
import os

logger = logging.getLogger(__name__)

# Elasticsearch client
es_client = None


async def get_elasticsearch():
    """Get Elasticsearch client"""
    global es_client
    if es_client is None:
        es_url = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")
        es_client = AsyncElasticsearch([es_url])
    return es_client


async def create_indices():
    """Create Elasticsearch indices for contacts, emails, and deals"""
    es = await get_elasticsearch()
    
    # Contacts index
    contacts_mapping = {
        "mappings": {
            "properties": {
                "id": {"type": "keyword"},
                "user_id": {"type": "keyword"},
                "email": {"type": "keyword"},
                "first_name": {"type": "text"},
                "last_name": {"type": "text"},
                "full_name": {"type": "text"},
                "company_name": {"type": "text"},
                "phone": {"type": "keyword"},
                "lead_status": {"type": "keyword"},
                "lead_score": {"type": "integer"},
                "source": {"type": "keyword"},
                "created_at": {"type": "date"}
            }
        }
    }
    
    # Emails index
    emails_mapping = {
        "mappings": {
            "properties": {
                "id": {"type": "keyword"},
                "user_id": {"type": "keyword"},
                "from_address": {"type": "keyword"},
                "to_addresses": {"type": "keyword"},
                "subject": {"type": "text"},
                "body_text": {"type": "text"},
                "body_html": {"type": "text"},
                "classification": {"type": "keyword"},
                "sentiment": {"type": "keyword"},
                "received_at": {"type": "date"}
            }
        }
    }
    
    # Deals index
    deals_mapping = {
        "mappings": {
            "properties": {
                "id": {"type": "keyword"},
                "user_id": {"type": "keyword"},
                "title": {"type": "text"},
                "amount": {"type": "float"},
                "stage": {"type": "keyword"},
                "contact_name": {"type": "text"},
                "company_name": {"type": "text"},
                "created_at": {"type": "date"}
            }
        }
    }
    
    # Create indices if they don't exist
    for index_name, mapping in [
        ("contacts", contacts_mapping),
        ("emails", emails_mapping),
        ("deals", deals_mapping)
    ]:
        try:
            if not await es.indices.exists(index=index_name):
                await es.indices.create(index=index_name, body=mapping)
                logger.info(f"Created Elasticsearch index: {index_name}")
        except Exception as e:
            logger.error(f"Error creating index {index_name}: {e}")


async def index_contact(contact: Dict[str, Any]):
    """Index a contact in Elasticsearch"""
    es = await get_elasticsearch()
    
    try:
        doc = {
            "id": str(contact["id"]),
            "user_id": str(contact["user_id"]),
            "email": contact.get("email"),
            "first_name": contact.get("first_name"),
            "last_name": contact.get("last_name"),
            "full_name": f"{contact.get('first_name', '')} {contact.get('last_name', '')}".strip(),
            "company_name": contact.get("company_name"),
            "phone": contact.get("phone"),
            "lead_status": contact.get("lead_status"),
            "lead_score": contact.get("lead_score", 0),
            "source": contact.get("source"),
            "created_at": contact.get("created_at")
        }
        
        await es.index(index="contacts", id=str(contact["id"]), document=doc)
        logger.debug(f"Indexed contact: {contact['id']}")
    except Exception as e:
        logger.error(f"Error indexing contact: {e}")


async def index_email(email: Dict[str, Any]):
    """Index an email in Elasticsearch"""
    es = await get_elasticsearch()
    
    try:
        doc = {
            "id": str(email["id"]),
            "user_id": str(email["user_id"]),
            "from_address": email.get("from_address"),
            "to_addresses": email.get("to_addresses", []),
            "subject": email.get("subject"),
            "body_text": email.get("body_text"),
            "body_html": email.get("body_html"),
            "classification": email.get("classification"),
            "sentiment": email.get("sentiment"),
            "received_at": email.get("received_at")
        }
        
        await es.index(index="emails", id=str(email["id"]), document=doc)
        logger.debug(f"Indexed email: {email['id']}")
    except Exception as e:
        logger.error(f"Error indexing email: {e}")


async def index_deal(deal: Dict[str, Any]):
    """Index a deal in Elasticsearch"""
    es = await get_elasticsearch()
    
    try:
        doc = {
            "id": str(deal["id"]),
            "user_id": str(deal["user_id"]),
            "title": deal.get("title"),
            "amount": deal.get("amount"),
            "stage": deal.get("stage"),
            "contact_name": deal.get("contact_name"),
            "company_name": deal.get("company_name"),
            "created_at": deal.get("created_at")
        }
        
        await es.index(index="deals", id=str(deal["id"]), document=doc)
        logger.debug(f"Indexed deal: {deal['id']}")
    except Exception as e:
        logger.error(f"Error indexing deal: {e}")


async def search(
    query: str,
    user_id: str,
    index: Optional[str] = None,
    limit: int = 20
) -> List[Dict[str, Any]]:
    """
    Search across contacts, emails, and deals
    
    Args:
        query: Search query string
        user_id: User ID to filter results
        index: Optional specific index to search (contacts, emails, deals)
        limit: Maximum number of results
    
    Returns:
        List of search results
    """
    es = await get_elasticsearch()
    
    # Determine which indices to search
    indices = [index] if index else ["contacts", "emails", "deals"]
    
    # Build search query
    search_body = {
        "query": {
            "bool": {
                "must": [
                    {
                        "multi_match": {
                            "query": query,
                            "fields": ["*"],
                            "fuzziness": "AUTO"
                        }
                    },
                    {
                        "term": {"user_id": user_id}
                    }
                ]
            }
        },
        "size": limit,
        "sort": [
            {"_score": {"order": "desc"}}
        ]
    }
    
    try:
        response = await es.search(index=",".join(indices), body=search_body)
        
        results = []
        for hit in response["hits"]["hits"]:
            result = hit["_source"]
            result["_index"] = hit["_index"]
            result["_score"] = hit["_score"]
            results.append(result)
        
        return results
    except Exception as e:
        logger.error(f"Search error: {e}")
        return []


async def delete_document(index: str, doc_id: str):
    """Delete a document from Elasticsearch"""
    es = await get_elasticsearch()
    
    try:
        await es.delete(index=index, id=doc_id)
        logger.debug(f"Deleted document {doc_id} from {index}")
    except Exception as e:
        logger.error(f"Error deleting document: {e}")
