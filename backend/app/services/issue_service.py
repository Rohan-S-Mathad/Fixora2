from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload
from backend.app.models.issue import Issue, Label
from backend.app.models.audit import AuditLog
from backend.app.schemas.issue import IssueCreate, IssueUpdate


class IssueService:
    @staticmethod
    async def get_next_issue_number(db: AsyncSession, project_id: str) -> int:
        result = await db.execute(
            select(func.coalesce(func.max(Issue.issue_number), 0)).where(
                Issue.project_id == project_id
            )
        )
        max_num = result.scalar() or 0
        return max_num + 1

    @staticmethod
    async def get_or_create_labels(
        db: AsyncSession, label_names: List[str]
    ) -> List[Label]:
        labels = []
        for name in label_names:
            clean_name = name.strip()
            if not clean_name:
                continue
            result = await db.execute(
                select(Label).where(Label.name == clean_name)
            )
            label = result.scalars().first()
            if not label:
                label = Label(name=clean_name)
                db.add(label)
                await db.flush()
            labels.append(label)
        return labels

    @staticmethod
    async def create_issue(
        db: AsyncSession, issue_in: IssueCreate, reporter_id: str
    ) -> Issue:
        issue_number = await IssueService.get_next_issue_number(
            db, issue_in.project_id
        )

        labels = []
        if issue_in.labels:
            labels = await IssueService.get_or_create_labels(db, issue_in.labels)

        issue = Issue(
            project_id=issue_in.project_id,
            reporter_id=reporter_id,
            issue_number=issue_number,
            title=issue_in.title,
            description=issue_in.description,
            status=issue_in.status or "open",
            severity=issue_in.severity or "medium",
            priority=issue_in.priority or "medium",
            component=issue_in.component or "General",
            source=issue_in.source or "manual",
            assignee_id=issue_in.assignee_id,
            sprint_id=issue_in.sprint_id,
            github_issue_url=issue_in.github_issue_url,
            ai_summary=issue_in.ai_summary,
            scan_finding_id=issue_in.scan_finding_id,
            reproduction_steps=issue_in.reproduction_steps,
            suggested_fix=issue_in.suggested_fix,
            labels=labels,
        )
        db.add(issue)
        await db.flush()

        # Add initial audit history
        audit = AuditLog(
            issue_id=issue.id,
            user_id=reporter_id,
            field_changed="created",
            new_value=f"Issue #{issue_number} created",
        )
        db.add(audit)
        await db.commit()
        await db.refresh(issue)
        return issue

    @staticmethod
    async def update_issue(
        db: AsyncSession,
        issue: Issue,
        issue_in: IssueUpdate,
        user_id: Optional[str] = None,
    ) -> Issue:
        update_data = issue_in.model_dump(exclude_unset=True)

        for field, new_val in update_data.items():
            if field == "labels":
                if new_val is not None:
                    old_labels_str = ", ".join([l.name for l in issue.labels])
                    issue.labels = await IssueService.get_or_create_labels(
                        db, new_val
                    )
                    new_labels_str = ", ".join(new_val)
                    if old_labels_str != new_labels_str:
                        db.add(
                            AuditLog(
                                issue_id=issue.id,
                                user_id=user_id,
                                field_changed="labels",
                                old_value=old_labels_str,
                                new_value=new_labels_str,
                            )
                        )
                continue

            old_val = getattr(issue, field)
            if old_val != new_val:
                setattr(issue, field, new_val)
                db.add(
                    AuditLog(
                        issue_id=issue.id,
                        user_id=user_id,
                        field_changed=field,
                        old_value=str(old_val) if old_val is not None else None,
                        new_value=str(new_val) if new_val is not None else None,
                    )
                )

        await db.commit()
        await db.refresh(issue)
        return issue
