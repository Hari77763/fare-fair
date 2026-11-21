"""Supplier integration and transparency endpoints for FairFare API v1.

Provides supplier information, trust scores, performance metrics, and terms disclosure.
"""

from datetime import datetime, timezone
import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.schemas.supplier import (
    SupplierDetailSchema,
    SupplierSchema,
    SupplierTermsSchema,
)

logger = logging.getLogger(__name__)

router = APIRouter()

# Fixed suppliers database matching production Indian OTAs and aggregators
_SUPPLIERS_DB: dict[UUID, dict] = {
    UUID("40000000-0000-0000-0000-000000000001"): {
        "id": UUID("40000000-0000-0000-0000-000000000001"),
        "name": "Google Flights",
        "code": "google_flights",
        "supplier_type": "aggregator",
        "is_active": True,
        "is_trusted": True,
        "trust_score": 0.92,
        "api_status": "online",
        "avg_response_time_ms": 320,
        "success_rate": 0.998,
        "terms_url": "https://www.google.com/travel/flights/terms",
        "website_url": "https://www.google.com/travel/flights",
        "logo_url": "https://assets.fairfare.in/suppliers/google.svg",
        "data_policy": "FairFare queries Google Flights partner endpoints. No user PII is shared during search query execution.",
    },
    UUID("40000000-0000-0000-0000-000000000002"): {
        "id": UUID("40000000-0000-0000-0000-000000000002"),
        "name": "Cleartrip",
        "code": "cleartrip",
        "supplier_type": "ota",
        "is_active": True,
        "is_trusted": True,
        "trust_score": 0.90,
        "api_status": "online",
        "avg_response_time_ms": 480,
        "success_rate": 0.992,
        "terms_url": "https://www.cleartrip.com/terms",
        "website_url": "https://www.cleartrip.com",
        "logo_url": "https://assets.fairfare.in/suppliers/cleartrip.svg",
        "data_policy": "Direct OTA integration via XML API. Real-time availability verified before redirecting user for booking.",
    },
    UUID("40000000-0000-0000-0000-000000000003"): {
        "id": UUID("40000000-0000-0000-0000-000000000003"),
        "name": "MakeMyTrip",
        "code": "makemytrip",
        "supplier_type": "ota",
        "is_active": True,
        "is_trusted": True,
        "trust_score": 0.88,
        "api_status": "online",
        "avg_response_time_ms": 550,
        "success_rate": 0.989,
        "terms_url": "https://www.makemytrip.com/legal/user_agreement.html",
        "website_url": "https://www.makemytrip.com",
        "logo_url": "https://assets.fairfare.in/suppliers/mmt.svg",
        "data_policy": "Fares fetched via certified affiliate integration. Convenience fees disclosed up-front.",
    },
    UUID("40000000-0000-0000-0000-000000000004"): {
        "id": UUID("40000000-0000-0000-0000-000000000004"),
        "name": "ixigo",
        "code": "ixigo",
        "supplier_type": "ota",
        "is_active": True,
        "is_trusted": True,
        "trust_score": 0.85,
        "api_status": "online",
        "avg_response_time_ms": 410,
        "success_rate": 0.985,
        "terms_url": "https://www.ixigo.com/about/terms-conditions/",
        "website_url": "https://www.ixigo.com",
        "logo_url": "https://assets.fairfare.in/suppliers/ixigo.svg",
        "data_policy": "Meta API query. Transparent breakdown of instant bank discounts and base fares provided.",
    },
    UUID("40000000-0000-0000-0000-000000000005"): {
        "id": UUID("40000000-0000-0000-0000-000000000005"),
        "name": "Yatra",
        "code": "yatra",
        "supplier_type": "ota",
        "is_active": True,
        "is_trusted": True,
        "trust_score": 0.82,
        "api_status": "online",
        "avg_response_time_ms": 620,
        "success_rate": 0.978,
        "terms_url": "https://www.yatra.com/content/terms-and-conditions",
        "website_url": "https://www.yatra.com",
        "logo_url": "https://assets.fairfare.in/suppliers/yatra.svg",
        "data_policy": "Direct booking redirection with deep link passing route parameters and cabin selections.",
    },
    UUID("40000000-0000-0000-0000-000000000006"): {
        "id": UUID("40000000-0000-0000-0000-000000000006"),
        "name": "EaseMyTrip",
        "code": "easemytrip",
        "supplier_type": "ota",
        "is_active": True,
        "is_trusted": True,
        "trust_score": 0.80,
        "api_status": "online",
        "avg_response_time_ms": 510,
        "success_rate": 0.982,
        "terms_url": "https://www.easemytrip.com/terms.html",
        "website_url": "https://www.easemytrip.com",
        "logo_url": "https://assets.fairfare.in/suppliers/emt.svg",
        "data_policy": "Zero convenience fee policy monitored. Real-time fare confirmation on direct booking page.",
    },
    UUID("40000000-0000-0000-0000-000000000007"): {
        "id": UUID("40000000-0000-0000-0000-000000000007"),
        "name": "Skyscanner",
        "code": "skyscanner",
        "supplier_type": "aggregator",
        "is_active": True,
        "is_trusted": False,
        "trust_score": 0.78,
        "api_status": "online",
        "avg_response_time_ms": 780,
        "success_rate": 0.971,
        "terms_url": "https://www.skyscanner.co.in/terms-and-conditions",
        "website_url": "https://www.skyscanner.co.in",
        "logo_url": "https://assets.fairfare.in/suppliers/skyscanner.svg",
        "data_policy": "Global aggregator feeds utilized for cross-verification of international codeshare inventory.",
    },
}


