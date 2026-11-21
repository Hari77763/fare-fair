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
python -m uvicorn main:app --reload --port 8000
```
- API Docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### 2. Run Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## License

Built for transparent flight discovery across India and beyond.
