"""
Complete database schema migration for CRM system.
Implements all tables from architecture document sections 4.2-4.8.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers, used by Alembic.
revision = 'complete_schema_v1'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # =========================================================================
    # Authentication Service Tables (Section 4.2)
    # =========================================================================
    
    # Users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('email', sa.String(255), unique=True, nullable=False, index=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('first_name', sa.String(100)),
        sa.Column('last_name', sa.String(100)),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('is_superuser', sa.Boolean, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    
    # OAuth tokens table
    op.create_table(
        'oauth_tokens',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('provider', sa.String(50), nullable=False),  # gmail, google_sheets, etc
        sa.Column('access_token', sa.Text, nullable=False),  # Encrypted
        sa.Column('refresh_token', sa.Text),  # Encrypted
        sa.Column('token_type', sa.String(50)),
        sa.Column('expires_at', sa.DateTime(timezone=True)),
        sa.Column('scopes', postgresql.ARRAY(sa.String)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('idx_oauth_tokens_user_provider', 'oauth_tokens', ['user_id', 'provider'])
    
    # Refresh tokens table (for JWT refresh)
    op.create_table(
        'refresh_tokens',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('token', sa.String(500), unique=True, nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('is_revoked', sa.Boolean, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('idx_refresh_tokens_user', 'refresh_tokens', ['user_id'])
    op.create_index('idx_refresh_tokens_token', 'refresh_tokens', ['token'])
    
    # Permissions table
    op.create_table(
        'permissions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('resource_type', sa.String(50), nullable=False),  # crm, email, automation
        sa.Column('resource_id', postgresql.UUID(as_uuid=True)),
        sa.Column('permission', sa.String(50), nullable=False),  # read, write, delete
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('idx_permissions_user_resource', 'permissions', ['user_id', 'resource_type'])
    
    # =========================================================================
    # CRM Service Tables (Section 4.4)
    # =========================================================================
    
    # Companies table
    op.create_table(
        'companies',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('website', sa.String(255)),
        sa.Column('industry', sa.String(100)),
        sa.Column('annual_revenue', sa.Numeric(15, 2)),
        sa.Column('employee_count', sa.Integer),
        sa.Column('description', sa.Text),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('idx_companies_user_name', 'companies', ['user_id', 'name'])
    
    # Contacts table
    op.create_table(
        'contacts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('first_name', sa.String(100)),
        sa.Column('last_name', sa.String(100)),
        sa.Column('phone', sa.String(50)),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('companies.id', ondelete='SET NULL')),
        sa.Column('lead_score', sa.Integer, default=0),
        sa.Column('lead_status', sa.String(50), default='new'),  # new, qualified, contacted, converted, lost
        sa.Column('source', sa.String(50), default='manual'),  # email, manual, import, api
        sa.Column('custom_fields', postgresql.JSONB),
        sa.Column('last_email_date', sa.DateTime(timezone=True)),
        sa.Column('last_contact_date', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('idx_contacts_user_email', 'contacts', ['user_id', 'email'])
    op.create_index('idx_contacts_user_status', 'contacts', ['user_id', 'lead_status'])
    op.create_index('idx_contacts_lead_score', 'contacts', ['lead_score'])
    
    # Deals table
    op.create_table(
        'deals',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('contact_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('contacts.id', ondelete='SET NULL')),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('companies.id', ondelete='SET NULL')),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('amount', sa.Numeric(15, 2)),
        sa.Column('currency', sa.String(3), default='USD'),
        sa.Column('stage', sa.String(50), default='prospect'),  # prospect, negotiation, committed, won, lost
        sa.Column('probability', sa.Integer),  # 0-100
        sa.Column('expected_close_date', sa.Date),
        sa.Column('actual_close_date', sa.Date),
        sa.Column('description', sa.Text),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('idx_deals_user_stage', 'deals', ['user_id', 'stage'])
    op.create_index('idx_deals_user_updated', 'deals', ['user_id', 'updated_at'])
    
    # =========================================================================
    # Email Sync Service Tables (Section 4.3)
    # =========================================================================
    
    # Emails table
    op.create_table(
        'emails',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('gmail_id', sa.String(255), unique=True),
        sa.Column('thread_id', sa.String(255)),
        sa.Column('from_address', sa.String(255), nullable=False),
        sa.Column('to_addresses', postgresql.ARRAY(sa.String)),
        sa.Column('cc_addresses', postgresql.ARRAY(sa.String)),
        sa.Column('bcc_addresses', postgresql.ARRAY(sa.String)),
        sa.Column('subject', sa.String(500)),
        sa.Column('body_text', sa.Text),
        sa.Column('body_html', sa.Text),
        sa.Column('is_read', sa.Boolean, default=False),
        sa.Column('has_attachment', sa.Boolean, default=False),
        sa.Column('gmail_labels', postgresql.ARRAY(sa.String)),
        sa.Column('classification', sa.String(50)),  # inquiry, proposal, objection, etc (from AI)
        sa.Column('classification_confidence', sa.Float),
        sa.Column('sentiment', sa.String(20)),  # positive, negative, neutral
        sa.Column('received_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('idx_emails_user_received', 'emails', ['user_id', 'received_at'])
    op.create_index('idx_emails_from_address', 'emails', ['from_address'])
    op.create_index('idx_emails_gmail_id', 'emails', ['gmail_id'])
    
    # Email attachments table
    op.create_table(
        'email_attachments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('email_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('emails.id', ondelete='CASCADE'), nullable=False),
        sa.Column('filename', sa.String(255), nullable=False),
        sa.Column('mime_type', sa.String(100)),
        sa.Column('size_bytes', sa.Integer),
        sa.Column('gcs_path', sa.String(500)),  # Cloud Storage path or local path
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('idx_email_attachments_email', 'email_attachments', ['email_id'])
    
    # Sync state table
    op.create_table(
        'sync_state',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('provider', sa.String(50), nullable=False),  # gmail
        sa.Column('last_sync_at', sa.DateTime(timezone=True)),
        sa.Column('last_history_id', sa.String(255)),  # Gmail historyId for delta sync
        sa.Column('sync_status', sa.String(50), default='active'),  # active, paused, error
        sa.Column('error_message', sa.Text),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    
    # =========================================================================
    # Activities Table (CRM Section 4.4)
    # =========================================================================
    
    op.create_table(
        'activities',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('contact_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('contacts.id', ondelete='CASCADE')),
        sa.Column('deal_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('deals.id', ondelete='CASCADE')),
        sa.Column('email_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('emails.id', ondelete='SET NULL')),
        sa.Column('type', sa.String(50), nullable=False),  # email, call, meeting, note, task
        sa.Column('subject', sa.String(255)),
        sa.Column('description', sa.Text),
        sa.Column('metadata', postgresql.JSONB),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('idx_activities_user_contact', 'activities', ['user_id', 'contact_id', 'created_at'])
    op.create_index('idx_activities_type', 'activities', ['type'])
    
    # =========================================================================
    # Automation Service Tables (Section 4.6)
    # =========================================================================
    
    # Workflows table
    op.create_table(
        'workflows',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text),
        sa.Column('trigger_type', sa.String(50), nullable=False),  # email_received, contact_updated, scheduled, manual
        sa.Column('trigger_config', postgresql.JSONB),
        sa.Column('conditions', postgresql.JSONB),  # Array of condition objects
        sa.Column('actions', postgresql.JSONB),  # Array of action objects
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('idx_workflows_user_active', 'workflows', ['user_id', 'is_active'])
    
    # Workflow executions table
    op.create_table(
        'workflow_executions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('workflow_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('workflows.id', ondelete='CASCADE'), nullable=False),
        sa.Column('trigger_event_id', sa.String(255)),
        sa.Column('status', sa.String(50), default='pending'),  # pending, running, success, failed
        sa.Column('result', postgresql.JSONB),
        sa.Column('error_message', sa.Text),
        sa.Column('executed_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('idx_workflow_executions_workflow', 'workflow_executions', ['workflow_id', 'executed_at'])
    
    # =========================================================================
    # Integration Service Tables (Section 4.8)
    # =========================================================================
    
    # Integrations table
    op.create_table(
        'integrations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('type', sa.String(50), nullable=False),  # google_sheets, slack, webhook, zapier
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('config', postgresql.JSONB),  # Integration-specific configuration
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('idx_integrations_user_type', 'integrations', ['user_id', 'type'])
    
    # Webhooks table
    op.create_table(
        'webhooks',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('integration_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('integrations.id', ondelete='CASCADE')),
        sa.Column('url', sa.String(500), nullable=False),
        sa.Column('secret', sa.String(255)),  # For webhook signature verification
        sa.Column('events', postgresql.ARRAY(sa.String)),  # contact.created, deal.updated, etc
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('idx_webhooks_user', 'webhooks', ['user_id'])


def downgrade() -> None:
    # Drop tables in reverse order (respecting foreign keys)
    op.drop_table('webhooks')
    op.drop_table('integrations')
    op.drop_table('workflow_executions')
    op.drop_table('workflows')
    op.drop_table('activities')
    op.drop_table('sync_state')
    op.drop_table('email_attachments')
    op.drop_table('emails')
    op.drop_table('deals')
    op.drop_table('contacts')
    op.drop_table('companies')
    op.drop_table('permissions')
    op.drop_table('refresh_tokens')
    op.drop_table('oauth_tokens')
    op.drop_table('users')
