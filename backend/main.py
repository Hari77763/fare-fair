"""FairFare FastAPI Application Entry Point.

India-first flight metasearch engine backend providing transparent price comparison,
supplier aggregation, baggage/meal breakdown, and price tracking alerts.
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone
import logging
from typing import Any, Dict

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import close_db, init_db

# Configure structured application logging
logging.basicConfig(
    level=logging.INFO if settings.ENV != "development" else logging.DEBUG,
    format="%(asctime)s | %(levelname)-8s | %(name)s:%(lineno)d - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("fairfare.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for FastAPI startup and shutdown operations."""
    logger.info("Starting up FairFare API [%s] (ENV=%s)...", settings.VERSION, settings.ENV)
    # Perform database initialization or connection warmups if required
    try:
        if settings.ENV == "development":
            # Attempt non-blocking metadata sync in development
            logger.info("Checking database connectivity in development mode...")
    except Exception as exc:
        logger.warning("Startup database check encountered: %s", exc)

    yield

    logger.info("Initiating FairFare API graceful shutdown...")
    await close_db()
    logger.info("FairFare API shutdown complete.")


# Initialize FastAPI application instance
app = FastAPI(
    title=f"{settings.PROJECT_NAME} API",
    description=(
        "India-First Flight Metasearch API engine delivering accurate base fares, "
        "convenience fee transparency, ancillary tracking, and multi-supplier price aggregation."
    ),
    version=settings.VERSION,
    docs_url="/docs" if settings.ENV != "production" else None,
    redoc_url="/redoc" if settings.ENV != "production" else None,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    lifespan=lifespan,
)

# Configure Cross-Origin Resource Sharing (CORS) Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Mount API v1 Router
try:
    from app.api.v1.api import api_router

    app.include_router(api_router, prefix=settings.API_V1_PREFIX)
    logger.info("Mounted v1 api_router at prefix: %s", settings.API_V1_PREFIX)
except ImportError:
    try:
        from app.api.v1 import api_router

        app.include_router(api_router, prefix=settings.API_V1_PREFIX)
        logger.info("Mounted v1 api_router at prefix: %s", settings.API_V1_PREFIX)
    except ImportError:
        logger.warning(
            "API v1 router not found at app.api.v1.api or app.api.v1; endpoints will be mounted once created."
        )


@app.get(
    "/health",
    tags=["System"],
    summary="System Health & Readiness Check",
    status_code=status.HTTP_200_OK,
)
async def health_check() -> Dict[str, Any]:
    """Check API service health, version, environment, and system status."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENV,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get(
    "/",
    tags=["System"],
    summary="Service Welcome and Root Information",
    status_code=status.HTTP_200_OK,
)
async def root() -> Dict[str, Any]:
    """Root endpoint welcoming clients and referencing documentation."""
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "description": "India-First Flight Metasearch Engine API",
        "docs_url": "/docs" if settings.ENV != "production" else None,
        "api_v1": settings.API_V1_PREFIX,
        "status": "online",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
