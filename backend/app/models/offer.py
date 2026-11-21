import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any, Dict, List, Optional

from sqlalchemy import (
    JSON,
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.search import Journey
    from app.models.supplier import Supplier


class FareProduct(Base):
    """Normalized fare offer from a supplier for a journey (prices stored in paise)."""

    __tablename__ = "fare_products"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    journey_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("journeys.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    supplier_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("suppliers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    base_fare_paise: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
    )
    taxes_paise: Mapped[int] = mapped_column(
        BigInteger,
        default=0,
        nullable=False,
    )
    fees_paise: Mapped[int] = mapped_column(
        BigInteger,
        default=0,
        nullable=False,
    )
    total_price_paise: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
        index=True,
    )
    currency: Mapped[str] = mapped_column(
        String(3),
        default="INR",
        nullable=False,
    )
    cabin_class: Mapped[str] = mapped_column(
        String(50),
        default="economy",
        nullable=False,
    )
    fare_class: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    baggage_allowance: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    is_refundable: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    cancellation_fee_paise: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        nullable=True,
    )
    change_fee_paise: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        nullable=True,
    )
    meal_included: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    seat_selection_included: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    last_verified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    verification_status: Mapped[str] = mapped_column(
        String(50),
        default="unverified",
        nullable=False,
    )
    booking_url: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    # Relationships
    journey: Mapped["Journey"] = relationship(
        "Journey",
        back_populates="fare_products",
    )
    supplier: Mapped["Supplier"] = relationship(
        "Supplier",
        back_populates="fare_products",
    )
    supplier_offers: Mapped[List["SupplierOffer"]] = relationship(
        "SupplierOffer",
        back_populates="fare_product",
        cascade="all, delete-orphan",
    )
    price_history: Mapped[List["PriceHistory"]] = relationship(
        "PriceHistory",
        back_populates="fare_product",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return (
            f"<FareProduct(id={self.id}, total_price_paise={self.total_price_paise}, "
            f"currency='{self.currency}', status='{self.verification_status}')>"
        )


class SupplierOffer(Base):
    """Raw supplier-level quote and metadata linking to normalized fare."""

    __tablename__ = "supplier_offers"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    fare_product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("fare_products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    supplier_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("suppliers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    supplier_price_paise: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
    )
    supplier_currency: Mapped[str] = mapped_column(
        String(3),
        default="INR",
        nullable=False,
    )
    raw_response: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
    )
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    latency_ms: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )

    # Relationships
    fare_product: Mapped["FareProduct"] = relationship(
        "FareProduct",
        back_populates="supplier_offers",
    )
    supplier: Mapped["Supplier"] = relationship(
        "Supplier",
        back_populates="supplier_offers",
    )

    def __repr__(self) -> str:
        return (
            f"<SupplierOffer(id={self.id}, price_paise={self.supplier_price_paise}, "
            f"latency_ms={self.latency_ms})>"
        )


class PriceHistory(Base):
    """Historical price snapshots for fare trending and prediction."""

    __tablename__ = "price_history"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    fare_product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("fare_products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    price_paise: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
        index=True,
    )
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )
    source: Mapped[str] = mapped_column(
        String(100),
        default="metasearch_scan",
        nullable=False,
    )

    # Relationships
    fare_product: Mapped["FareProduct"] = relationship(
        "FareProduct",
        back_populates="price_history",
    )

    def __repr__(self) -> str:
        return (
            f"<PriceHistory(id={self.id}, fare_product_id={self.fare_product_id}, "
            f"price_paise={self.price_paise}, recorded_at='{self.recorded_at}')>"
        )
