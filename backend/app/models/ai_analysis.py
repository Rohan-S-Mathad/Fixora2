import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class AIAnalysis(Base):
    __tablename__ = "ai_analyses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    issue_id = Column(
        String(36), ForeignKey("issues.id", ondelete="CASCADE"), nullable=True, index=True
    )
    prompt = Column(Text, nullable=False)
    response_payload = Column(JSON, nullable=False)
    model_version = Column(String(100), default="fixora-ai-v1", nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    issue = relationship("Issue", back_populates="ai_analyses")
