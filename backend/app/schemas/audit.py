from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from backend.app.schemas.user import UserOut


class AuditLogOut(BaseModel):
    id: str
    issue_id: str
    user_id: Optional[str] = None
    field_changed: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    created_at: datetime
    user: Optional[UserOut] = None

    class Config:
        from_attributes = True
