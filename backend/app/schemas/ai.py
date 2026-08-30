from typing import List, Optional
from pydantic import BaseModel


class AIBugAnalysisRequest(BaseModel):
    project_id: str
    bug_description: str
    component: Optional[str] = "General"
    reproduction_steps: Optional[str] = None
    environment: Optional[str] = None


class AIBugAnalysisResponse(BaseModel):
    title: str
    severity: str
    priority: str
    component: Optional[str] = "General"
    labels: List[str] = []
    reproduction_steps: str
    suggested_fix: str
    root_cause: Optional[str] = None
    confidence: Optional[str] = "95%"
