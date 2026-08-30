import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

# Association table for Issues <-> Labels
issue_labels = Table(
    "issue_labels",
    Base.metadata,
    Column(
        "issue_id",
        String(36),
        ForeignKey("issues.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "label_id",
        String(36),
        ForeignKey("labels.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Label(Base):
    __tablename__ = "labels"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), unique=True, index=True, nullable=False)
    color = Column(String(20), default="#6366f1", nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    issues = relationship("Issue", secondary=issue_labels, back_populates="labels")


class Issue(Base):
    __tablename__ = "issues"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(
        String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sprint_id = Column(
        String(36), ForeignKey("sprints.id", ondelete="SET NULL"), nullable=True
    )
    reporter_id = Column(
        String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    assignee_id = Column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    issue_number = Column(Integer, nullable=False, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="open", nullable=False, index=True)
    severity = Column(String(50), default="medium", nullable=False, index=True)
    priority = Column(String(50), default="medium", nullable=False, index=True)
    component = Column(String(100), default="General", nullable=True)
    source = Column(String(50), default="manual", nullable=False)
    github_issue_url = Column(String(500), nullable=True)
    ai_summary = Column(Text, nullable=True)
    scan_finding_id = Column(String(36), nullable=True)
    reproduction_steps = Column(Text, nullable=True)
    suggested_fix = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    project = relationship("Project", back_populates="issues")
    sprint = relationship("Sprint", back_populates="issues")
    reporter = relationship("User", foreign_keys=[reporter_id], back_populates="reported_issues")
    assignee = relationship("User", foreign_keys=[assignee_id], back_populates="assigned_issues")
    labels = relationship("Label", secondary=issue_labels, back_populates="issues", lazy="selectin")
    comments = relationship("Comment", back_populates="issue", cascade="all, delete-orphan")
    history = relationship("AuditLog", back_populates="issue", cascade="all, delete-orphan")
    ai_analyses = relationship("AIAnalysis", back_populates="issue", cascade="all, delete-orphan")
