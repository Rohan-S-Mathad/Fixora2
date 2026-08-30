from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from backend.app.schemas.user import UserOut


class CommentCreate(BaseModel):
    content: str
    is_ai_generated: Optional[bool] = False


class CommentOut(BaseModel):
    id: str
    issue_id: str
    user_id: str
    content: str
    is_ai_generated: bool
    created_at: datetime
    updated_at: datetime
    user: Optional[UserOut] = None

    class Config:
        from_attributes = True
