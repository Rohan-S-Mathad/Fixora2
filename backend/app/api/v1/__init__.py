from fastapi import APIRouter
from backend.app.api.v1.auth import router as auth_router
from backend.app.api.v1.projects import router as projects_router
from backend.app.api.v1.issues import router as issues_router
from backend.app.api.v1.comments import router as comments_router
from backend.app.api.v1.audit import router as audit_router
from backend.app.api.v1.sprints import router as sprints_router
from backend.app.api.v1.security import router as security_router
from backend.app.api.v1.ai import router as ai_router
from backend.app.api.v1.notifications import router as notifications_router
from backend.app.api.v1.dashboard import router as dashboard_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(projects_router, prefix="/projects", tags=["projects"])
api_router.include_router(issues_router, prefix="/issues", tags=["issues"])
api_router.include_router(comments_router, tags=["comments"])
api_router.include_router(audit_router, tags=["audit"])
api_router.include_router(sprints_router, prefix="/sprints", tags=["sprints"])
api_router.include_router(security_router, prefix="/security", tags=["security"])
api_router.include_router(ai_router, prefix="/ai", tags=["ai"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["notifications"])
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["dashboard"])
