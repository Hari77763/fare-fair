# FairFare Developer State & Project Notes
**Generated:** 2026-11-21  
**Project:** FairFare — India-First Flight Metasearch Engine

---

## 1. Project Status Summary
- **Backend (FastAPI)**: Fully verified and working. All 8 core endpoints tested cleanly with pure ASGI runner and returning HTTP 200:
  - `GET /health` -> 200
  - `GET /api/v1/airports/search?query=DEL` -> 200 (60+ airports catalog)
  - `GET /api/v1/airports/popular` -> 200
  - `GET /api/v1/suppliers` -> 200 (7 Indian suppliers with reliability scores)
  - `GET /api/v1/flights/{id}` -> 200
  - `GET /api/v1/flights/{id}/offers` -> 200
  - `POST /api/v1/flights/{offer_id}/verify` -> 200 (live revalidation state)
  - `POST /api/v1/search` -> 200 (fan-out mock orchestration)
  - `POST /api/v1/auth/login` -> 200 (JWT bearer generation)
  - `GET /api/v1/alerts` -> 200 (authenticated route trackers)
- **Frontend (Next.js 14 App Router)**: Fully implemented according to user-selected **Design #2 (Fluttertop aesthetic)**:
  - Warm sunset-gradient hero with airplane backdrop
  - Floating white search widget with airport autocomplete, dates, and passengers
  - Two independent ranking tabs: **Absolute Cheapest** and **Cheapest Trusted**
  - Itemized transparent fee breakdown modals ($P_{total} = P_{base} + P_{tax} + P_{fees}$)
  - Pages built: `page.tsx`, `search/page.tsx`, `flights/[id]/page.tsx`, `price-alerts/page.tsx`, `dashboard/page.tsx`, `about/page.tsx`, `how-it-works/page.tsx`, `privacy/page.tsx`, `terms/page.tsx`
  - Components built: `navbar.tsx`, `footer.tsx`, `search-widget.tsx`, `airport-autocomplete.tsx`, `passenger-selector.tsx`, `flight-card.tsx`, `price-breakdown-modal.tsx`, `flight-filters.tsx`, `supplier-trust-badge.tsx`, `features-section.tsx`, `popular-routes.tsx`, `airline-logos.tsx`
- **Database**: PostgreSQL initial schema with integer paise, UTC timestamps, and seed files for airports, airlines, and suppliers.
- **Infrastructure & Docs**: Docker Compose, Dockerfiles, `.env.example`, `architecture.md`, `api.md`, `supplier-integrations.md`, and `README.md`.

---

## 2. Key Architecture Locks
1. **Zero Scraping**: Only authorized API endpoints and commercial feeds are supported.
2. **Zero Paid Ranking**: Sellers cannot pay for sponsored placement above cheaper eligible options.
3. **Integer Paise**: All monetary values are handled in minor units (paise) to prevent IEEE 754 floating point errors.
4. **Resilient Python Environment**: `backend/app/core/config.py`, `database.py`, and `security.py` have built-in fallbacks to standard library/PyJWT so they work both locally and in full production Docker.

---

## 3. How to Run & Verify
- **Backend**:
  ```bash
  cd backend
  python -m uvicorn main:app --reload --port 8000
  ```
- **Frontend**:
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
