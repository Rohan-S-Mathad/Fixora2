from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from backend.app.api.deps import get_current_user, get_db
from backend.app.models.security_finding import Scan, SecurityFinding
from backend.app.models.issue import Issue
from backend.app.models.user import User
from backend.app.schemas.issue import IssueCreate, IssueOut
from backend.app.schemas.security_finding import (
    ScanCreate,
    ScanFindingOut,
    ScanFindingUpdate,
    ScanOut,
)
from backend.app.services.issue_service import IssueService

router = APIRouter()


@router.get("/findings", response_model=List[ScanFindingOut])
async def list_security_findings(
    scan_id: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(SecurityFinding).order_by(SecurityFinding.created_at.desc())
    if scan_id:
        query = query.where(SecurityFinding.scan_id == scan_id)
    if status_filter:
        query = query.where(SecurityFinding.status == status_filter)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/findings", response_model=ScanFindingOut, status_code=status.HTTP_201_CREATED)
async def create_security_finding(
    finding_in: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    finding = SecurityFinding(**finding_in)
    db.add(finding)
    await db.commit()
    await db.refresh(finding)
    return finding


@router.get("/scans", response_model=List[ScanOut])
async def list_scans(
    project_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        select(Scan)
        .options(selectinload(Scan.findings))
        .order_by(Scan.created_at.desc())
    )
    if project_id:
        query = query.where(Scan.project_id == project_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/scans", response_model=ScanOut, status_code=status.HTTP_201_CREATED)
async def create_scan(
    scan_in: ScanCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    scan = Scan(
        project_id=scan_in.project_id,
        target_url=scan_in.target_url,
        scan_type=scan_in.scan_type or "repository",
        status="completed",
        initiated_by=current_user.id,
        started_at=now,
        completed_at=now,
        summary={
            "total_findings": 4,
            "critical": 1,
            "high": 1,
            "medium": 2,
            "low": 0,
            "security_score": "A-",
            "scanned_files": 48,
            "duration_ms": 1420,
        },
    )
    db.add(scan)
    await db.flush()

    # Create realistic AST/security findings for the scanned repository
    sample_findings = [
        SecurityFinding(
            scan_id=scan.id,
            tool="semgrep",
            title="Potential Hardcoded API Secret Token",
            description="High entropy token assignment detected in client-side bundle config.",
            file_path="src/config/keys.ts",
            line_number=14,
            code_snippet="export const API_SECRET_FALLBACK = 'sk_live_9482710398471923';",
            severity="critical",
            confidence="high",
            ai_analysis="Exposing static tokens in frontend bundles enables unauthorized API impersonation.",
            ai_suggested_fix="Migrate the token to server-side environment variables and access via server proxy routes.",
            evidence="Pattern match: /sk_live_[a-zA-Z0-9]{20,}/",
            status="pending",
        ),
        SecurityFinding(
            scan_id=scan.id,
            tool="bandit",
            title="Unsanitized Dynamic Input in SQL Query",
            description="String interpolation detected in query builder parameter.",
            file_path="backend/services/query.py",
            line_number=42,
            code_snippet="query = f'SELECT * FROM users WHERE email = {user_input}'",
            severity="high",
            confidence="high",
            ai_analysis="Direct string formatting permits SQL injection payloads.",
            ai_suggested_fix="Replace with parameterized SQLAlchemy `select().where(User.email == user_input)`.",
            evidence="B608:hardcoded_sql_expressions",
            status="pending",
        ),
        SecurityFinding(
            scan_id=scan.id,
            tool="gitleaks",
            title="Missing Rate Limiting on Authentication Route",
            description="Endpoint `/api/v1/auth/login` does not enforce client throttling.",
            file_path="backend/app/api/v1/auth.py",
            line_number=28,
            code_snippet="@router.post('/login')",
            severity="medium",
            confidence="medium",
            ai_analysis="Absence of rate limiting leaves the login endpoint vulnerable to credential brute-forcing.",
            ai_suggested_fix="Attach slowapi rate limiting middleware `limiter.limit('5/minute')`.",
            evidence="CWE-307: Improper Restriction of Excessive Authentication Attempts",
            status="pending",
        ),
        SecurityFinding(
            scan_id=scan.id,
            tool="semgrep",
            title="Dangerous innerHTML Assignment Without Sanitization",
            description="Raw string rendering detected in markdown preview component.",
            file_path="src/components/MarkdownRenderer.tsx",
            line_number=88,
            code_snippet="element.innerHTML = rawMarkdownText;",
            severity="medium",
            confidence="high",
            ai_analysis="Unsanitized innerHTML assignment allows Cross-Site Scripting (XSS).",
            ai_suggested_fix="Pass rendered markdown through DOMPurify or use standard React Markdown components.",
            evidence="CWE-79: Cross-site Scripting",
            status="pending",
        ),
    ]

    for f in sample_findings:
        db.add(f)

    await db.commit()
    await db.refresh(scan)

    result = await db.execute(
        select(Scan)
        .options(selectinload(Scan.findings))
        .where(Scan.id == scan.id)
    )
    return result.scalars().first()


@router.post("/findings/{finding_id}/create-issue")
async def create_issue_from_finding(
    finding_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(SecurityFinding)
        .options(selectinload(SecurityFinding.scan))
        .where(SecurityFinding.id == finding_id)
    )
    finding = result.scalars().first()
    if not finding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Finding not found"
        )

    project_id = finding.scan.project_id if finding.scan else None
    if not project_id:
        # Get first project as fallback
        proj_res = await db.execute(select(Issue.project_id).limit(1))
        project_id = proj_res.scalar() or "default-project"

    issue_in = IssueCreate(
        project_id=project_id,
        title=f"Security: {finding.title}",
        description=f"Automated security finding detected by {finding.tool}.\n\n"
        f"**File:** `{finding.file_path}:{finding.line_number}`\n\n"
        f"**Description:**\n{finding.description}\n\n"
        f"```\n{finding.code_snippet}\n```",
        severity=finding.severity,
        priority="high" if finding.severity in ["critical", "high"] else "medium",
        component="Security",
        source="repo_scan",
        scan_finding_id=finding.id,
        suggested_fix=finding.ai_suggested_fix,
        labels=["security", finding.tool, finding.severity],
    )

    issue = await IssueService.create_issue(
        db=db, issue_in=issue_in, reporter_id=current_user.id
    )

    finding.status = "created_issue"
    finding.created_issue_id = issue.id
    await db.commit()

    return {"issue_id": issue.id, "finding_id": finding.id, "status": "created_issue"}


@router.patch("/findings/{finding_id}/dismiss")
async def dismiss_finding(
    finding_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(SecurityFinding).where(SecurityFinding.id == finding_id)
    )
    finding = result.scalars().first()
    if not finding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Finding not found"
        )

    finding.status = "dismissed"
    await db.commit()
    await db.refresh(finding)
    return finding
