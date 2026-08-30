from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload
from backend.app.api.deps import get_current_user, get_db
from backend.app.models.project import Project, ProjectMember
from backend.app.models.issue import Issue
from backend.app.models.user import User
from backend.app.schemas.project import (
    ProjectCreate,
    ProjectMemberCreate,
    ProjectMemberOut,
    ProjectOut,
    ProjectUpdate,
)

router = APIRouter()


@router.get("", response_model=List[ProjectOut])
async def list_projects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(
            Project,
            func.count(ProjectMember.id.distinct()).label("members_count"),
            func.count(Issue.id.distinct()).label("issues_count"),
        )
        .outerjoin(ProjectMember, Project.id == ProjectMember.project_id)
        .outerjoin(Issue, Project.id == Issue.project_id)
        .group_by(Project.id)
        .order_by(Project.created_at.desc())
    )
    result = await db.execute(stmt)
    rows = result.all()

    projects_out = []
    for proj, members_count, issues_count in rows:
        p_dict = {
            "id": proj.id,
            "name": proj.name,
            "key": proj.key,
            "description": proj.description,
            "github_repo_url": proj.github_repo_url,
            "created_by": proj.created_by,
            "created_at": proj.created_at,
            "updated_at": proj.updated_at,
            "members_count": members_count,
            "issues_count": issues_count,
        }
        projects_out.append(ProjectOut(**p_dict))
    return projects_out


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_in: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check duplicate key
    existing = await db.execute(select(Project).where(Project.key == project_in.key.upper().strip()))
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Project with key '{project_in.key}' already exists",
        )

    project = Project(
        name=project_in.name,
        key=project_in.key.upper().strip(),
        description=project_in.description,
        github_repo_url=project_in.github_repo_url,
        created_by=current_user.id,
    )
    db.add(project)
    await db.flush()

    # Add creator as admin member
    member = ProjectMember(
        project_id=project.id,
        user_id=current_user.id,
        role="admin",
    )
    db.add(member)
    await db.commit()
    await db.refresh(project)

    return ProjectOut(
        id=project.id,
        name=project.name,
        key=project.key,
        description=project.description,
        github_repo_url=project.github_repo_url,
        created_by=project.created_by,
        created_at=project.created_at,
        updated_at=project.updated_at,
        members_count=1,
        issues_count=0,
    )


@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(
            Project,
            func.count(ProjectMember.id.distinct()).label("members_count"),
            func.count(Issue.id.distinct()).label("issues_count"),
        )
        .outerjoin(ProjectMember, Project.id == ProjectMember.project_id)
        .outerjoin(Issue, Project.id == Issue.project_id)
        .where(Project.id == project_id)
        .group_by(Project.id)
    )
    result = await db.execute(stmt)
    row = result.first()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )
    proj, members_count, issues_count = row
    return ProjectOut(
        id=proj.id,
        name=proj.name,
        key=proj.key,
        description=proj.description,
        github_repo_url=proj.github_repo_url,
        created_by=proj.created_by,
        created_at=proj.created_at,
        updated_at=proj.updated_at,
        members_count=members_count,
        issues_count=issues_count,
    )


@router.get("/{project_id}/members", response_model=List[ProjectMemberOut])
async def get_project_members(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ProjectMember)
        .options(selectinload(ProjectMember.user))
        .where(ProjectMember.project_id == project_id)
    )
    return result.scalars().all()


@router.post("/{project_id}/members", response_model=ProjectMemberOut)
async def add_project_member(
    project_id: str,
    member_in: ProjectMemberCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check if already member
    existing = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == member_in.user_id,
        )
    )
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this project",
        )

    member = ProjectMember(
        project_id=project_id,
        user_id=member_in.user_id,
        role=member_in.role or "developer",
    )
    db.add(member)
    await db.commit()
    await db.refresh(member)

    # Load user
    result = await db.execute(
        select(ProjectMember)
        .options(selectinload(ProjectMember.user))
        .where(ProjectMember.id == member.id)
    )
    return result.scalars().first()
