from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from backend.app.api.deps import get_current_user, get_db
from backend.app.models.audit import AuditLog
from backend.app.models.issue import Issue
from backend.app.models.user import User
from backend.app.schemas.audit import AuditLogOut

router = APIRouter()


@router.get("/issues/{issue_id}/history", response_model=List[AuditLogOut])
async def get_issue_history(
    issue_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    issue_result = await db.execute(select(Issue).where(Issue.id == issue_id))
    if not issue_result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found"
        )

    result = await db.execute(
        select(AuditLog)
        .options(selectinload(AuditLog.user))
        .where(AuditLog.issue_id == issue_id)
        .order_by(AuditLog.created_at.desc())
    )
    return result.scalars().all()
