"""initial_complete_schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-08-30 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Users
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False, server_default='developer'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('avatar_url', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # 2. Projects
    op.create_table(
        'projects',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('key', sa.String(length=20), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('github_repo_url', sa.String(length=500), nullable=True),
        sa.Column('created_by', sa.String(length=36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(op.f('ix_projects_key'), 'projects', ['key'], unique=True)

    # 3. Project Members
    op.create_table(
        'project_members',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('project_id', sa.String(length=36), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False, server_default='developer'),
        sa.Column('joined_at', sa.DateTime(timezone=True), nullable=False),
    )

    # 4. Repositories
    op.create_table(
        'repositories',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('project_id', sa.String(length=36), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('url', sa.String(length=500), nullable=False),
        sa.Column('default_branch', sa.String(length=100), nullable=False, server_default='main'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    # 5. Sprints
    op.create_table(
        'sprints',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('project_id', sa.String(length=36), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('goal', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='active'),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('end_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

    # 6. Labels
    op.create_table(
        'labels',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('color', sa.String(length=20), nullable=False, server_default='#6366f1'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(op.f('ix_labels_name'), 'labels', ['name'], unique=True)

    # 7. Issues
    op.create_table(
        'issues',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('project_id', sa.String(length=36), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('sprint_id', sa.String(length=36), sa.ForeignKey('sprints.id', ondelete='SET NULL'), nullable=True),
        sa.Column('reporter_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('assignee_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('issue_number', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='open'),
        sa.Column('severity', sa.String(length=50), nullable=False, server_default='medium'),
        sa.Column('priority', sa.String(length=50), nullable=False, server_default='medium'),
        sa.Column('component', sa.String(length=100), nullable=True, server_default='General'),
        sa.Column('source', sa.String(length=50), nullable=False, server_default='manual'),
        sa.Column('github_issue_url', sa.String(length=500), nullable=True),
        sa.Column('ai_summary', sa.Text(), nullable=True),
        sa.Column('scan_finding_id', sa.String(length=36), nullable=True),
        sa.Column('reproduction_steps', sa.Text(), nullable=True),
        sa.Column('suggested_fix', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint('project_id', 'issue_number', name='uq_project_issue_number'),
    )
    op.create_index(op.f('ix_issues_project_id'), 'issues', ['project_id'], unique=False)
    op.create_index(op.f('ix_issues_assignee_id'), 'issues', ['assignee_id'], unique=False)
    op.create_index(op.f('ix_issues_issue_number'), 'issues', ['issue_number'], unique=False)
    op.create_index(op.f('ix_issues_status'), 'issues', ['status'], unique=False)
    op.create_index(op.f('ix_issues_severity'), 'issues', ['severity'], unique=False)
    op.create_index(op.f('ix_issues_priority'), 'issues', ['priority'], unique=False)

    # 8. Issue Labels Join Table
    op.create_table(
        'issue_labels',
        sa.Column('issue_id', sa.String(length=36), sa.ForeignKey('issues.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('label_id', sa.String(length=36), sa.ForeignKey('labels.id', ondelete='CASCADE'), primary_key=True),
    )

    # 9. Comments
    op.create_table(
        'comments',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('issue_id', sa.String(length=36), sa.ForeignKey('issues.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('is_ai_generated', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(op.f('ix_comments_issue_id'), 'comments', ['issue_id'], unique=False)

    # 10. Audit Logs
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('issue_id', sa.String(length=36), sa.ForeignKey('issues.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('field_changed', sa.String(length=100), nullable=False),
        sa.Column('old_value', sa.Text(), nullable=True),
        sa.Column('new_value', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(op.f('ix_audit_logs_issue_id'), 'audit_logs', ['issue_id'], unique=False)

    # 11. Scans
    op.create_table(
        'scans',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('project_id', sa.String(length=36), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('initiated_by', sa.String(length=36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('scan_type', sa.String(length=50), nullable=False, server_default='repository'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='completed'),
        sa.Column('target_url', sa.String(length=500), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('summary', sa.JSON(), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(op.f('ix_scans_project_id'), 'scans', ['project_id'], unique=False)

    # 12. Security Findings
    op.create_table(
        'security_findings',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('scan_id', sa.String(length=36), sa.ForeignKey('scans.id', ondelete='CASCADE'), nullable=False),
        sa.Column('tool', sa.String(length=100), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('file_path', sa.String(length=500), nullable=True),
        sa.Column('line_number', sa.Integer(), nullable=True),
        sa.Column('code_snippet', sa.Text(), nullable=True),
        sa.Column('severity', sa.String(length=50), nullable=False, server_default='medium'),
        sa.Column('confidence', sa.String(length=50), nullable=False, server_default='high'),
        sa.Column('ai_analysis', sa.Text(), nullable=True),
        sa.Column('ai_suggested_fix', sa.Text(), nullable=True),
        sa.Column('evidence', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='pending'),
        sa.Column('created_issue_id', sa.String(length=36), sa.ForeignKey('issues.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(op.f('ix_security_findings_scan_id'), 'security_findings', ['scan_id'], unique=False)

    # 13. AI Analyses
    op.create_table(
        'ai_analyses',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('issue_id', sa.String(length=36), sa.ForeignKey('issues.id', ondelete='CASCADE'), nullable=True),
        sa.Column('prompt', sa.Text(), nullable=False),
        sa.Column('response_payload', sa.JSON(), nullable=False),
        sa.Column('model_version', sa.String(length=100), nullable=False, server_default='fixora-ai-v1'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(op.f('ix_ai_analyses_issue_id'), 'ai_analyses', ['issue_id'], unique=False)

    # 14. Notifications
    op.create_table(
        'notifications',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False, server_default='info'),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('link', sa.String(length=255), nullable=True),
        sa.Column('read', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(op.f('ix_notifications_user_id'), 'notifications', ['user_id'], unique=False)
    op.create_index(op.f('ix_notifications_read'), 'notifications', ['read'], unique=False)


def downgrade() -> None:
    op.drop_table('notifications')
    op.drop_table('ai_analyses')
    op.drop_table('security_findings')
    op.drop_table('scans')
    op.drop_table('audit_logs')
    op.drop_table('comments')
    op.drop_table('issue_labels')
    op.drop_table('issues')
    op.drop_table('labels')
    op.drop_table('sprints')
    op.drop_table('repositories')
    op.drop_table('project_members')
    op.drop_table('projects')
    op.drop_table('users')
