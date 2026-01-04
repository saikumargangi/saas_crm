"""
Seed database with sample data for testing.
Creates users, contacts, emails, deals, and workflows.
"""
import asyncio
import sys
import os
from datetime import datetime, timedelta
from uuid import uuid4

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext

from services.auth.models import User, OAuthToken
from services.crm.models import Contact, Company, Deal, Activity
from services.email_sync.models import Email, SyncState
from services.automation.models import Workflow

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Database URL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://crm_user:password@localhost:5432/crm_db")

# Create async engine
engine = create_async_engine(DATABASE_URL, echo=False)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def seed_users():
    """Create sample users."""
    print("Creating users...")
    
    async with async_session() as session:
        users = [
            User(
                id=uuid4(),
                email="admin@crm.local",
                password_hash=pwd_context.hash("admin123"),
                first_name="Admin",
                last_name="User",
                is_superuser=True
            ),
            User(
                id=uuid4(),
                email="john@crm.local",
                password_hash=pwd_context.hash("john123"),
                first_name="John",
                last_name="Doe"
            ),
            User(
                id=uuid4(),
                email="jane@crm.local",
                password_hash=pwd_context.hash("jane123"),
                first_name="Jane",
                last_name="Smith"
            )
        ]
        
        session.add_all(users)
        await session.commit()
        
        print(f"✅ Created {len(users)} users")
        return users


async def seed_companies(user_id):
    """Create sample companies."""
    print("Creating companies...")
    
    async with async_session() as session:
        companies = [
            Company(
                id=uuid4(),
                user_id=user_id,
                name="Acme Corporation",
                website="https://acme.com",
                industry="Technology",
                annual_revenue=5000000,
                employee_count=50
            ),
            Company(
                id=uuid4(),
                user_id=user_id,
                name="TechStart Inc",
                website="https://techstart.io",
                industry="Software",
                annual_revenue=2000000,
                employee_count=25
            ),
            Company(
                id=uuid4(),
                user_id=user_id,
                name="Global Solutions Ltd",
                website="https://globalsolutions.com",
                industry="Consulting",
                annual_revenue=10000000,
                employee_count=100
            )
        ]
        
        session.add_all(companies)
        await session.commit()
        
        print(f"✅ Created {len(companies)} companies")
        return companies


async def seed_contacts(user_id, companies):
    """Create sample contacts."""
    print("Creating contacts...")
    
    async with async_session() as session:
        contacts = [
            Contact(
                id=uuid4(),
                user_id=user_id,
                email="sarah.johnson@acme.com",
                first_name="Sarah",
                last_name="Johnson",
                phone="+1-555-0101",
                company_id=companies[0].id,
                lead_score=85,
                lead_status="qualified",
                source="email"
            ),
            Contact(
                id=uuid4(),
                user_id=user_id,
                email="mike.chen@techstart.io",
                first_name="Mike",
                last_name="Chen",
                phone="+1-555-0102",
                company_id=companies[1].id,
                lead_score=70,
                lead_status="contacted",
                source="manual"
            ),
            Contact(
                id=uuid4(),
                user_id=user_id,
                email="lisa.martinez@globalsolutions.com",
                first_name="Lisa",
                last_name="Martinez",
                phone="+1-555-0103",
                company_id=companies[2].id,
                lead_score=95,
                lead_status="converted",
                source="email"
            ),
            Contact(
                id=uuid4(),
                user_id=user_id,
                email="david.kim@example.com",
                first_name="David",
                last_name="Kim",
                phone="+1-555-0104",
                lead_score=50,
                lead_status="new",
                source="import"
            ),
            Contact(
                id=uuid4(),
                user_id=user_id,
                email="emma.wilson@example.com",
                first_name="Emma",
                last_name="Wilson",
                phone="+1-555-0105",
                lead_score=60,
                lead_status="qualified",
                source="api"
            )
        ]
        
        session.add_all(contacts)
        await session.commit()
        
        print(f"✅ Created {len(contacts)} contacts")
        return contacts


