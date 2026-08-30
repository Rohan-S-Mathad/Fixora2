from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from backend.app.schemas.user import UserOut


class ProjectBase(BaseModel):
    name: str
    key: str
    description: Optional[str] = None
    github_repo_url: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    github_repo_url: Optional[str] = None


class ProjectMemberCreate(BaseModel):
    user_id: str
    role: Optional[str] = "developer"


class ProjectMemberOut(BaseModel):
    id: str
    project_id: str
    user_id: str
    role: str
    joined_at: datetime
    user: Optional[UserOut] = None

    class Config:
        from_attributes = True


class ProjectOut(ProjectBase):
    id: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    members_count: Optional[int] = 0
    issues_count: Optional[int] = 0

    class Config:
        from_attributes = True
