"""FairFare API v1 Master Router.

Combines all v1 endpoint routers for search, flights, suppliers, alerts,
authentication, and airport lookups.
"""

from fastapi import APIRouter

from app.api.v1.airports import router as airports_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.auth import router as auth_router
from app.api.v1.flights import router as flights_router
from app.api.v1.search import router as search_router
from app.api.v1.suppliers import router as suppliers_router

api_router = APIRouter()

api_router.include_router(search_router, prefix="/search", tags=["Search"])
api_router.include_router(flights_router, prefix="/flights", tags=["Flights"])
api_router.include_router(suppliers_router, prefix="/suppliers", tags=["Suppliers"])
api_router.include_router(alerts_router, prefix="/alerts", tags=["Alerts"])
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(airports_router, prefix="/airports", tags=["Airports"])
