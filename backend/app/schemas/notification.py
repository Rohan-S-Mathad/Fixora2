from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class NotificationBase(BaseModel):
    title: str
    message: str
    type: str = "info"
    link: Optional[str] = None


class NotificationCreate(NotificationBase):
    user_id: str


class NotificationOut(NotificationBase):
    id: str
    user_id: str
    read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
