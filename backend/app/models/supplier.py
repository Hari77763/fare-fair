import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.offer import FareProduct, SupplierOffer
    from app.models.search import SearchRequest


class Supplier(Base):
    """Airline or OTA supplier integration details and configuration."""

    __tablename__ = "suppliers"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
    )
    code: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )
    supplier_type: Mapped[str] = mapped_column(
        String(50),
        default="ota",
        nullable=False,
    )
    api_base_url: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    is_trusted: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    trust_score: Mapped[float] = mapped_column(
        Float,
        default=1.0,
        nullable=False,
    )
    priority: Mapped[int] = mapped_column(
        Integer,
        default=10,
        nullable=False,
    )
    rate_limit_per_minute: Mapped[int] = mapped_column(
        Integer,
        default=60,
        nullable=False,
    )
    timeout_seconds: Mapped[int] = mapped_column(
        Integer,
        default=15,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    terms_url: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    data_usage_policy: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    # Relationships
    fare_products: Mapped[List["FareProduct"]] = relationship(
        "FareProduct",
        back_populates="supplier",
    )
    supplier_offers: Mapped[List["SupplierOffer"]] = relationship(
        "SupplierOffer",
        back_populates="supplier",
    )
    api_logs: Mapped[List["SupplierAPILog"]] = relationship(
        "SupplierAPILog",
        back_populates="supplier",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return (
            f"<Supplier(id={self.id}, code='{self.code}', name='{self.name}', "
            f"active={self.is_active}, trust={self.trust_score})>"
        )


class SupplierAPILog(Base):
    """Audit log of requests sent to supplier APIs for latency and failure tracking."""

    __tablename__ = "supplier_api_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    supplier_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("suppliers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    request_url: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    request_method: Mapped[str] = mapped_column(
        String(10),
        default="GET",
        nullable=False,
    )
    response_status_code: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )
    response_time_ms: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )
    error_message: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )
    search_request_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("search_requests.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Relationships
    supplier: Mapped["Supplier"] = relationship(
        "Supplier",
        back_populates="api_logs",
    )
    search_request: Mapped[Optional["SearchRequest"]] = relationship(
        "SearchRequest",
        back_populates="api_logs",
    )

    def __repr__(self) -> str:
        return (
            f"<SupplierAPILog(id={self.id}, supplier_id={self.supplier_id}, "
            f"status={self.response_status_code}, time_ms={self.response_time_ms})>"
        )
