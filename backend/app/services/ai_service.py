import json
import logging
import os
from typing import List, Optional
from backend.app.core.config import settings
from backend.app.schemas.ai import (
    AIBugAnalysisRequest,
    AIBugAnalysisResponse,
    AIPatchGenerateRequest,
    AIPatchGenerateResponse,
    AISecurityTriageRequest,
    AISecurityTriageResponse,
)

logger = logging.getLogger("fixora.ai")


def get_genai_client():
    api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    try:
        from google import genai
        return genai.Client(api_key=api_key)
    except Exception as e:
        logger.error(f"Failed to initialize Google GenAI client: {e}")
        return None


class AIService:
    @staticmethod
    async def analyze_bug(request: AIBugAnalysisRequest) -> AIBugAnalysisResponse:
        client = get_genai_client()

        if client:
            prompt = f"""You are Fixora AI, an expert software engineering and triage model.
Analyze the following bug report, log trace, or issue description:

Project ID: {request.project_id}
Component Hint: {request.component or 'General'}
Environment: {request.environment or 'Production'}
Report:
\"\"\"{request.bug_description}\"\"\"

Reproduction hints: {request.reproduction_steps or 'None provided'}
Code Context / Stack Trace: {request.code_context or 'None provided'}

Respond strictly with a single, valid JSON object (without markdown fences or with ```json fences) containing the following fields:
- "title": (string) Concise, professional issue title (e.g., "Fix: NullPointerException in AuthInterceptor when token is expired")
- "severity": (string) Exactly one of "critical", "high", "medium", "low"
- "priority": (string) Exactly one of "urgent", "high", "medium", "low"
- "component": (string) The specific software module / layer (e.g. "Authentication", "Database Layer", "API Gateway", "Frontend UI", "Cache")
- "labels": (array of strings) 2 to 5 relevant tags (e.g. ["security", "auth", "backend"])
- "reproduction_steps": (string) Step-by-step reproduction instructions
- "root_cause": (string) Precise technical explanation of why this bug or vulnerability occurs
- "suggested_fix": (string) Actionable engineering remediation steps
- "patch": (string or null) A unified git diff patch (--- a/... +++ b/...) if code context allows generating a concrete fix
- "confidence": (string) Human-readable confidence assessment (e.g. "High (95%)", "Medium (80%)")
"""
            try:
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                )
                text = response.text or ""
                # Strip markdown code blocks if wrapped
                cleaned = text.strip()
                if cleaned.startswith("```"):
                    lines = cleaned.split("\n")
                    if lines[0].startswith("```"):
                        lines = lines[1:]
                    if lines and lines[-1].startswith("```"):
                        lines = lines[:-1]
                    cleaned = "\n".join(lines).strip()

                data = json.loads(cleaned)
                return AIBugAnalysisResponse(
                    title=data.get("title", f"Bug: {request.bug_description[:60]}"),
                    severity=data.get("severity", "medium").lower(),
                    priority=data.get("priority", "medium").lower(),
                    component=data.get("component", request.component or "General"),
                    labels=data.get("labels", ["ai-triage"]),
                    reproduction_steps=data.get("reproduction_steps", "1. Trigger the reported condition\n2. Observe failure"),
                    suggested_fix=data.get("suggested_fix", "Review defensive checks and add test coverage."),
                    root_cause=data.get("root_cause", "Uncaught exception under edge conditions."),
                    confidence=data.get("confidence", "High (Gemini 2.5)"),
                    patch=data.get("patch"),
                    model_used="gemini-2.5-flash",
                )
            except Exception as e:
                logger.error(f"Gemini API analysis failed: {e}", exc_info=True)
                # Fall back to offline analytical parser

        # Fallback offline deterministic analyzer when GEMINI_API_KEY is not set
        desc = request.bug_description.lower()
        severity = "medium"
        priority = "medium"
        labels: List[str] = ["ai-analyzed"]

        if any(w in desc for w in ["crash", "segfault", "panic", "nullpointer", "fatal", "vulnerability", "sql injection", "rce", "cve", "auth bypass", "token leak"]):
            severity = "critical"
            priority = "urgent"
            labels.extend(["security", "critical-bug"])
        elif any(w in desc for w in ["error 500", "broken", "unhandled", "exception", "failed to load", "data loss", "timeout"]):
            severity = "high"
            priority = "high"
            labels.extend(["backend", "stability"])
        elif any(w in desc for w in ["typo", "alignment", "color", "padding", "margin", "css", "dark mode"]):
            severity = "low"
            priority = "low"
            labels.extend(["ui", "frontend", "styling"])
        elif any(w in desc for w in ["slow", "latency", "memory leak", "leak", "re-render", "performance"]):
            severity = "medium"
            priority = "high"
            labels.extend(["performance", "optimization"])

        component = request.component or "General"
        if any(w in desc for w in ["auth", "login", "jwt", "session", "token", "password"]):
            component = "Authentication"
        elif any(w in desc for w in ["db", "database", "query", "postgres", "sqlite", "sql"]):
            component = "Database Layer"
        elif any(w in desc for w in ["ui", "button", "modal", "input", "css", "react", "view"]):
            component = "UI Components"
        elif any(w in desc for w in ["api", "endpoint", "route", "http", "status 500"]):
            component = "API Gateway"

        raw_words = request.bug_description.strip().split()
        first_line = " ".join(raw_words[:8])
        title = f"Fix: {first_line}..." if len(raw_words) > 8 else f"Fix: {request.bug_description.strip()}"

        reproduction = request.reproduction_steps or (
            f"1. Navigate to the {component} module in the application.\n"
            f"2. Submit the payload or trigger state with parameters triggering '{request.bug_description[:60]}...'\n"
            f"3. Observe the unhandled error response or termination in server logs.\n"
            f"4. Verify absence of defensive exception boundary."
        )

        suggested_fix = (
            f"1. Add input validation and null-safety guards in {component}.\n"
            f"2. Wrap external calls with explicit error handlers.\n"
            f"3. Add automated unit and regression test coverage."
        )

        root_cause = f"Exception or improper state handling in {component} when encountering unexpected inputs: {request.bug_description[:80]}"

        return AIBugAnalysisResponse(
            title=title,
            severity=severity,
            priority=priority,
            component=component,
            labels=list(set(labels)),
            reproduction_steps=reproduction,
            suggested_fix=suggested_fix,
            root_cause=root_cause,
            confidence="Rule-Based (Offline)",
            patch=None,
            model_used="offline-rule-engine",
        )

    @staticmethod
    async def generate_patch(request: AIPatchGenerateRequest) -> AIPatchGenerateResponse:
        client = get_genai_client()
        if client:
            prompt = f"""You are Fixora AI, a senior systems programmer and bug remediation engine.
Given the following code snippet and error report, generate a unified git diff patch (--- a/... +++ b/...) that precisely fixes the defect:

File: {request.file_path or 'src/module.ts'}
Error Message:
\"\"\"{request.error_message}\"\"\"

Bug Description: {request.bug_description or 'Resolve the error and ensure edge cases are handled safely.'}

Code Context:
```
{request.code_context}
```

Return a JSON object containing:
- "patch": (string) The valid unified diff patch (must start with '--- a/' and '+++ b/')
- "explanation": (string) Concise technical explanation of the fix
- "test_case": (string) A unit test validating the fix
"""
            try:
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                )
                text = response.text or ""
                cleaned = text.strip()
                if cleaned.startswith("```"):
                    lines = cleaned.split("\n")
                    if lines[0].startswith("```"):
                        lines = lines[1:]
                    if lines and lines[-1].startswith("```"):
                        lines = lines[:-1]
                    cleaned = "\n".join(lines).strip()
                data = json.loads(cleaned)
                return AIPatchGenerateResponse(
                    patch=data.get("patch", ""),
                    explanation=data.get("explanation", "Patch generated by Fixora Gemini AI."),
                    test_case=data.get("test_case"),
                    model_used="gemini-2.5-flash",
                )
            except Exception as e:
                logger.error(f"Gemini patch generation failed: {e}", exc_info=True)

        # Fallback offline diff template
        target_file = request.file_path or "src/app.py"
        offline_patch = f"""--- a/{target_file}
+++ b/{target_file}
@@ -1,5 +1,7 @@
+# Fixora Defensive Guard: prevent unhandled exception
+if not input_data or input_data is None:
+    raise ValueError("Invalid or empty input parameter provided")
"""
        return AIPatchGenerateResponse(
            patch=offline_patch,
            explanation="Deterministic defensive guard generated in offline mode. Configure GEMINI_API_KEY for dynamic contextual synthesis.",
            test_case=f"def test_{target_file.replace('/', '_').replace('.', '_')}_validation():\n    assert True",
            model_used="offline-diff-engine",
        )

    @staticmethod
    async def triage_security_finding(request: AISecurityTriageRequest) -> AISecurityTriageResponse:
        client = get_genai_client()
        if client:
            prompt = f"""You are Fixora Security AI, a DevSecOps triage specialist.
Triage the following security finding detected by SAST/secret scanner ({request.tool}):

Title: {request.finding_title}
Description: {request.finding_description}
File: {request.file_path or 'Unknown'}
Code Snippet:
```
{request.code_snippet or 'None'}
```

Return JSON with:
- "root_cause": (string) Deep security explanation of the vulnerability and attack vector
- "suggested_fix": (string) Specific remediation steps
- "patch": (string or null) Unified diff patch if applicable
- "severity": (string) One of "critical", "high", "medium", "low"
- "confidence": (string) E.g. "High (96%)"
"""
            try:
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                )
                text = response.text or ""
                cleaned = text.strip()
                if cleaned.startswith("```"):
                    lines = cleaned.split("\n")
                    if lines[0].startswith("```"):
                        lines = lines[1:]
                    if lines and lines[-1].startswith("```"):
                        lines = lines[:-1]
                    cleaned = "\n".join(lines).strip()
                data = json.loads(cleaned)
                return AISecurityTriageResponse(
                    root_cause=data.get("root_cause", request.finding_description),
                    suggested_fix=data.get("suggested_fix", "Sanitize input and enforce principle of least privilege."),
                    patch=data.get("patch"),
                    severity=data.get("severity", "high"),
                    confidence=data.get("confidence", "High (Gemini 2.5)"),
                    model_used="gemini-2.5-flash",
                )
            except Exception as e:
                logger.error(f"Gemini security triage failed: {e}", exc_info=True)

        return AISecurityTriageResponse(
            root_cause=f"Security rule flagged by {request.tool}: {request.finding_description}",
            suggested_fix=f"Review usage in {request.file_path or 'flagged code'} and apply security best practices.",
            patch=None,
            severity="medium",
            confidence="Rule-Based (Offline)",
            model_used="offline-scanner",
        )
