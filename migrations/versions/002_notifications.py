"""Add notification tables

Revision ID: 002_notifications
Revises: 001_complete_schema
Create Date: 2026-01-05

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '002_notifications'
down_revision = '001_complete_schema'
branch_labels = None
depends_on = None


def upgrade():
    # Create notifications table
    op.create_table(
        'notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('message', sa.String(1000), nullable=False),
        sa.Column('link', sa.String(500)),
        sa.Column('is_read', sa.Boolean(), default=False),
        sa.Column('metadata', postgresql.JSON),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('read_at', sa.DateTime(timezone=True))
    )
    
    # Create indexes
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'])
    op.create_index('ix_notifications_is_read', 'notifications', ['is_read'])
    
    # Create notification_preferences table
    op.create_table(
        'notification_preferences',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False, unique=True),
        sa.Column('email_enabled', sa.Boolean(), default=True),
        sa.Column('in_app_enabled', sa.Boolean(), default=True),
        sa.Column('webhook_enabled', sa.Boolean(), default=False),
        sa.Column('webhook_url', sa.String(500)),
        sa.Column('notify_new_email', sa.Boolean(), default=True),
        sa.Column('notify_deal_update', sa.Boolean(), default=True),
        sa.Column('notify_contact_update', sa.Boolean(), default=False),
        sa.Column('notify_workflow_complete', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now())
    )


def downgrade():
    op.drop_table('notification_preferences')
    op.drop_index('ix_notifications_is_read')
    op.drop_index('ix_notifications_user_id')
    op.drop_table('notifications')
