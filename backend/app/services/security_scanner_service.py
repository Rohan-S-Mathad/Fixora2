import asyncio
import json
import logging
import os
import re
import shutil
import tempfile
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.core.config import settings
from backend.app.models.security_finding import Scan, SecurityFinding
from backend.app.models.issue import Issue
from backend.app.services.issue_service import IssueService
from backend.app.schemas.issue import IssueCreate
from backend.app.services.ai_service import AIService
from backend.app.schemas.ai import AISecurityTriageRequest

logger = logging.getLogger("fixora.security")


class SecurityScannerService:
    @staticmethod
    async def run_scan_pipeline(
        db: AsyncSession,
        scan_id: str,
        target_path_or_url: str,
        user_id: Optional[str] = None,
    ) -> Scan:
        start_time = time.time()
        result = await db.execute(select(Scan).where(Scan.id == scan_id))
        scan = result.scalars().first()
        if not scan:
            raise ValueError(f"Scan {scan_id} not found")

        scan.status = "running"
        scan.started_at = datetime.now(timezone.utc)
        await db.commit()

        findings_to_create: List[Dict[str, Any]] = []
        tools_run: List[str] = []
        files_scanned = 0

        # Determine target directory for scanning
        # If target is local or workspace, scan it; otherwise scan backend/src
        scan_dir = "."
        if os.path.exists(target_path_or_url):
            scan_dir = target_path_or_url

        try:
            # 1. Run Bandit (Python SAST)
            try:
                bandit_findings = await SecurityScannerService._run_bandit(scan_dir)
                findings_to_create.extend(bandit_findings)
                tools_run.append("bandit")
            except Exception as e:
                logger.warning(f"Bandit execution warning: {e}")

            # 2. Run Detect-Secrets / Secret Regex Scanner
            try:
                secret_findings = await SecurityScannerService._run_secret_scanner(scan_dir)
                findings_to_create.extend(secret_findings)
                tools_run.append("secrets-analyzer")
            except Exception as e:
                logger.warning(f"Secret scanner warning: {e}")

            # 3. Run Semgrep (if installed) or AST pattern scanner
            try:
                semgrep_findings = await SecurityScannerService._run_semgrep(scan_dir)
                findings_to_create.extend(semgrep_findings)
                tools_run.append("semgrep")
            except Exception as e:
                logger.warning(f"Semgrep execution warning: {e}")

            # Count scanned files
            for root, dirs, files in os.walk(scan_dir):
                if any(ignored in root for ignored in ["node_modules", ".git", ".venv", "dist", "__pycache__"]):
                    continue
                for f in files:
                    if f.endswith((".py", ".ts", ".tsx", ".js", ".jsx", ".json", ".env")):
                        files_scanned += 1

            # Enrich findings and persist to DB
            for finding_data in findings_to_create:
                # Optionally run AI triage for high/critical findings
                ai_analysis = None
                ai_fix = None
                if settings.AI_ENABLED:
                    try:
                        triage = await AIService.triage_security_finding(
                            AISecurityTriageRequest(
                                tool=finding_data.get("tool", "Scanner"),
                                finding_title=finding_data.get("title", ""),
                                finding_description=finding_data.get("description", ""),
                                code_snippet=finding_data.get("code_snippet"),
                                file_path=finding_data.get("file_path"),
                            )
                        )
                        ai_analysis = triage.root_cause
                        ai_fix = triage.suggested_fix
                    except Exception as e:
                        logger.warning(f"AI triage skipped for finding: {e}")

                finding = SecurityFinding(
                    scan_id=scan.id,
                    tool=finding_data.get("tool", "Fixora Security"),
                    title=finding_data.get("title", "Security Flaw"),
                    description=finding_data.get("description", ""),
                    file_path=finding_data.get("file_path", ""),
                    line_number=finding_data.get("line_number"),
                    code_snippet=finding_data.get("code_snippet"),
                    severity=finding_data.get("severity", "medium").lower(),
                    confidence=finding_data.get("confidence", "high").lower(),
                    ai_analysis=ai_analysis or finding_data.get("ai_analysis"),
                    ai_suggested_fix=ai_fix or finding_data.get("ai_suggested_fix"),
                    status="pending",
                )
                db.add(finding)

            duration_ms = round((time.time() - start_time) * 1000, 2)
            scan.status = "completed"
            scan.completed_at = datetime.now(timezone.utc)
            scan.summary = {
                "files_scanned": files_scanned,
                "duration_ms": duration_ms,
                "tools_run": tools_run,
                "total_findings": len(findings_to_create),
                "critical_count": sum(1 for f in findings_to_create if f.get("severity") == "critical"),
                "high_count": sum(1 for f in findings_to_create if f.get("severity") == "high"),
            }
            await db.commit()
            await db.refresh(scan)
            return scan

        except Exception as e:
            logger.error(f"Scan pipeline failed: {e}", exc_info=True)
            scan.status = "failed"
            scan.error_message = str(e)
            scan.completed_at = datetime.now(timezone.utc)
            await db.commit()
            await db.refresh(scan)
            return scan

    @staticmethod
    async def _run_bandit(target_dir: str) -> List[Dict[str, Any]]:
        findings = []
        try:
            proc = await asyncio.create_subprocess_exec(
                "bandit",
                "-r",
                target_dir,
                "-f",
                "json",
                "-x",
                "./node_modules,./dist,./.venv",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=30.0)
            data = json.loads(stdout.decode("utf-8", errors="ignore"))
            for item in data.get("results", []):
                findings.append({
                    "tool": "Bandit AST",
                    "title": f"[{item.get('test_id', 'B')}] {item.get('issue_text', 'Security issue')}",
                    "description": f"{item.get('issue_text')} - Severity: {item.get('issue_severity')}, Confidence: {item.get('issue_confidence')}",
                    "file_path": item.get("filename", "").replace(os.path.abspath(target_dir) + "/", ""),
                    "line_number": item.get("line_number"),
                    "code_snippet": item.get("code", "").strip(),
                    "severity": item.get("issue_severity", "MEDIUM").lower(),
                    "confidence": item.get("issue_confidence", "HIGH").lower(),
                    "ai_suggested_fix": f"Replace insecure call with safe alternative. Refer to Bandit rule {item.get('test_id')}.",
                })
        except Exception as e:
            logger.debug(f"Bandit run note: {e}")
        return findings

    @staticmethod
    async def _run_semgrep(target_dir: str) -> List[Dict[str, Any]]:
        findings = []
        try:
            proc = await asyncio.create_subprocess_exec(
                "semgrep",
                "scan",
                "--config=p/security-audit",
                "--json",
                "--timeout=25",
                target_dir,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=35.0)
            data = json.loads(stdout.decode("utf-8", errors="ignore"))
            for item in data.get("results", []):
                extra = item.get("extra", {})
                findings.append({
                    "tool": "Semgrep SAST",
                    "title": item.get("check_id", "Semgrep Rule Flagged").split(".")[-1],
                    "description": extra.get("message", "Semgrep security finding"),
                    "file_path": item.get("path", ""),
                    "line_number": item.get("start", {}).get("line"),
                    "code_snippet": extra.get("lines", "").strip(),
                    "severity": extra.get("severity", "WARNING").lower().replace("warning", "medium").replace("error", "high"),
                    "confidence": "high",
                    "ai_suggested_fix": extra.get("metadata", {}).get("fix", "Review Semgrep security guidelines for this rule."),
                })
        except Exception as e:
            logger.debug(f"Semgrep run note: {e}")
        return findings

    @staticmethod
    async def _run_secret_scanner(target_dir: str) -> List[Dict[str, Any]]:
        findings = []
        secret_patterns = [
            (r"(?i)(api[_-]?key|apikey|secret[_-]?key|jwt[_-]?secret|private[_-]?key)\s*[:=]\s*['\"]([a-zA-Z0-9_\-\.]{16,})['\"]", "Exposed Secret / API Key", "critical"),
            (r"bearer\s+eyJ[a-zA-Z0-9_\-]+\.eyJ[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+", "Hardcoded JWT Token", "high"),
            (r"(?i)(postgres|mysql|mongodb|redis):\/\/[a-zA-Z0-9_\-]+:[a-zA-Z0-9_\-]+@", "Database Credentials in Connection String", "critical"),
            (r"-----BEGIN (RSA|EC|DSA|OPENSSH) PRIVATE KEY-----", "Hardcoded Private Cryptographic Key", "critical"),
        ]

        for root, dirs, files in os.walk(target_dir):
            if any(ign in root for ign in ["node_modules", ".git", ".venv", "dist", "__pycache__", ".pytest_cache"]):
                continue
            for fname in files:
                if fname.endswith((".py", ".ts", ".tsx", ".js", ".jsx", ".env", ".json", ".yml", ".yaml")):
                    fpath = os.path.join(root, fname)
                    relpath = os.path.relpath(fpath, target_dir)
                    if relpath.startswith(".env.example"):
                        continue
                    try:
                        with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                            lines = f.readlines()
                            for line_no, line in enumerate(lines, 1):
                                for pattern, title, severity in secret_patterns:
                                    if re.search(pattern, line):
                                        findings.append({
                                            "tool": "Fixora Secret Analyzer",
                                            "title": title,
                                            "description": f"Potential high-entropy credential or secret detected in {fname}.",
                                            "file_path": relpath,
                                            "line_number": line_no,
                                            "code_snippet": line.strip()[:100],
                                            "severity": severity,
                                            "confidence": "high",
                                            "ai_suggested_fix": "Extract credential to server-side environment variables (.env) and add file to .gitignore.",
                                        })
                    except Exception:
                        pass
        return findings
