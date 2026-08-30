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
from backend.app.services.security_scanner_service import SecurityScannerService

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
    scan = Scan(
        project_id=scan_in.project_id,
        target_url=scan_in.target_url,
        scan_type=scan_in.scan_type or "repository",
        status="queued",
        initiated_by=current_user.id,
        created_at=datetime.now(timezone.utc),
    )
    db.add(scan)
    await db.commit()
    await db.refresh(scan)

    # Execute genuine security analysis pipeline
    completed_scan = await SecurityScannerService.run_scan_pipeline(
        db=db,
        scan_id=scan.id,
        target_path_or_url=scan_in.target_url,
        user_id=current_user.id,
    )

    result = await db.execute(
        select(Scan)
        .options(selectinload(Scan.findings))
        .where(Scan.id == completed_scan.id)
    )
    return result.scalars().first()


@router.post("/scans/{scan_id}/complete", response_model=ScanOut)
async def complete_scan(
    scan_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Scan)
        .options(selectinload(Scan.findings))
        .where(Scan.id == scan_id)
    )
    scan = result.scalars().first()
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found"
        )
    return scan


@router.post("/findings/{finding_id}/create-issue", response_model=IssueOut)
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
        proj_res = await db.execute(select(Issue.project_id).limit(1))
        project_id = proj_res.scalar() or "default-project"

    issue_in = IssueCreate(
        project_id=project_id,
        title=f"Security: {finding.title}",
        description=f"Automated security finding detected by {finding.tool}.\n\n"
        f"**File:** `{finding.file_path}:{finding.line_number or 0}`\n\n"
        f"**Description:**\n{finding.description}\n\n"
        f"```\n{finding.code_snippet or ''}\n```",
        severity=finding.severity,
        priority="high" if finding.severity in ["critical", "high"] else "medium",
        component="Security",
        source="repo_scan",
        scan_finding_id=finding.id,
        suggested_fix=finding.ai_suggested_fix,
        labels=["security", finding.tool.lower().replace(" ", "-"), finding.severity],
    )

    issue = await IssueService.create_issue(
        db=db, issue_in=issue_in, reporter_id=current_user.id
    )

    finding.status = "created_issue"
    finding.created_issue_id = issue.id
    await db.commit()

    # Load relations for IssueOut
    issue_with_rel = await db.execute(
        select(Issue)
        .options(
            selectinload(Issue.reporter),
            selectinload(Issue.assignee),
            selectinload(Issue.labels),
            selectinload(Issue.comments),
        )
        .where(Issue.id == issue.id)
    )
    return issue_with_rel.scalars().first()


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
