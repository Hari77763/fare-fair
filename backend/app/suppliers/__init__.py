"""FairFare supplier adapters.

This package provides concrete and abstract supplier adapters for flight metasearch
aggregation, including mock suppliers, Amadeus GDS integration, and a partner template.
"""

from app.suppliers.amadeus import AmadeusSupplier
from app.suppliers.base import (
    CircuitBreaker,
    CircuitBreakerOpenError,
    FlightSupplier,
    HealthStatus,
    PriceVerificationResult,
    SupplierConnectionError,
    SupplierError,
    SupplierRateLimitError,
    SupplierTimeoutError,
)
from app.suppliers.mock_supplier import (
    MockBudgetSupplier,
    MockPremiumSupplier,
    MockSupplier,
)
from app.suppliers.partner_template import PartnerTemplateSupplier

__all__ = [
    # Base classes & contracts
    "FlightSupplier",
    "HealthStatus",
    "PriceVerificationResult",
    "CircuitBreaker",
    "SupplierError",
    "SupplierTimeoutError",
    "SupplierRateLimitError",
    "SupplierConnectionError",
    "CircuitBreakerOpenError",
    # Concrete suppliers
    "MockSupplier",
    "MockBudgetSupplier",
    "MockPremiumSupplier",
    "AmadeusSupplier",
    "PartnerTemplateSupplier",
]