@router.get(
    "",
    response_model=List[SupplierSchema],
    summary="List all integrated flight suppliers",
    description="Retrieve flight suppliers and OTAs with their integrity ratings and trust scores.",
)
async def list_suppliers() -> List[SupplierSchema]:
    """Return all suppliers supported by FairFare sorted by trust score."""
    suppliers = [
        SupplierSchema(
            id=s["id"],
            name=s["name"],
            code=s["code"],
            supplier_type=s["supplier_type"],
            is_active=s["is_active"],
            is_trusted=s["is_trusted"],
            trust_score=s["trust_score"],
        )
        for s in _SUPPLIERS_DB.values()
    ]
    # Sort descending by trust score
    suppliers.sort(key=lambda s: s.trust_score, reverse=True)
    logger.info("Returning %d suppliers", len(suppliers))
    return suppliers


@router.get(
    "/{supplier_id}",
    response_model=SupplierDetailSchema,
    summary="Get supplier details and health metrics",
    description="Retrieve supplier operational status, latency, success rate, and policies.",
)
async def get_supplier_detail(
    supplier_id: UUID,
) -> SupplierDetailSchema:
    """Return detailed performance and integration metadata for a supplier."""
    supplier = _SUPPLIERS_DB.get(supplier_id)
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Supplier with ID {supplier_id} not found",
        )

    return SupplierDetailSchema(
        id=supplier["id"],
        name=supplier["name"],
        code=supplier["code"],
        supplier_type=supplier["supplier_type"],
        is_active=supplier["is_active"],
        is_trusted=supplier["is_trusted"],
        trust_score=supplier["trust_score"],
        api_status=supplier["api_status"],
        avg_response_time_ms=supplier["avg_response_time_ms"],
        success_rate=supplier["success_rate"],
        terms_url=supplier["terms_url"],
        website_url=supplier["website_url"],
        logo_url=supplier["logo_url"],
    )


@router.get(
    "/{supplier_id}/terms",
    response_model=SupplierTermsSchema,
    summary="Get supplier terms and data policy",
    description="Retrieve supplier terms of service link, privacy guidelines, and booking conditions.",
)
async def get_supplier_terms(
    supplier_id: UUID,
) -> SupplierTermsSchema:
    """Return terms of service and data policy disclosure for a supplier."""
    supplier = _SUPPLIERS_DB.get(supplier_id)
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Supplier with ID {supplier_id} not found",
        )

    return SupplierTermsSchema(
        supplier_name=supplier["name"],
        terms_url=supplier["terms_url"],
        data_usage_policy=supplier["data_policy"],
        last_updated=datetime.now(timezone.utc),
    )
