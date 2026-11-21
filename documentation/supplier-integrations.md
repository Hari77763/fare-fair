# Supplier Integration Guide

This document describes how to integrate a new flight inventory supplier (GDS, NDC aggregator, or OTA) into FairFare.

---

## Common Supplier Interface

Every supplier adapter inherits from `FlightSupplier` in `backend/app/suppliers/base.py`:

```python
from abc import ABC, abstractmethod
from typing import List, Optional
from app.schemas.search import SearchRequestCreate
from app.schemas.flight import FlightResult

class FlightSupplier(ABC):
    @abstractmethod
    async def search(self, request: SearchRequestCreate) -> List[dict]:
        """Search supplier inventory asynchronously with individual timeout."""
        pass

    @abstractmethod
    def normalize(self, raw_data: dict) -> FlightResult:
        """Map raw supplier response into FairFare canonical data model."""
        pass

    @abstractmethod
    async def verify_price(self, offer_id: str) -> dict:
        """Revalidate live fare before transferring user to seller checkout."""
        pass

    @abstractmethod
    def get_capabilities(self) -> dict:
        """Return supported capabilities (e.g. NDC, baggage breakdown, seat hold)."""
        pass
```

---

## Onboarding Checklist

1. **Verify Commercial Permissions**:
   - Ensure the partnership agreement explicitly permits displaying prices alongside competitors.
   - Verify caching limits (e.g. Skyscanner data cannot be repackaged; Wego allows max 30 min cache).
2. **Implement Adapter**:
   - Create `backend/app/suppliers/{supplier_name}.py` following `partner_template.py`.
3. **Register Adapter**:
   - Add the new adapter to `SearchOrchestrator` in `backend/app/services/search_orchestrator.py`.
4. **Configure Secrets**:
   - Add API keys and client credentials to `.env`. Never commit secrets to source control.
5. **Run Integration Tests**:
   - Verify error handling during timeouts and upstream HTTP 500 responses.
