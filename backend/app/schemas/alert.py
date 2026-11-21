"""Price alert schemas for FairFare backend."""

from datetime import date, datetime, timezone
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator, model_validator


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _format_inr(paise: Optional[int]) -> Optional[str]:
    if paise is None:
        return None
    return f"₹{paise / 100:,.2f}"


class AlertCreate(BaseModel):
    """Schema for creating a new flight price alert."""

    origin: str = Field(
        ...,
        min_length=3,
        max_length=3,
        description="3-letter IATA origin airport code",
    )
    destination: str = Field(
        ...,
        min_length=3,
        max_length=3,
        description="3-letter IATA destination airport code",
    )
    departure_date: date = Field(..., description="Departure date to monitor")
    return_date: Optional[date] = Field(
        default=None,
        description="Optional return date for round trips",
    )
    target_price_paise: int = Field(
        ...,
        gt=0,
        description="Target price threshold in paise (must be > 0)",
    )
    cabin_class: Literal["economy", "premium_economy", "business", "first"] = Field(
        default="economy",
        description="Cabin class",
    )

    @field_validator("origin", "destination")
    @classmethod
    def uppercase_code(cls, v: str) -> str:
        code = v.strip().upper()
        if not code.isalpha() or len(code) != 3:
            raise ValueError("Airport code must be exactly 3 alphabetic characters")
        return code

    @field_validator("departure_date")
    @classmethod
    def validate_departure_date(cls, v: date) -> date:
        if v < date.today():
            raise ValueError("Departure date cannot be in the past")
        return v

    @model_validator(mode="after")
    def validate_route_and_dates(self) -> "AlertCreate":
        if self.origin == self.destination:
            raise ValueError("Origin and destination airports must be different")
        if self.return_date is not None and self.return_date <= self.departure_date:
            raise ValueError("Return date must be strictly after departure date")
        return self

    model_config = ConfigDict(from_attributes=True)


class AlertUpdate(BaseModel):
    """Schema for modifying an existing flight price alert."""

    target_price_paise: Optional[int] = Field(
        default=None,
        gt=0,
        description="Updated target price in paise",
    )
    is_active: Optional[bool] = Field(
        default=None,
        description="Activate or deactivate the alert",
    )

    model_config = ConfigDict(from_attributes=True)


class AlertResponse(BaseModel):
    """Schema representing a price alert record with computed display prices."""

    id: UUID = Field(..., description="Unique alert identifier")
    origin: str = Field(..., description="Origin airport code")
    destination: str = Field(..., description="Destination airport code")
    departure_date: date = Field(..., description="Departure date")
    return_date: Optional[date] = Field(default=None, description="Return date if set")
    target_price_paise: int = Field(..., description="Target threshold in paise")
    current_lowest_paise: Optional[int] = Field(
        default=None,
        description="Current lowest observed price in paise",
    )
    cabin_class: str = Field(default="economy", description="Cabin class")
    is_active: bool = Field(default=True, description="Whether alert is actively monitored")
    trigger_count: int = Field(
        default=0,
        description="Number of times price dropped below target",
    )
    last_checked_at: Optional[datetime] = Field(
        default=None,
        description="Timestamp of most recent price check",
    )
    created_at: datetime = Field(
        default_factory=_utc_now,
        description="Alert creation timestamp",
    )

    @computed_field
    @property
    def target_price_display(self) -> str:
        """Formatted target price display."""
        return _format_inr(self.target_price_paise) or "₹0.00"

    @computed_field
    @property
    def current_lowest_display(self) -> Optional[str]:
        """Formatted current lowest price display."""
        return _format_inr(self.current_lowest_paise)

    model_config = ConfigDict(from_attributes=True)
