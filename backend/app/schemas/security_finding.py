from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class ScanCreate(BaseModel):
    project_id: str
    target_url: str
    scan_type: Optional[str] = "repository"


class ScanFindingOut(BaseModel):
    id: str
    scan_id: str
    tool: str
    title: str
    description: Optional[str] = None
    file_path: Optional[str] = None
    line_number: Optional[int] = None
    code_snippet: Optional[str] = None
    severity: str
    confidence: str
    ai_analysis: Optional[str] = None
    ai_suggested_fix: Optional[str] = None
    evidence: Optional[str] = None
    status: str
    created_issue_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ScanFindingUpdate(BaseModel):
    status: Optional[str] = None
    created_issue_id: Optional[str] = None


class ScanOut(BaseModel):
    id: str
    project_id: str
    initiated_by: Optional[str] = None
    scan_type: str
    status: str
    target_url: str
    error_message: Optional[str] = None
    summary: Optional[Dict[str, Any]] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    findings: List[ScanFindingOut] = []

    class Config:
        from_attributes = True