async def seed_emails(user_id, contacts):
    """Create sample emails."""
    print("Creating emails...")
    
    async with async_session() as session:
        now = datetime.utcnow()
        emails = [
            Email(
                id=uuid4(),
                user_id=user_id,
                gmail_id=f"gmail_{uuid4().hex[:16]}",
                from_address=contacts[0].email,
                to_addresses=[user_id],
                subject="Product Inquiry - Enterprise Plan",
                body_text="Hi, I'm interested in your enterprise plan. Can we schedule a demo?",
                is_read=False,
                classification="inquiry",
                classification_confidence=0.92,
                sentiment="positive",
                received_at=now - timedelta(hours=2)
            ),
            Email(
                id=uuid4(),
                user_id=user_id,
                gmail_id=f"gmail_{uuid4().hex[:16]}",
                from_address=contacts[1].email,
                to_addresses=[user_id],
                subject="Re: Proposal Discussion",
                body_text="Thanks for the proposal. We have a few questions about pricing.",
                is_read=True,
                classification="proposal",
                classification_confidence=0.88,
                sentiment="neutral",
                received_at=now - timedelta(days=1)
            ),
            Email(
                id=uuid4(),
                user_id=user_id,
                gmail_id=f"gmail_{uuid4().hex[:16]}",
                from_address=contacts[2].email,
                to_addresses=[user_id],
                subject="Contract Signed!",
                body_text="Great news! We've signed the contract and are ready to proceed.",
                is_read=True,
                classification="confirmation",
                classification_confidence=0.95,
                sentiment="positive",
                received_at=now - timedelta(days=3)
            )
        ]
        
        session.add_all(emails)
        await session.commit()
        
        print(f"✅ Created {len(emails)} emails")
        return emails


async def seed_deals(user_id, contacts, companies):
    """Create sample deals."""
    print("Creating deals...")
    
    async with async_session() as session:
        deals = [
            Deal(
                id=uuid4(),
                user_id=user_id,
                contact_id=contacts[0].id,
                company_id=companies[0].id,
                title="Enterprise Plan - Acme Corp",
                amount=50000,
                currency="USD",
                stage="negotiation",
                probability=75,
                expected_close_date=datetime.utcnow().date() + timedelta(days=30)
            ),
            Deal(
                id=uuid4(),
                user_id=user_id,
                contact_id=contacts[1].id,
                company_id=companies[1].id,
                title="Professional Plan - TechStart",
                amount=25000,
                currency="USD",
                stage="prospect",
                probability=50,
                expected_close_date=datetime.utcnow().date() + timedelta(days=60)
            ),
            Deal(
                id=uuid4(),
                user_id=user_id,
                contact_id=contacts[2].id,
                company_id=companies[2].id,
                title="Enterprise Suite - Global Solutions",
                amount=100000,
                currency="USD",
                stage="won",
                probability=100,
                actual_close_date=datetime.utcnow().date() - timedelta(days=5)
            )
        ]
        
        session.add_all(deals)
        await session.commit()
        
        print(f"✅ Created {len(deals)} deals")
        return deals


async def seed_workflows(user_id):
    """Create sample workflows."""
    print("Creating workflows...")
    
    async with async_session() as session:
        workflows = [
            Workflow(
                id=uuid4(),
                user_id=user_id,
                name="Auto-classify new emails",
                description="Automatically classify incoming emails using AI",
                trigger_type="email_received",
                trigger_config={"provider": "gmail"},
                conditions=[
                    {"field": "from_address", "operator": "not_empty"}
                ],
                actions=[
                    {"type": "classify_email", "ai_model": "default"},
                    {"type": "update_lead_score", "based_on": "classification"}
                ],
                is_active=True
            ),
            Workflow(
                id=uuid4(),
                user_id=user_id,
                name="High-value lead notification",
                description="Send notification when lead score exceeds 80",
                trigger_type="contact_updated",
                trigger_config={},
                conditions=[
                    {"field": "lead_score", "operator": "greater_than", "value": 80}
                ],
                actions=[
                    {"type": "send_notification", "channel": "email", "template": "high_value_lead"}
                ],
                is_active=True
            )
        ]
        
        session.add_all(workflows)
        await session.commit()
        
        print(f"✅ Created {len(workflows)} workflows")
        return workflows


async def main():
    """Run all seed functions."""
    print("\n🌱 Seeding database with sample data...\n")
    
    try:
        # Create users
        users = await seed_users()
        user_id = users[0].id  # Use first user for all data
        
        # Create companies
        companies = await seed_companies(user_id)
        
        # Create contacts
        contacts = await seed_contacts(user_id, companies)
        
        # Create emails
        emails = await seed_emails(user_id, contacts)
        
        # Create deals
        deals = await seed_deals(user_id, contacts, companies)
        
        # Create workflows
        workflows = await seed_workflows(user_id)
        
        print("\n✅ Database seeded successfully!\n")
        print("Sample credentials:")
        print("  Email: admin@crm.local")
        print("  Password: admin123")
        print("\n  Email: john@crm.local")
        print("  Password: john123")
        print("\n  Email: jane@crm.local")
        print("  Password: jane123")
        
    except Exception as e:
        print(f"\n❌ Error seeding database: {e}")
        raise
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
