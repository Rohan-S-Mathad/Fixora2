from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from backend.app.schemas.user import UserOut


class LabelBase(BaseModel):
    name: str
    color: Optional[str] = "#6366f1"


class LabelOut(LabelBase):
    id: str

    class Config:
        from_attributes = True


class IssueBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = "open"
    severity: Optional[str] = "medium"
    priority: Optional[str] = "medium"
    component: Optional[str] = "General"
    source: Optional[str] = "manual"
    assignee_id: Optional[str] = None
    sprint_id: Optional[str] = None
    github_issue_url: Optional[str] = None
    ai_summary: Optional[str] = None
    scan_finding_id: Optional[str] = None
    reproduction_steps: Optional[str] = None
    suggested_fix: Optional[str] = None


class IssueCreate(IssueBase):
    project_id: str
    labels: Optional[List[str]] = []


class IssueUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    severity: Optional[str] = None
    priority: Optional[str] = None
    component: Optional[str] = None
    assignee_id: Optional[str] = None
    sprint_id: Optional[str] = None
    github_issue_url: Optional[str] = None
    ai_summary: Optional[str] = None
    reproduction_steps: Optional[str] = None
    suggested_fix: Optional[str] = None
    labels: Optional[List[str]] = None


class IssueOut(IssueBase):
    id: str
    project_id: str
    reporter_id: str
    issue_number: int
    created_at: datetime
    updated_at: datetime
    reporter: Optional[UserOut] = None
    assignee: Optional[UserOut] = None
    labels: List[str] = []

    class Config:
        from_attributes = True
