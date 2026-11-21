import uuid
from datetime import date, datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    BigInteger,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class PriceAlert(Base):
    """User price alert configuration for flight routes."""

    __tablename__ = "price_alerts"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    origin_code: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
        index=True,
    )
    destination_code: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
        index=True,
    )
    departure_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )
    return_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )
    target_price_paise: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
    )
    current_lowest_paise: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        nullable=True,
    )
    cabin_class: Mapped[str] = mapped_column(
        String(50),
        default="economy",
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
    )
    trigger_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    last_triggered_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    last_checked_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
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

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="alerts",
    )

    def __repr__(self) -> str:
        return (
            f"<PriceAlert(id={self.id}, user_id={self.user_id}, "
            f"route='{self.origin_code}->{self.destination_code}', "
            f"target_price_paise={self.target_price_paise}, is_active={self.is_active})>"
        )
