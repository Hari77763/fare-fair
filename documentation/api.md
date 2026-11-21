# FareFair API Documentation (v1)

Base URL: `http://localhost:8000/api/v1`

---

## Endpoints Summary

### System Health
- **`GET /health`**
  - Returns service status, version, and environment.

### Flight Search
- **`POST /api/v1/search`**
  - Submits a flight search request and fans out to suppliers.
  - **Payload:**
    ```json
    {
      "origin": "DEL",
      "destination": "BOM",
      "departure_date": "2026-12-15",
      "return_date": null,
      "adults": 1,
      "cabin_class": "economy"
    }
    ```
  - **Response (200 OK):**
    Returns search identifier, supplier status summary, and canonical journeys.

- **`GET /api/v1/search/{search_id}/results`**
  - Retrieves paginated journeys for a search query.

### Flight Detail & Multi-Supplier Offers
- **`GET /api/v1/flights/{journey_id}`**
  - Returns journey segments, aircraft information, and all seller offers sorted by price.

- **`GET /api/v1/flights/{journey_id}/offers`**
  - Returns raw offers from all OTAs and airlines for the specified journey.

- **`POST /api/v1/flights/{offer_id}/verify`**
  - Triggers a real-time pre-booking price revalidation with the supplier.
  - **Response (200 OK):**
    ```json
    {
      "offer_id": "30000000-0000-0000-0001-000000000001",
      "status": "verified",
      "confirmed_price_paise": 385000,
      "price_changed": false,
      "revalidated_at": "2026-11-21T17:10:02Z"
    }
    ```

### Suppliers & Trust Ratings
- **`GET /api/v1/suppliers`**
  - Lists all connected suppliers, their trust scores, latency, and status.

- **`GET /api/v1/suppliers/{supplier_id}`**
  - Detailed supplier trust breakdown and terms of service URL.

### Airports Reference Data
- **`GET /api/v1/airports/search?query=DEL`**
  - Autocomplete search across 60+ Indian and international airports.

- **`GET /api/v1/airports/popular`**
  - Lists top Indian metro hubs (DEL, BOM, BLR, HYD, MAA, CCU, GOI).

### Price Alerts
- **`GET /api/v1/alerts`**
  - Lists user's active price alerts.
- **`POST /api/v1/alerts`**
  - Creates a new price tracker for a route and target fare.

### Authentication
- **`POST /api/v1/auth/login`**
  - Authenticates user credentials and issues JWT Bearer tokens.
- **`POST /api/v1/auth/register`**
  - Creates a new user profile.
