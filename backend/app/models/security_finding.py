import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class Scan(Base):
    __tablename__ = "scans"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(
        String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    initiated_by = Column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    scan_type = Column(String(50), default="repository", nullable=False)
    status = Column(String(50), default="completed", nullable=False)
    target_url = Column(String(500), nullable=False)
    error_message = Column(Text, nullable=True)
    summary = Column(JSON, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    project = relationship("Project", back_populates="scans")
    findings = relationship(
        "SecurityFinding", back_populates="scan", cascade="all, delete-orphan", lazy="selectin"
    )


class SecurityFinding(Base):
    __tablename__ = "security_findings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    scan_id = Column(
        String(36), ForeignKey("scans.id", ondelete="CASCADE"), nullable=False, index=True
    )
    tool = Column(String(100), nullable=False)  # bandit, semgrep, gitleaks
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    file_path = Column(String(500), nullable=True)
    line_number = Column(Integer, nullable=True)
    code_snippet = Column(Text, nullable=True)
    severity = Column(String(50), default="medium", nullable=False)
    confidence = Column(String(50), default="high", nullable=False)
    ai_analysis = Column(Text, nullable=True)
    ai_suggested_fix = Column(Text, nullable=True)
    evidence = Column(Text, nullable=True)
    status = Column(String(50), default="pending", nullable=False)  # pending, reviewed, dismissed, created_issue
    created_issue_id = Column(String(36), ForeignKey("issues.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    scan = relationship("Scan", back_populates="findings")
