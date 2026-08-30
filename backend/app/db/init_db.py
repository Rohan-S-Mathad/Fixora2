import asyncio
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.core.database import Base, engine, AsyncSessionLocal
from backend.app.core.security import get_password_hash
from backend.app.models.user import User
from backend.app.models.project import Project, ProjectMember
from backend.app.models.sprint import Sprint
from backend.app.models.issue import Issue, Label
from backend.app.models.comment import Comment
from backend.app.models.audit import AuditLog
from backend.app.models.security_finding import Scan, SecurityFinding


async def init_db() -> None:
    # Create all tables asynchronously
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Check if already seeded
        result = await session.execute(select(User).limit(1))
        if result.scalars().first():
            return

        now = datetime.now(timezone.utc)

        # 1. Create Users
        demo_user = User(
            id="user-rohan-dev",
            email="rohan@fixora.dev",
            name="Rohan Mathad",
            hashed_password=get_password_hash("fixora123"),
            role="admin",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces",
            is_active=True,
        )
        alex_user = User(
            id="user-alex-sec",
            email="alex@fixora.dev",
            name="Alex Chen",
            hashed_password=get_password_hash("fixora123"),
            role="developer",
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces",
            is_active=True,
        )
        sarah_user = User(
            id="user-sarah-lead",
            email="sarah@fixora.dev",
            name="Sarah Jenkins",
            hashed_password=get_password_hash("fixora123"),
            role="manager",
            avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces",
            is_active=True,
        )
        session.add_all([demo_user, alex_user, sarah_user])
        await session.flush()

        # 2. Create Projects
        fixora_core = Project(
            id="proj-fixora-core",
            name="Fixora Core Platform",
            key="FIX",
            description="Core real-time AI issue tracking engine, telemetry ingestion, and AST security vulnerability analysis pipeline.",
            github_repo_url="https://github.com/Rohan-S-Mathad/Fixora",
            created_by=demo_user.id,
        )
        session.add(fixora_core)
        await session.flush()

        # Project Members
        session.add_all([
            ProjectMember(project_id=fixora_core.id, user_id=demo_user.id, role="admin"),
            ProjectMember(project_id=fixora_core.id, user_id=alex_user.id, role="developer"),
            ProjectMember(project_id=fixora_core.id, user_id=sarah_user.id, role="manager"),
        ])

        # 3. Create Sprints
        sprint_1 = Sprint(
            id="sprint-q3-hardening",
            project_id=fixora_core.id,
            name="Sprint 14: Core Hardening & Security",
            goal="Harden authentication pipelines, integrate AST security scanners, and optimize telemetry ingest latency.",
            status="active",
            start_date=now - timedelta(days=5),
            end_date=now + timedelta(days=9),
        )
        session.add(sprint_1)
        await session.flush()

        # 4. Create Labels
        label_sec = Label(name="security", color="#ef4444")
        label_perf = Label(name="performance", color="#f59e0b")
        label_auth = Label(name="auth", color="#8b5cf6")
        label_ai = Label(name="ai-assisted", color="#06b6d4")
        label_db = Label(name="database", color="#10b981")
        session.add_all([label_sec, label_perf, label_auth, label_ai, label_db])
        await session.flush()

        # 5. Create Core Issues
        issue_1 = Issue(
            id="iss-101",
            project_id=fixora_core.id,
            reporter_id=demo_user.id,
            assignee_id=demo_user.id,
            sprint_id=sprint_1.id,
            issue_number=101,
            title="High Latency in Event Stream Ingestion during AST Analysis Spike",
            description="WebSocket event pipeline experiences micro-buffering delays (>320ms) when multiple AST repository scans trigger concurrently.",
            status="in_progress",
            severity="high",
            priority="high",
            component="Telemetry Engine",
            source="manual",
            reproduction_steps="1. Trigger concurrent AST repository scans on 3 distinct repositories\n2. Stream real-time telemetry metrics via WebSocket\n3. Observe event loop queue depth growing beyond 500 items",
            suggested_fix="Implement batched worker pool buffering and Redis-backed task queue throttling.",
            labels=[label_perf, label_ai],
        )
        issue_2 = Issue(
            id="iss-102",
            project_id=fixora_core.id,
            reporter_id=alex_user.id,
            assignee_id=alex_user.id,
            sprint_id=sprint_1.id,
            issue_number=102,
            title="Potential Token Expiry Race Condition on Background Refresh",
            description="JWT token refresh logic in client interceptor occasionally sends concurrent refresh requests, invalidating the previous token grant.",
            status="open",
            severity="critical",
            priority="urgent",
            component="Authentication",
            source="manual",
            reproduction_steps="1. Open 3 browser tabs with session expiring in <10s\n2. Trigger simultaneous API requests across all tabs\n3. Verify whether 401 Unauthorized is thrown due to single-use refresh token rotation",
            suggested_fix="Add mutex locking promise queue around `refreshToken()` method in API client.",
            labels=[label_auth, label_sec],
        )
        issue_3 = Issue(
            id="iss-103",
            project_id=fixora_core.id,
            reporter_id=sarah_user.id,
            assignee_id=demo_user.id,
            sprint_id=sprint_1.id,
            issue_number=103,
            title="AST Security Scanner Flags False-Positive on Parameterized SQL Query",
            description="Bandit rule B608 flags multiline parameterized SQLAlchemy `text()` queries as hardcoded SQL strings.",
            status="in_review",
            severity="medium",
            priority="medium",
            component="Security Analyzer",
            source="repo_scan",
            reproduction_steps="1. Run AST bug hunter scan on SQLAlchemy repository\n2. Inspect security report finding for text() constructs",
            suggested_fix="Tune Semgrep / Bandit AST custom rule filters to recognize SQLAlchemy bind parameters.",
            labels=[label_sec, label_db],
        )
        issue_4 = Issue(
            id="iss-104",
            project_id=fixora_core.id,
            reporter_id=demo_user.id,
            assignee_id=sarah_user.id,
            sprint_id=sprint_1.id,
            issue_number=104,
            title="Database Connection Pool Exhaustion on Rapid Kanban Drag-and-Drop",
            description="Rapid status mutations in quick succession can spike active database session count if connections are not recycled promptly.",
            status="resolved",
            severity="medium",
            priority="low",
            component="Database Layer",
            source="manual",
            suggested_fix="Configured async session timeout and increased pool_recycle parameter.",
            labels=[label_db, label_perf],
        )

        session.add_all([issue_1, issue_2, issue_3, issue_4])
        await session.flush()

        # 6. Add Comments and Audit Logs
        session.add_all([
            Comment(
                issue_id=issue_1.id,
                user_id=alex_user.id,
                content="Profiling data confirms event loop blocking is happening in JSON serialization of raw AST nodes. Recommend using fast serialization or chunking.",
                is_ai_generated=False,
            ),
            Comment(
                issue_id=issue_1.id,
                user_id=demo_user.id,
                content="Implemented worker batching. Initial benchmarks show latency down to ~42ms under 10k events/sec.",
                is_ai_generated=False,
            ),
            AuditLog(
                issue_id=issue_1.id,
                user_id=demo_user.id,
                field_changed="status",
                old_value="open",
                new_value="in_progress",
            ),
            AuditLog(
                issue_id=issue_2.id,
                user_id=alex_user.id,
                field_changed="severity",
                old_value="high",
                new_value="critical",
            ),
        ])

        # 7. Add Initial Scan
        scan_1 = Scan(
            id="scan-demo-01",
            project_id=fixora_core.id,
            initiated_by=alex_user.id,
            scan_type="repository",
            status="completed",
            target_url="https://github.com/Rohan-S-Mathad/Fixora",
            started_at=now - timedelta(hours=2),
            completed_at=now - timedelta(hours=2) + timedelta(seconds=14),
            summary={
                "total_findings": 3,
                "critical": 1,
                "high": 1,
                "medium": 1,
                "low": 0,
                "security_score": "A-",
                "scanned_files": 34,
                "duration_ms": 1420,
            },
        )
        session.add(scan_1)
        await session.flush()

        session.add_all([
            SecurityFinding(
                scan_id=scan_1.id,
                tool="semgrep",
                title="Potential Hardcoded API Secret in Configuration File",
                description="High entropy token assignment detected in client config.",
                file_path="src/config/keys.ts",
                line_number=14,
                code_snippet="export const API_SECRET_FALLBACK = 'sk_live_9482710398471923';",
                severity="critical",
                confidence="high",
                ai_analysis="Exposing static tokens in frontend bundles enables unauthorized API impersonation.",
                ai_suggested_fix="Migrate the token to server-side environment variables.",
                evidence="Pattern match: /sk_live_[a-zA-Z0-9]{20,}/",
                status="pending",
            ),
            SecurityFinding(
                scan_id=scan_1.id,
                tool="bandit",
                title="Unsanitized Dynamic Input in Query Parameter",
                description="String interpolation detected in query builder parameter.",
                file_path="backend/services/query.py",
                line_number=42,
                code_snippet="query = f'SELECT * FROM users WHERE email = {user_input}'",
                severity="high",
                confidence="high",
                ai_analysis="Direct string formatting permits SQL injection payloads.",
                ai_suggested_fix="Replace with parameterized SQLAlchemy bind parameters.",
                evidence="B608:hardcoded_sql_expressions",
                status="pending",
            ),
        ])

        await session.commit()


if __name__ == "__main__":
    asyncio.run(init_db())
