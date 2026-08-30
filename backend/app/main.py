import logging
import time
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.app.api.v1 import api_router
from backend.app.core.config import settings
from backend.app.db.init_db import init_db

# Configure structured logging
logging.basicConfig(
    level=logging.INFO if settings.ENVIRONMENT == "production" else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] [request_id=%(name)s] %(message)s",
)
logger = logging.getLogger("fixora.backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting Fixora API (Environment: {settings.ENVIRONMENT})")
    await init_db()
    yield
    logger.info("Shutting down Fixora API")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Fixora enterprise-grade AI issue tracking, telemetry and AST security scanning API.",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# CORS Setup with strict origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)


@app.middleware("http")
async def add_correlation_id_and_timing(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    start_time = time.time()

    response = await call_next(request)

    process_time = (time.time() - start_time) * 1000
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Response-Time-MS"] = f"{process_time:.2f}"

    if request.url.path not in ["/api/health"]:
        logger.info(
            f"{request.method} {request.url.path} status={response.status_code} duration={process_time:.2f}ms"
        )
    return response


@app.get("/api/health", tags=["health"])
async def health_check():
    return {
        "status": "ok",
        "service": "fixora-backend",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "ai_configured": bool(settings.GEMINI_API_KEY),
        "scanner_enabled": settings.SECURITY_SCANNER_ENABLED,
    }


# Include API v1 routes
app.include_router(api_router, prefix=settings.API_V1_STR)


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {exc}", exc_info=True)
    error_msg = str(exc) if settings.ENVIRONMENT == "development" else "Internal server error"
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": error_msg},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8001, reload=True)
