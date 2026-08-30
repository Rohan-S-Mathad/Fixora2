from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.api.deps import get_current_user, get_db
from backend.app.models.sprint import Sprint
from backend.app.models.user import User
from backend.app.schemas.sprint import SprintCreate, SprintOut, SprintUpdate

router = APIRouter()


@router.get("", response_model=List[SprintOut])
async def list_sprints(
    project_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Sprint).order_by(Sprint.created_at.desc())
    if project_id:
        query = query.where(Sprint.project_id == project_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=SprintOut, status_code=status.HTTP_201_CREATED)
async def create_sprint(
    sprint_in: SprintCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sprint = Sprint(
        project_id=sprint_in.project_id,
        name=sprint_in.name,
        goal=sprint_in.goal,
        status=sprint_in.status or "active",
        start_date=sprint_in.start_date,
        end_date=sprint_in.end_date,
    )
    db.add(sprint)
    await db.commit()
    await db.refresh(sprint)
    return sprint


@router.patch("/{sprint_id}", response_model=SprintOut)
async def update_sprint(
    sprint_id: str,
    sprint_in: SprintUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Sprint).where(Sprint.id == sprint_id))
    sprint = result.scalars().first()
    if not sprint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Sprint not found"
        )

    update_data = sprint_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(sprint, field, val)

    await db.commit()
    await db.refresh(sprint)
    return sprint
