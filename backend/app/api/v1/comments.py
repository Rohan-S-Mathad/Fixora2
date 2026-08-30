from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from backend.app.api.deps import get_current_user, get_db
from backend.app.models.comment import Comment
from backend.app.models.issue import Issue
from backend.app.models.user import User
from backend.app.schemas.comment import CommentCreate, CommentOut

router = APIRouter()


@router.get("/issues/{issue_id}/comments", response_model=List[CommentOut])
async def list_issue_comments(
    issue_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Comment)
        .options(selectinload(Comment.user))
        .where(Comment.issue_id == issue_id)
        .order_by(Comment.created_at.asc())
    )
    return result.scalars().all()


@router.post(
    "/issues/{issue_id}/comments",
    response_model=CommentOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_issue_comment(
    issue_id: str,
    comment_in: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify issue exists
    issue_result = await db.execute(select(Issue).where(Issue.id == issue_id))
    if not issue_result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found"
        )

    comment = Comment(
        issue_id=issue_id,
        user_id=current_user.id,
        content=comment_in.content,
        is_ai_generated=comment_in.is_ai_generated or False,
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)

    # Load user relation
    result = await db.execute(
        select(Comment)
        .options(selectinload(Comment.user))
        .where(Comment.id == comment.id)
    )
    return result.scalars().first()
