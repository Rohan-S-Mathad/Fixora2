from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import or_, select
from sqlalchemy.orm import selectinload
from backend.app.api.deps import get_current_user, get_db
from backend.app.models.issue import Issue
from backend.app.models.user import User
from backend.app.schemas.issue import IssueCreate, IssueOut, IssueUpdate
from backend.app.services.issue_service import IssueService

router = APIRouter()


def serialize_issue(issue: Issue) -> IssueOut:
    return IssueOut(
        id=issue.id,
        project_id=issue.project_id,
        reporter_id=issue.reporter_id,
        issue_number=issue.issue_number,
        title=issue.title,
        description=issue.description,
        status=issue.status,
        severity=issue.severity,
        priority=issue.priority,
        component=issue.component,
        source=issue.source,
        assignee_id=issue.assignee_id,
        sprint_id=issue.sprint_id,
        github_issue_url=issue.github_issue_url,
        ai_summary=issue.ai_summary,
        scan_finding_id=issue.scan_finding_id,
        reproduction_steps=issue.reproduction_steps,
        suggested_fix=issue.suggested_fix,
        created_at=issue.created_at,
        updated_at=issue.updated_at,
        reporter=issue.reporter,
        assignee=issue.assignee,
        labels=[label.name for label in issue.labels] if issue.labels else [],
    )


@router.get("", response_model=List[IssueOut])
async def list_issues(
    project_id: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    severity: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    assignee_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        select(Issue)
        .options(
            selectinload(Issue.reporter),
            selectinload(Issue.assignee),
            selectinload(Issue.labels),
        )
        .order_by(Issue.created_at.desc())
    )

    if project_id:
        query = query.where(Issue.project_id == project_id)
    if status_filter:
        query = query.where(Issue.status == status_filter)
    if severity:
        query = query.where(Issue.severity == severity)
    if priority:
        query = query.where(Issue.priority == priority)
    if assignee_id:
        query = query.where(Issue.assignee_id == assignee_id)
    if search:
        s = f"%{search}%"
        query = query.where(
            or_(
                Issue.title.ilike(s),
                Issue.description.ilike(s),
                Issue.component.ilike(s),
            )
        )

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    issues = result.scalars().all()

    return [serialize_issue(issue) for issue in issues]


@router.post("", response_model=IssueOut, status_code=status.HTTP_201_CREATED)
async def create_issue(
    issue_in: IssueCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    issue = await IssueService.create_issue(
        db=db, issue_in=issue_in, reporter_id=current_user.id
    )

    # Re-fetch with relations loaded
    result = await db.execute(
        select(Issue)
        .options(
            selectinload(Issue.reporter),
            selectinload(Issue.assignee),
            selectinload(Issue.labels),
        )
        .where(Issue.id == issue.id)
    )
    loaded = result.scalars().first()
    return serialize_issue(loaded)


@router.get("/{issue_id}", response_model=IssueOut)
async def get_issue(
    issue_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Issue)
        .options(
            selectinload(Issue.reporter),
            selectinload(Issue.assignee),
            selectinload(Issue.labels),
        )
        .where(Issue.id == issue_id)
    )
    issue = result.scalars().first()
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found"
        )
    return serialize_issue(issue)


@router.patch("/{issue_id}", response_model=IssueOut)
@router.put("/{issue_id}", response_model=IssueOut)
async def update_issue(
    issue_id: str,
    issue_in: IssueUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Issue)
        .options(
            selectinload(Issue.reporter),
            selectinload(Issue.assignee),
            selectinload(Issue.labels),
        )
        .where(Issue.id == issue_id)
    )
    issue = result.scalars().first()
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found"
        )

    updated = await IssueService.update_issue(
        db=db, issue=issue, issue_in=issue_in, user_id=current_user.id
    )
    return serialize_issue(updated)


@router.delete("/{issue_id}", status_code=status.HTTP_200_OK)
async def delete_issue(
    issue_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Issue).where(Issue.id == issue_id))
    issue = result.scalars().first()
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found"
        )

    await db.delete(issue)
    await db.commit()
    return {"success": True, "message": "Issue deleted successfully"}
