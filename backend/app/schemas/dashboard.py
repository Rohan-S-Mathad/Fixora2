from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class DashboardMetricsOut(BaseModel):
    total_issues: int
    open_issues: int
    in_progress_issues: int
    critical_issues: int
    resolved_issues: int
    resolution_rate: float
    security_score: str
    security_score_num: int
    scans_count: int
    total_security_findings: int
    critical_security_findings: int
    active_sprint_name: Optional[str] = None
    active_sprint_goal: Optional[str] = None
    active_sprint_id: Optional[str] = None
