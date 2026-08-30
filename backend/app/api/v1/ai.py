from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.api.deps import get_current_user, get_db
from backend.app.models.ai_analysis import AIAnalysis
from backend.app.models.user import User
from backend.app.schemas.ai import (
    AIBugAnalysisRequest,
    AIBugAnalysisResponse,
    AIPatchGenerateRequest,
    AIPatchGenerateResponse,
    AISecurityTriageRequest,
    AISecurityTriageResponse,
)
from backend.app.services.ai_service import AIService

router = APIRouter()


@router.post("/analyze-bug", response_model=AIBugAnalysisResponse)
async def analyze_bug(
    request: AIBugAnalysisRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not request.bug_description or len(request.bug_description.strip()) < 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a descriptive bug report for AI analysis",
        )

    analysis_res = await AIService.analyze_bug(request)

    # Persist AI analysis log
    log = AIAnalysis(
        prompt=request.bug_description,
        response_payload=analysis_res.model_dump(),
        model_version=analysis_res.model_used or "gemini-2.5-flash",
    )
    db.add(log)
    await db.commit()

    return analysis_res


@router.post("/generate-patch", response_model=AIPatchGenerateResponse)
async def generate_patch(
    request: AIPatchGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not request.code_context or not request.error_message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Code context and error message are required for patch generation.",
        )

    patch_res = await AIService.generate_patch(request)
    return patch_res


@router.post("/triage-finding", response_model=AISecurityTriageResponse)
async def triage_finding(
    request: AISecurityTriageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    triage_res = await AIService.triage_security_finding(request)
    return triage_res
