"""Supplier schemas for FairFare backend."""

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class SupplierSchema(BaseModel):
    """Base supplier schema representing an OTA or airline direct provider."""

    id: UUID = Field(..., description="Unique supplier identifier")
    name: str = Field(..., description="Display name of supplier (e.g. Cleartrip)")
    code: str = Field(..., description="Identifier code (e.g. cleartrip)")
    supplier_type: str = Field(
        default="ota",
        description="Type of supplier: ota, airline_direct, aggregator",
    )
    is_active: bool = Field(default=True, description="Whether supplier is actively queried")
    is_trusted: bool = Field(
        default=True,
        description="Whether supplier has high integrity rating",
    )
    trust_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Supplier trust score between 0.0 and 1.0",
    )

    model_config = ConfigDict(from_attributes=True)


class SupplierDetailSchema(SupplierSchema):
    """Detailed supplier performance and integration metadata."""

    api_status: str = Field(
        default="online",
        description="Operational status: online, degraded, offline",
    )
    avg_response_time_ms: int = Field(
        default=0,
        description="Average API response latency in milliseconds",
    )
    success_rate: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
        description="Recent API request success rate (0.0 - 1.0)",
    )
    terms_url: Optional[str] = Field(default=None, description="URL to supplier terms of service")
    website_url: Optional[str] = Field(default=None, description="Official supplier homepage URL")
    logo_url: Optional[str] = Field(default=None, description="Supplier logo asset URL")

    model_config = ConfigDict(from_attributes=True)


class SupplierTermsSchema(BaseModel):
    """Supplier policy and terms information for transparent disclosure."""

    supplier_name: str = Field(..., description="Supplier name")
    terms_url: str = Field(..., description="URL to terms of service")
    data_usage_policy: Optional[str] = Field(
        default=None,
        description="Summary of data usage and privacy policy",
    )
    last_updated: datetime = Field(
        default_factory=_utc_now,
        description="Timestamp when terms were last verified",
    )

    model_config = ConfigDict(from_attributes=True)
