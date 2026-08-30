from typing import List, Optional
from pydantic import BaseModel


class AIBugAnalysisRequest(BaseModel):
    project_id: str
    bug_description: str
    component: Optional[str] = "General"
    reproduction_steps: Optional[str] = None
    environment: Optional[str] = None
    code_context: Optional[str] = None


class AIBugAnalysisResponse(BaseModel):
    title: str
    severity: str
    priority: str
    component: Optional[str] = "General"
    labels: List[str] = []
    reproduction_steps: str
    suggested_fix: str
    root_cause: Optional[str] = None
    confidence: Optional[str] = "High"
    patch: Optional[str] = None
    model_used: Optional[str] = None


class AIPatchGenerateRequest(BaseModel):
    code_context: str
    error_message: str
    file_path: Optional[str] = None
    bug_description: Optional[str] = None


class AIPatchGenerateResponse(BaseModel):
    patch: str
    explanation: str
    test_case: Optional[str] = None
    model_used: Optional[str] = None


class AISecurityTriageRequest(BaseModel):
    tool: str
    finding_title: str
    finding_description: str
    code_snippet: Optional[str] = None
    file_path: Optional[str] = None


class AISecurityTriageResponse(BaseModel):
    root_cause: str
    suggested_fix: str
    patch: Optional[str] = None
    severity: str
    confidence: str
    model_used: Optional[str] = None
