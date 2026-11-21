import uuid
from datetime import date, datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Date, DateTime, ForeignKey, Index, Integer, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.offer import FareProduct
    from app.models.supplier import SupplierAPILog


class SearchRequest(Base):
    """Flight search request initiated by a user or guest."""

    __tablename__ = "search_requests"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
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
    passengers_adults: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )
    passengers_children: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    passengers_infants: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    cabin_class: Mapped[str] = mapped_column(
        String(50),
        default="economy",
        nullable=False,
    )
    trip_type: Mapped[str] = mapped_column(
        String(50),
        default="one_way",
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(50),
        default="pending",
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    user: Mapped[Optional["User"]] = relationship(
        "User",
        back_populates="searches",
    )
    journeys: Mapped[List["Journey"]] = relationship(
        "Journey",
        back_populates="search_request",
        cascade="all, delete-orphan",
    )
    api_logs: Mapped[List["SupplierAPILog"]] = relationship(
        "SupplierAPILog",
        back_populates="search_request",
    )

    def __repr__(self) -> str:
        return (
            f"<SearchRequest(id={self.id}, route='{self.origin_code}->{self.destination_code}', "
            f"dept='{self.departure_date}', status='{self.status}')>"
        )


class Journey(Base):
    """A unique flight itinerary (combination of airline, times, and routing) matching a search."""

    __tablename__ = "journeys"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    search_request_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("search_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    airline_code: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        index=True,
    )
    airline_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    departure_airport: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
        index=True,
    )
    arrival_airport: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
        index=True,
    )
    departure_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )
    arrival_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    duration_minutes: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    stops: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    journey_fingerprint: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )

    # Relationships
    search_request: Mapped["SearchRequest"] = relationship(
        "SearchRequest",
        back_populates="journeys",
    )
    segments: Mapped[List["FlightSegment"]] = relationship(
        "FlightSegment",
        back_populates="journey",
        cascade="all, delete-orphan",
        order_by="FlightSegment.segment_order",
    )
    fare_products: Mapped[List["FareProduct"]] = relationship(
        "FareProduct",
        back_populates="journey",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return (
            f"<Journey(id={self.id}, airline='{self.airline_code}', "
            f"route='{self.departure_airport}->{self.arrival_airport}', stops={self.stops})>"
        )


class FlightSegment(Base):
    """An individual flight leg within a journey."""

    __tablename__ = "flight_segments"

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
    segment_order: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    flight_number: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )
    airline_code: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
    )
    aircraft_type: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    departure_airport: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
    )
    arrival_airport: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
    )
    departure_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    arrival_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    duration_minutes: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    cabin_class: Mapped[str] = mapped_column(
        String(50),
        default="economy",
        nullable=False,
    )

    # Relationships
    journey: Mapped["Journey"] = relationship(
        "Journey",
        back_populates="segments",
    )

    def __repr__(self) -> str:
        return (
            f"<FlightSegment(id={self.id}, order={self.segment_order}, "
            f"flight='{self.airline_code}{self.flight_number}', "
            f"route='{self.departure_airport}->{self.arrival_airport}')>"
        )
