# FareFair (India-First Flight Metasearch Engine)

FareFair is an independent, multi-supplier flight metasearch platform covering Indian domestic flights and international flights departing from India.

Inspired by clean, minimalist travel design, FareFair provides complete fare transparency, zero platform fees, and two independent price rankings: **Absolute Cheapest** and **Cheapest Trusted**.

---

## Key Features

1. **Fluttertop-Inspired Minimalist Interface**:
   - Modern floating search card with instant airport autocomplete, date selection, and passenger selector.
   - Clean, high-legibility typography with warm sunset sky accents.
2. **Two Independent Price Rankings**:
   - **Absolute Cheapest**: Price-first lowest available offer.
   - **Cheapest Trusted**: Lowest offer from providers scoring $\ge 85\%$ on our independent trust model.
3. **Transparent Price Breakdown**:
   - Every fare itemizes: Base Fare + Mandatory Airport Taxes (UDF/PSF) + Supplier Convenience Fees.
   - **0% FareFair markup** guaranteed.
4. **Multi-Supplier Architecture**:
   - Concurrent asynchronous fan-out across GDS (Amadeus/Travelport) and Indian OTAs (MakeMyTrip, Cleartrip, EaseMyTrip, ixigo).
5. **DGCA 2026 Compliance**:
   - Upfront disclosure of statutory tax refund eligibility under updated Indian civil aviation regulations.
6. **Smart Price Alerts & Dashboard**:
   - Custom target price trackers with historical price trends.

---

## Project Structure

```
farefair/
├── frontend/               # Next.js 14 App Router, Tailwind CSS, Lucide icons
│   └── src/
│       ├── app/            # Pages: Home, Search, Flights, Price Alerts, Dashboard, About, How It Works
│       ├── components/     # Reusable flight cards, filters, search widgets, trust badges
│       └── lib/            # Types, utilities, and simulated Indian flight data
│
├── backend/                # Python FastAPI Asynchronous Metasearch Engine
│   ├── app/
│   │   ├── api/v1/         # Search, Flights, Suppliers, Alerts, Auth, Airports
│   │   ├── core/           # Config, Security, Database session
│   │   ├── services/       # Orchestrator, Normalizer, Ranking, Price Verification
│   │   └── suppliers/      # Supplier adapter pattern (Amadeus, Mock, Templates)
│   └── main.py             # FastAPI entrypoint
│
├── documentation/          # Architecture, API specifications, and supplier integration guides
├── database/               # PostgreSQL schema migrations and initial reference seeds
└── infrastructure/         # Docker Compose and Dockerfile configurations
```

---

## Quickstart Guide

### 1. Run Backend (FastAPI)

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
python -m uvicorn main:app --reload --port 8000
```
- API Docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`
- Development login (non-production only): `user@fairfare.in` / `demo12345`
- `JWT_SECRET_KEY` may be left empty in development (a random key is generated per process). It is **required** when `ENV=production`; the API refuses to start without it.

### 2. Run Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser. The web app currently runs entirely on bundled demo data and does not call the backend.

### 3. Checks

```bash
cd backend && python -m pytest -q          # API + auth regression tests
cd frontend && npm test                     # Vitest unit tests
cd frontend && npm run lint && npm run typecheck && npm run build
```

---

## Deployment (Vercel)

The deployable web app is the Next.js project in `frontend/`.

- **Root Directory:** `frontend`
- **Framework preset:** Next.js (auto-detected) — default build (`next build`) and output settings
- **Environment variables:** none required (no secrets are used by the frontend)

The FastAPI backend is not deployed to Vercel; it needs PostgreSQL and Redis and is intended for container hosting (see `infrastructure/docker`).

---

## License

Built for transparent flight discovery across India and beyond.
