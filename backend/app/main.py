from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import logger
from app.db.base import Base
from app.db.session import engine
from app.api.v1.router import api_router
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    logger.info(f"{settings.PROJECT_NAME} Backend successfully started in {settings.ENVIRONMENT} mode.")
    yield
    logger.info(f"Shutting down {settings.PROJECT_NAME}...")

app = FastAPI(
    title="DERMASATHIAI - Clinical Support & Triage API",
    description=(
        "Production-grade multilingual AI healthcare companion backend. "
        "NOTICE: DERMASATHIAI is an assistive system and strictly NOT a replacement for qualified medical doctors."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global safe exception handler: Prevents leaking stack traces or internal secrets to clients
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error on {request.method} {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal service error occurred. Our clinical systems team has been notified.",
            "error_code": "INTERNAL_SERVER_ERROR"
        }
    )

# Mount API v1
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "purpose": "Multilingual AI Healthcare Companion initially focused on Indian users",
        "api_v1_docs": "/docs",
        "health_check": f"{settings.API_V1_STR}/health/status",
        "safety_disclaimer": "This service is an assistive AI tool and does not provide formal medical diagnoses."
    }
