"""Offer and price breakdown schemas for FairFare backend."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, computed_field


def _format_inr(paise: Optional[int]) -> Optional[str]:
    if paise is None:
        return None
    return f"₹{paise / 100:,.2f}"


class PriceBreakdown(BaseModel):
    """Detailed price components for an offer."""

    base_fare_paise: int = Field(..., description="Base fare in paise")
    taxes_paise: int = Field(..., description="Applicable taxes in paise")
    fees_paise: int = Field(default=0, description="Convenience / surcharge fees in paise")
    total_price_paise: int = Field(..., description="Total payable price in paise")
    currency: str = Field(default="INR", description="Currency ISO code")

    @computed_field
    @property
    def base_fare_display(self) -> str:
        """Formatted base fare display."""
        return _format_inr(self.base_fare_paise) or "₹0.00"

    @computed_field
    @property
    def taxes_display(self) -> str:
        """Formatted taxes display."""
        return _format_inr(self.taxes_paise) or "₹0.00"

    @computed_field
    @property
    def fees_display(self) -> str:
        """Formatted fees display."""
        return _format_inr(self.fees_paise) or "₹0.00"

    @computed_field
    @property
    def total_price_display(self) -> str:
        """Formatted total price display."""
        return _format_inr(self.total_price_paise) or "₹0.00"

    model_config = ConfigDict(from_attributes=True)


class OfferSchema(BaseModel):
    """Specific fare offer provided by a supplier/OTA for a journey."""

    id: UUID = Field(..., description="Unique offer identifier")
    supplier_name: str = Field(..., description="Supplier / OTA name, e.g. Cleartrip")
    supplier_code: str = Field(..., description="Supplier code, e.g. cleartrip")
    supplier_trust_score: float = Field(..., description="Trust score (0.0 - 1.0)")
    price: PriceBreakdown = Field(..., description="Itemized price breakdown")
    cabin_class: str = Field(default="economy", description="Cabin class")
    fare_class: Optional[str] = Field(default=None, description="Fare tier name")
    baggage_allowance: Optional[str] = Field(
        default=None,
        description="Baggage allowance details",
    )
    is_refundable: bool = Field(default=False, description="Whether fare is refundable")
    cancellation_fee_paise: Optional[int] = Field(
        default=None,
        description="Cancellation fee in paise if refundable",
    )
    change_fee_paise: Optional[int] = Field(
        default=None,
        description="Date change fee in paise",
    )
    meal_included: bool = Field(default=False, description="Whether complimentary meal is included")
    seat_selection_included: bool = Field(
        default=False,
        description="Whether free seat selection is included",
    )
    verification_status: str = Field(
        default="unverified",
        description="Price verification status: verified, unverified, price_changed, expired",
    )
    last_verified_at: Optional[datetime] = Field(
        default=None,
        description="Timestamp of most recent real-time verification",
    )
    booking_url: Optional[str] = Field(
        default=None,
        description="Direct deep-link URL to supplier booking page",
    )

    @computed_field
    @property
    def cancellation_fee_display(self) -> Optional[str]:
        """Formatted cancellation fee."""
        return _format_inr(self.cancellation_fee_paise)

    @computed_field
    @property
    def change_fee_display(self) -> Optional[str]:
        """Formatted change fee."""
        return _format_inr(self.change_fee_paise)

    model_config = ConfigDict(from_attributes=True)


class OfferListResponse(BaseModel):
    """Response containing offers for a journey with highlighted recommendations."""

    offers: List[OfferSchema] = Field(
        default_factory=list,
        description="All available offers sorted by price",
    )
    cheapest_offer: Optional[OfferSchema] = Field(
        default=None,
        description="Cheapest available offer across all suppliers",
    )
    cheapest_trusted_offer: Optional[OfferSchema] = Field(
        default=None,
        description="Cheapest offer among verified trusted suppliers",
    )

    model_config = ConfigDict(from_attributes=True)


class PriceVerificationResponse(BaseModel):
    """Result of real-time price verification check with the supplier."""

    status: str = Field(..., description="Verification status: verified, price_changed, expired")
    previous_price_paise: int = Field(..., description="Previous known price in paise")
    current_price_paise: int = Field(..., description="Live verified price in paise")
    price_changed: bool = Field(
        default=False,
        description="True if live price differs from stored price",
    )
    change_amount_paise: int = Field(
        default=0,
        description="Difference between current and previous price in paise",
    )

    @computed_field
    @property
    def previous_price_display(self) -> str:
        """Formatted previous price display."""
        return _format_inr(self.previous_price_paise) or "₹0.00"

    @computed_field
    @property
    def current_price_display(self) -> str:
        """Formatted live verified price display."""
        return _format_inr(self.current_price_paise) or "₹0.00"

    @computed_field
    @property
    def change_amount_display(self) -> str:
        """Formatted change amount display with sign indicator."""
        sign = "+" if self.change_amount_paise > 0 else ""
        return f"{sign}{_format_inr(self.change_amount_paise) or '₹0.00'}"

    model_config = ConfigDict(from_attributes=True)
