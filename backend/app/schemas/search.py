"""Search schemas for FairFare backend."""

from datetime import date, datetime, timezone
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class SearchRequestCreate(BaseModel):
    """Schema for flight search requests submitted by users."""

    origin: str = Field(
        ...,
        min_length=3,
        max_length=3,
        description="3-letter IATA airport code for origin",
    )
    destination: str = Field(
        ...,
        min_length=3,
        max_length=3,
        description="3-letter IATA airport code for destination",
    )
    departure_date: date = Field(..., description="Date of departure")
    return_date: Optional[date] = Field(
        default=None,
        description="Return date for round-trip searches",
    )
    adults: int = Field(default=1, ge=1, le=9, description="Number of adult passengers (1-9)")
    children: int = Field(default=0, ge=0, le=9, description="Number of child passengers (0-9)")
    infants: int = Field(default=0, ge=0, le=4, description="Number of infant passengers (0-4)")
    cabin_class: Literal["economy", "premium_economy", "business", "first"] = Field(
        default="economy",
        description="Desired cabin class",
    )
    trip_type: Literal["one_way", "round_trip", "multi_city"] = Field(
        default="one_way",
        description="Type of trip",
    )

    @field_validator("origin", "destination")
    @classmethod
    def uppercase_airport_code(cls, v: str) -> str:
        code = v.strip().upper()
        if not code.isalpha() or len(code) != 3:
            raise ValueError("Airport code must be exactly 3 alphabetic characters")
        return code

    @field_validator("departure_date")
    @classmethod
    def departure_date_must_be_current_or_future(cls, v: date) -> date:
        if v < date.today():
            raise ValueError("Departure date cannot be in the past")
        return v

    @model_validator(mode="after")
    def validate_search_parameters(self) -> "SearchRequestCreate":
        if self.origin == self.destination:
            raise ValueError("Origin and destination airports must be different")

        if self.return_date is not None:
            if self.return_date <= self.departure_date:
                raise ValueError("Return date must be strictly after departure date")

        if self.infants > self.adults:
            raise ValueError("Number of infants cannot exceed number of adult passengers")

        return self

    model_config = ConfigDict(from_attributes=True)


class SearchRequestResponse(BaseModel):
    """Schema for search request confirmation returned after initiating search."""

    id: UUID = Field(..., description="Unique search query identifier")
    status: str = Field(default="completed", description="Status of the search query")
    created_at: datetime = Field(
        default_factory=_utc_now,
        description="Timestamp when search was created",
    )
    result_count: int = Field(default=0, description="Total flight journeys found")
    origin: Optional[str] = Field(default=None, description="Origin airport code")
    destination: Optional[str] = Field(default=None, description="Destination airport code")
    departure_date: Optional[date] = Field(default=None, description="Departure date")
    return_date: Optional[date] = Field(default=None, description="Return date if applicable")
    adults: Optional[int] = Field(default=1, description="Adult passengers count")
    cabin_class: Optional[str] = Field(default="economy", description="Cabin class")
    trip_type: Optional[str] = Field(default="one_way", description="Trip type")

    model_config = ConfigDict(from_attributes=True)


class SearchHistoryItem(BaseModel):
    """Summary item for user's past flight searches."""

    id: UUID = Field(..., description="Search identifier")
    origin: str = Field(..., description="Origin airport code")
    destination: str = Field(..., description="Destination airport code")
    departure_date: date = Field(..., description="Departure date")
    created_at: datetime = Field(..., description="Search execution timestamp")
    result_count: int = Field(default=0, description="Number of results found")
    return_date: Optional[date] = Field(default=None, description="Return date if round-trip")
    trip_type: Optional[str] = Field(default="one_way", description="Trip type")
    cabin_class: Optional[str] = Field(default="economy", description="Cabin class")

    model_config = ConfigDict(from_attributes=True)
