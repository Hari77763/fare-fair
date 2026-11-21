"""Flight and journey schemas for FairFare backend."""

from datetime import datetime
from typing import TYPE_CHECKING, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, computed_field

if TYPE_CHECKING:
    from app.schemas.offer import OfferSchema


def _format_inr(paise: Optional[int]) -> Optional[str]:
    if paise is None:
        return None
    return f"₹{paise / 100:,.2f}"


class FlightSegmentSchema(BaseModel):
    """Individual flight leg schema (e.g. DEL -> BOM)."""

    flight_number: str = Field(..., description="Flight number, e.g. 6E-2001")
    airline_code: str = Field(..., description="2-letter IATA airline code, e.g. 6E")
    airline_name: str = Field(..., description="Full airline name, e.g. IndiGo")
    aircraft_type: Optional[str] = Field(default=None, description="Aircraft model name")
    departure_airport: str = Field(..., description="3-letter origin airport code")
    departure_time: datetime = Field(..., description="Departure timestamp (UTC/local)")
    arrival_airport: str = Field(..., description="3-letter destination airport code")
    arrival_time: datetime = Field(..., description="Arrival timestamp (UTC/local)")
    duration_minutes: int = Field(..., description="Segment flight duration in minutes")
    cabin_class: str = Field(default="economy", description="Cabin class")

    model_config = ConfigDict(from_attributes=True)


class JourneySchema(BaseModel):
    """Aggregated flight journey representing a complete route with segments."""

    id: UUID = Field(..., description="Unique journey identifier")
    airline_code: str = Field(..., description="Primary airline IATA code")
    airline_name: str = Field(..., description="Primary airline name")
    departure_airport: str = Field(..., description="Origin airport code")
    arrival_airport: str = Field(..., description="Destination airport code")
    departure_time: datetime = Field(..., description="Journey departure timestamp")
    arrival_time: datetime = Field(..., description="Journey arrival timestamp")
    duration_minutes: int = Field(..., description="Total journey duration in minutes")
    stops: int = Field(default=0, description="Total stops count (0 for nonstop)")
    segments: List[FlightSegmentSchema] = Field(
        default_factory=list,
        description="Individual flight legs comprising journey",
    )
    cheapest_price_paise: int = Field(
        ...,
        description="Lowest available fare for this journey in integer paise",
    )

    @computed_field
    @property
    def cheapest_price_display(self) -> str:
        """Formatted INR display string for lowest fare."""
        return _format_inr(self.cheapest_price_paise) or "₹0.00"

    model_config = ConfigDict(from_attributes=True)


class JourneyDetailSchema(JourneySchema):
    """Detailed journey information including all supplier offers."""

    offers: List["OfferSchema"] = Field(
        default_factory=list,
        description="List of supplier offers available for this journey",
    )

    model_config = ConfigDict(from_attributes=True)


# Rebuild model with OfferSchema reference
from app.schemas.offer import OfferSchema  # noqa: E402

JourneyDetailSchema.model_rebuild()
