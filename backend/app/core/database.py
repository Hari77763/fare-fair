"""Async SQLAlchemy Database Session, Engine, and Model Base configuration.

Configures connection pooling, async sessionmaker, declarative base, and dependency injection.
"""

from collections.abc import AsyncGenerator
import logging
from typing import Any

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

logger = logging.getLogger(__name__)

# Asynchronous SQLAlchemy Engine
try:
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=(settings.ENV == "development" and settings.DEBUG),
        future=True,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )

    # Asynchronous Session Factory
    AsyncSessionLocal = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )
except Exception as e:
    logger.warning("Could not initialize async DB engine (%s). Running with simulated in-memory store.", e)
    engine = None
    AsyncSessionLocal = None


class Base(DeclarativeBase):
    """Base declarative class for all SQLAlchemy 2.0 ORM models in FairFare."""

    def dict(self) -> dict[str, Any]:
        """Convert model instance attributes to dictionary."""
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}


async def get_db() -> AsyncGenerator[Any, None]:
    """Dependency for providing an asynchronous database session per request.

    Ensures transactions are safely committed or rolled back and sessions closed.
    """
    if AsyncSessionLocal is None:
        yield None
        return

    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as exc:
            await session.rollback()
            logger.error("Database session rollback due to exception: %s", exc)
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database tables defined in SQLAlchemy models metadata."""
    if engine is None:
        logger.info("Database engine not configured; skipping DDL execution.")
        return
    logger.info("Initializing database schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database schema initialized successfully.")


async def close_db() -> None:
    """Close and dispose all active database engine connections."""
    if engine is None:
        return
    logger.info("Closing database engine connections...")
    await engine.dispose()
    logger.info("Database engine connections closed.")
