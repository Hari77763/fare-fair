# FareFair — Flight Metasearch Architecture

FareFair is an independent, India-first, multi-supplier flight metasearch platform designed to search hundreds of legitimate airlines, OTAs, and authorised ticketing providers with transparent total pricing and zero platform markup.

---

## 1. Core Architectural Principle

> **FareFair owns the search, comparison, ranking, and price-transparency experience.**  
> **Suppliers provide the underlying flight inventory, schedules, and fare data.**

We do not pretend to hold airline seats or sell tickets directly. All bookings occur directly on the authorized provider's website via secure deep-linking after price revalidation.

---

## 2. System High-Level Topology

```
┌─────────────────────────────────────────────────────────────┐
│                 Frontend (Next.js 14 App Router)            │
│         Minimalist, Responsive UI (Fluttertop Aesthetic)    │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON REST API
┌──────────────────────────────▼──────────────────────────────┐
│                    FastAPI Metasearch Backend               │
│  - Concurrent Fan-out Orchestrator with Supplier Timeouts   │
│  - Journey & Fare-Product Deduplication Engine (SHA-256)   │
│  - Total Payable Formula: P_total = P_base + P_tax + P_fees │
│  - Two Rankings: Absolute Cheapest vs Cheapest Trusted      │
│  - Live Verification State Machine (Verified/Refresh/Stale) │
└──────────┬───────────────────┬───────────────────┬──────────┘
           │                   │                   │
  ┌────────▼────────┐ ┌────────▼────────┐ ┌────────▼────────┐
  │ Amadeus GDS/NDC │ │ Travelport API  │ │ Indian OTAs     │
  │ Quick Connect   │ │ Universal API   │ │ MMT, Cleartrip, │
  │                 │ │                 │ │ EaseMyTrip, etc │
  └─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## 3. Key Components & Implementation Details

### A. Concurrent Supplier Fan-Out
- Each search request fans out asynchronously across connected suppliers using `asyncio.gather`.
- Individual per-supplier timeouts (default 15s) ensure slow suppliers never block the response.
- Circuit breaker pattern flags repeatedly failing supplier endpoints.

### B. Canonical Deduplication & Journey Fingerprinting
To avoid displaying the same physical flight multiple times:
1. **Journey Fingerprint**: A deterministic SHA-256 hash of ordered flight segments:
   - Origin and destination IATA codes
   - Departure and arrival UTC timestamps
   - Operating carrier and flight number
2. **Fare-Product Fingerprint**: Distinguishes basic non-baggage fares from flexible baggage-inclusive fares.
3. **Seller Offers**: Attached to the canonical journey with itemized taxes and mandatory supplier fees.

### C. The Two Rankings
1. **Absolute Cheapest**:
   Lowest known total price across all connected suppliers regardless of commercial status.
2. **Cheapest Trusted**:
   Filtered to providers achieving a Trust Reliability Score $\ge 85\%$.

### D. Provider Reliability Score Formulation
Weighted evaluation based on measurable operational criteria:
- **Historical Price Accuracy**: 30%
- **Successful Booking / Referral Completion**: 25%
- **Dispute & Complaint Rate**: 20%
- **Refund & Support Performance**: 15% (including DGCA 2026 refund compliance)
- **Supplier Identity & Licensing**: 10%

---

## 4. Indian Aviation & DGCA 2026 Compliance

Under the Directorate General of Civil Aviation (DGCA) revised framework:
- Mandatory reversal of User Development Fee (UDF) and Passenger Service Fee (PSF) upon cancellation.
- Upfront disclosure of airline cancellation schedules and OTA convenience fees prior to user redirection.
- Strict adherence to official data feeds without unauthorised screen scraping.
