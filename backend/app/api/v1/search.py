"""Search endpoints for FairFare API v1.

Handles flight searches, journey results, and user search history.
All flight data is simulated realistic Indian airline data.
"""

from datetime import date, datetime, timedelta, timezone
import logging
from typing import List, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import RateLimitDep, get_optional_user
from app.schemas.flight import FlightSegmentSchema, JourneySchema
from app.schemas.search import (
    SearchHistoryItem,
    SearchRequestCreate,
    SearchRequestResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter()

# Fixed simulated search identifier for consistent lookups
DEMO_SEARCH_ID = UUID("10000000-0000-0000-0000-000000000001")


def _generate_mock_journeys(
    origin: str = "DEL",
    destination: str = "BOM",
    travel_date: Optional[date] = None,
) -> List[JourneySchema]:
    """Generate 10 realistic Indian flight journeys with accurate timings and prices."""
    base_date = travel_date or (date.today() + timedelta(days=7))

    journey_specs = [
        {
            "id": UUID("10000000-0000-0000-0001-000000000001"),
            "airline_code": "6E",
            "airline_name": "IndiGo",
            "flight_number": "6E-2001",
            "aircraft_type": "Airbus A321neo",
            "dep_hour": 6,
            "dep_min": 15,
            "arr_hour": 8,
            "arr_min": 25,
            "duration": 130,
            "price_paise": 385000,  # ₹3,850.00
            "stops": 0,
        },
        {
            "id": UUID("10000000-0000-0000-0001-000000000002"),
            "airline_code": "QP",
            "airline_name": "Akasa Air",
            "flight_number": "QP-1102",
            "aircraft_type": "Boeing 737 MAX 8",
            "dep_hour": 7,
            "dep_min": 45,
            "arr_hour": 10,
            "arr_min": 0,
            "duration": 135,
            "price_paise": 362000,  # ₹3,620.00 (Cheapest)
            "stops": 0,
        },
        {
            "id": UUID("10000000-0000-0000-0001-000000000003"),
            "airline_code": "AI",
            "airline_name": "Air India",
            "flight_number": "AI-865",
            "aircraft_type": "Boeing 787-8 Dreamliner",
            "dep_hour": 9,
            "dep_min": 30,
            "arr_hour": 11,
            "arr_min": 50,
            "duration": 140,
            "price_paise": 490000,  # ₹4,900.00
            "stops": 0,
        },
        {
            "id": UUID("10000000-0000-0000-0001-000000000004"),
            "airline_code": "6E",
            "airline_name": "IndiGo",
            "flight_number": "6E-5318",
            "aircraft_type": "Airbus A320neo",
            "dep_hour": 11,
            "dep_min": 15,
            "arr_hour": 13,
            "arr_min": 30,
            "duration": 135,
            "price_paise": 420000,  # ₹4,200.00
            "stops": 0,
        },
        {
            "id": UUID("10000000-0000-0000-0001-000000000005"),
            "airline_code": "SG",
            "airline_name": "SpiceJet",
            "flight_number": "SG-8169",
            "aircraft_type": "Boeing 737-800",
            "dep_hour": 14,
            "dep_min": 0,
            "arr_hour": 16,
            "arr_min": 15,
            "duration": 135,
            "price_paise": 375000,  # ₹3,750.00
            "stops": 0,
        },
        {
            "id": UUID("10000000-0000-0000-0001-000000000006"),
            "airline_code": "AI",
            "airline_name": "Air India",
            "flight_number": "AI-678",
            "aircraft_type": "Airbus A320neo",
            "dep_hour": 15,
            "dep_min": 45,
            "arr_hour": 18,
            "arr_min": 0,
            "duration": 135,
            "price_paise": 475000,  # ₹4,750.00
            "stops": 0,
        },
        {
            "id": UUID("10000000-0000-0000-0001-000000000007"),
            "airline_code": "UK",
            "airline_name": "Vistara",
            "flight_number": "UK-955",
            "aircraft_type": "Airbus A321neo",
            "dep_hour": 17,
            "dep_min": 45,
            "arr_hour": 20,
            "arr_min": 0,
            "duration": 135,
            "price_paise": 560000,  # ₹5,600.00
            "stops": 0,
        },
        {
            "id": UUID("10000000-0000-0000-0001-000000000008"),
            "airline_code": "SG",
            "airline_name": "SpiceJet",
            "flight_number": "SG-8709",
            "aircraft_type": "Boeing 737-800",
            "dep_hour": 18,
            "dep_min": 30,
            "arr_hour": 20,
            "arr_min": 50,
            "duration": 140,
            "price_paise": 395000,  # ₹3,950.00
            "stops": 0,
        },
        {
            "id": UUID("10000000-0000-0000-0001-000000000009"),
            "airline_code": "QP",
            "airline_name": "Akasa Air",
            "flight_number": "QP-1301",
            "aircraft_type": "Boeing 737 MAX 8",
            "dep_hour": 20,
            "dep_min": 30,
            "arr_hour": 22,
            "arr_min": 45,
            "duration": 135,
            "price_paise": 380000,  # ₹3,800.00
            "stops": 0,
        },
        {
            "id": UUID("10000000-0000-0000-0001-000000000010"),
            "airline_code": "6E",
            "airline_name": "IndiGo",
            "flight_number": "6E-2055",
            "aircraft_type": "Airbus A321neo",
            "dep_hour": 21,
            "dep_min": 45,
            "arr_hour": 23,
            "arr_min": 55,
            "duration": 130,
            "price_paise": 410000,  # ₹4,100.00
            "stops": 0,
        },
    ]

    journeys: List[JourneySchema] = []
    for spec in journey_specs:
        dep_time = datetime(
            base_date.year,
            base_date.month,
            base_date.day,
            spec["dep_hour"],
            spec["dep_min"],
            tzinfo=timezone.utc,
        )
        arr_time = datetime(
            base_date.year,
            base_date.month,
            base_date.day,
            spec["arr_hour"],
            spec["arr_min"],
            tzinfo=timezone.utc,
        )

        segment = FlightSegmentSchema(
            flight_number=spec["flight_number"],
            airline_code=spec["airline_code"],
            airline_name=spec["airline_name"],
            aircraft_type=spec["aircraft_type"],
            departure_airport=origin,
            departure_time=dep_time,
            arrival_airport=destination,
            arrival_time=arr_time,
            duration_minutes=spec["duration"],
            cabin_class="economy",
        )

        journeys.append(
            JourneySchema(
                id=spec["id"],
                airline_code=spec["airline_code"],
                airline_name=spec["airline_name"],
                departure_airport=origin,
                arrival_airport=destination,
                departure_time=dep_time,
                arrival_time=arr_time,
                duration_minutes=spec["duration"],
                stops=spec["stops"],
                segments=[segment],
                cheapest_price_paise=spec["price_paise"],
            )
        )

    return journeys


# In-memory store of simulated active searches
_active_searches: dict[UUID, dict] = {}


@router.post(
    "",
    response_model=SearchRequestResponse,
    status_code=status.HTTP_200_OK,
    summary="Initiate flight search",
    description="Submit flight search parameters to trigger multi-supplier metasearch. Returns search ID.",
    dependencies=[Depends(RateLimitDep(requests_per_minute=60))],
)
async def create_search(
    request: SearchRequestCreate,
    current_user=Depends(get_optional_user),
) -> SearchRequestResponse:
    """Initiate a flight search across Indian suppliers and airlines."""
    logger.info(
        "Search initiated: %s -> %s on %s by %s",
        request.origin,
        request.destination,
        request.departure_date,
        getattr(current_user, "email", "anonymous"),
    )

    search_id = uuid4()
    now = datetime.now(timezone.utc)

    # Store search query parameters in memory for subsequent results retrieval
    _active_searches[search_id] = {
        "id": search_id,
        "origin": request.origin,
        "destination": request.destination,
        "departure_date": request.departure_date,
        "return_date": request.return_date,
        "adults": request.adults,
        "cabin_class": request.cabin_class,
        "trip_type": request.trip_type,
        "created_at": now,
        "status": "completed",
        "result_count": 10,
    }

    return SearchRequestResponse(
        id=search_id,
        status="completed",
        created_at=now,
        result_count=10,
        origin=request.origin,
        destination=request.destination,
        departure_date=request.departure_date,
        return_date=request.return_date,
        adults=request.adults,
        cabin_class=request.cabin_class,
        trip_type=request.trip_type,
    )


@router.get(
    "/history",
    response_model=List[SearchHistoryItem],
    summary="Get user search history",
    description="Retrieve recent search queries performed by the user or sample history.",
)
async def get_search_history(
    current_user=Depends(get_optional_user),
) -> List[SearchHistoryItem]:
    """Return 5 realistic simulated flight search history records."""
    now = datetime.now(timezone.utc)
    today = date.today()

    return [
        SearchHistoryItem(
            id=UUID("20000000-0000-0000-0000-000000000001"),
            origin="DEL",
            destination="BOM",
            departure_date=today + timedelta(days=5),
            created_at=now - timedelta(hours=2),
            result_count=10,
            trip_type="one_way",
            cabin_class="economy",
        ),
        SearchHistoryItem(
            id=UUID("20000000-0000-0000-0000-000000000002"),
            origin="BOM",
            destination="BLR",
            departure_date=today + timedelta(days=12),
            created_at=now - timedelta(days=1),
            result_count=8,
            trip_type="one_way",
            cabin_class="economy",
        ),
        SearchHistoryItem(
            id=UUID("20000000-0000-0000-0000-000000000003"),
            origin="DEL",
            destination="BLR",
            departure_date=today + timedelta(days=18),
            return_date=today + timedelta(days=22),
            created_at=now - timedelta(days=2),
            result_count=10,
            trip_type="round_trip",
            cabin_class="economy",
        ),
        SearchHistoryItem(
            id=UUID("20000000-0000-0000-0000-000000000004"),
            origin="DEL",
            destination="GOI",
            departure_date=today + timedelta(days=30),
            created_at=now - timedelta(days=4),
            result_count=7,
            trip_type="one_way",
            cabin_class="economy",
        ),
        SearchHistoryItem(
            id=UUID("20000000-0000-0000-0000-000000000005"),
            origin="BOM",
            destination="HYD",
            departure_date=today + timedelta(days=8),
            created_at=now - timedelta(days=6),
            result_count=9,
            trip_type="one_way",
            cabin_class="economy",
        ),
    ]


@router.get(
    "/{search_id}/results",
    response_model=List[JourneySchema],
    summary="Get search journey results",
    description="Retrieve aggregated flight journey results for a specific search ID.",
)
async def get_search_results(
    search_id: UUID,
    sort_by: Optional[str] = Query(default="price", description="Sort by: price, duration, departure"),
) -> List[JourneySchema]:
    """Retrieve 10 simulated Indian airline flight options for the given search query."""
    search_info = _active_searches.get(search_id)
    origin = search_info["origin"] if search_info else "DEL"
    destination = search_info["destination"] if search_info else "BOM"
    dep_date = search_info["departure_date"] if search_info else (date.today() + timedelta(days=7))

    journeys = _generate_mock_journeys(origin=origin, destination=destination, travel_date=dep_date)

    if sort_by == "duration":
        journeys.sort(key=lambda j: j.duration_minutes)
    elif sort_by == "departure":
        journeys.sort(key=lambda j: j.departure_time)
    else:  # default price ASC
        journeys.sort(key=lambda j: j.cheapest_price_paise)

    logger.info("Returning %d journey results for search %s", len(journeys), search_id)
    return journeys
