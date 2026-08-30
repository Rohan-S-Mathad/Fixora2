from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class SprintBase(BaseModel):
    name: str
    goal: Optional[str] = None
    status: Optional[str] = "active"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class SprintCreate(SprintBase):
    project_id: str


class SprintUpdate(BaseModel):
    name: Optional[str] = None
    goal: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class SprintOut(SprintBase):
    id: str
    project_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
