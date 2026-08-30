from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from backend.app.api.deps import get_current_user, get_db
from backend.app.models.issue import Issue
from backend.app.models.sprint import Sprint
from backend.app.models.security_finding import Scan, SecurityFinding
from backend.app.models.user import User
from backend.app.schemas.dashboard import DashboardMetricsOut

router = APIRouter()


@router.get("/metrics", response_model=DashboardMetricsOut)
async def get_dashboard_metrics(
    project_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Issues Queries
    base_issue_query = select(Issue)
    if project_id:
        base_issue_query = base_issue_query.where(Issue.project_id == project_id)

    issues_result = await db.execute(base_issue_query)
    issues = issues_result.scalars().all()

    total_issues = len(issues)
    open_issues = sum(1 for i in issues if i.status in ["open", "reopened"])
    in_progress_issues = sum(1 for i in issues if i.status in ["in_progress", "in_review"])
    critical_issues = sum(
        1 for i in issues if i.severity == "critical" and i.status not in ["resolved", "closed"]
    )
    resolved_issues = sum(1 for i in issues if i.status in ["resolved", "closed"])
    resolution_rate = round((resolved_issues / total_issues * 100), 1) if total_issues > 0 else 0.0

    # 2. Security / Scans Queries
    base_scan_query = select(Scan)
    if project_id:
        base_scan_query = base_scan_query.where(Scan.project_id == project_id)
    scans_result = await db.execute(base_scan_query)
    scans = scans_result.scalars().all()
    scans_count = len(scans)

    base_finding_query = select(SecurityFinding)
    if project_id:
        base_finding_query = base_finding_query.join(Scan).where(Scan.project_id == project_id)
    findings_result = await db.execute(base_finding_query)
    findings = findings_result.scalars().all()

    total_findings = len(findings)
    critical_findings = sum(1 for f in findings if f.severity == "critical" and f.status != "dismissed")
    high_findings = sum(1 for f in findings if f.severity == "high" and f.status != "dismissed")

    # Compute genuine security score based on active findings
    if total_findings == 0:
        security_score = "A+"
        security_score_num = 98
    elif critical_findings > 2:
        security_score = "C"
        security_score_num = 68
    elif critical_findings > 0 or high_findings > 2:
        security_score = "B-"
        security_score_num = 78
    elif high_findings > 0:
        security_score = "B+"
        security_score_num = 86
    else:
        security_score = "A-"
        security_score_num = 91

    # 3. Active Sprint
    active_sprint_query = select(Sprint).where(Sprint.status == "active")
    if project_id:
        active_sprint_query = active_sprint_query.where(Sprint.project_id == project_id)
    sprint_result = await db.execute(active_sprint_query.order_by(Sprint.created_at.desc()))
    active_sprint = sprint_result.scalars().first()

    return DashboardMetricsOut(
        total_issues=total_issues,
        open_issues=open_issues,
        in_progress_issues=in_progress_issues,
        critical_issues=critical_issues,
        resolved_issues=resolved_issues,
        resolution_rate=resolution_rate,
        security_score=security_score,
        security_score_num=security_score_num,
        scans_count=scans_count,
        total_security_findings=total_findings,
        critical_security_findings=critical_findings,
        active_sprint_name=active_sprint.name if active_sprint else None,
        active_sprint_goal=active_sprint.goal if active_sprint else None,
        active_sprint_id=active_sprint.id if active_sprint else None,
    )
