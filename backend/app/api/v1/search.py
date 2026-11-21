"""Search endpoints for FairFare API v1.

Handles flight searches, journey results, and user search history.
Supports dynamic route-specific flight generation across 75+ Indian and international airports.
"""

from datetime import date, datetime, timedelta, timezone
import hashlib
import logging
from typing import Any, Dict, List, Optional
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


def _get_route_profile(origin: str, destination: str) -> Dict[str, Any]:
    """Calculate realistic flight parameters based on airport pair."""
    intl_long = {"LHR", "CDG", "FRA", "AMS", "ZRH", "JFK", "SFO", "ORD", "LAX", "YYZ", "SYD", "MEL"}
    intl_mid = {"DXB", "AUH", "DOH", "SIN", "BKK", "KUL", "HKG", "NRT", "ICN"}
    intl_short = {"CMB", "DAC", "KTM", "MLE"}

    is_origin_intl_long = origin in intl_long
    is_dest_intl_long = destination in intl_long
    is_origin_intl_mid = origin in intl_mid
    is_dest_intl_mid = destination in intl_mid
    is_origin_intl_short = origin in intl_short
    is_dest_intl_short = destination in intl_short

    # Europe / North America / Australia
    if is_origin_intl_long or is_dest_intl_long:
        if "JFK" in (origin, destination) or "SFO" in (origin, destination) or "LAX" in (origin, destination) or "ORD" in (origin, destination):
            return {
                "base_duration": 940, # ~15h 40m
                "base_price_paise": 6800000, # ₹68,000
                "airlines": [
                    ("AI", "Air India", "Boeing 777-300ER"),
                    ("EK", "Emirates", "Airbus A380-800"),
                    ("QR", "Qatar Airways", "Airbus A350-1000"),
                    ("BA", "British Airways", "Boeing 787-9"),
                ],
            }
        return {
            "base_duration": 550, # ~9h 10m
            "base_price_paise": 4400000, # ₹44,000
            "airlines": [
                ("AI", "Air India", "Boeing 787-8 Dreamliner"),
                ("BA", "British Airways", "Boeing 777-200ER"),
                ("EK", "Emirates", "Boeing 777-300ER"),
                ("QR", "Qatar Airways", "Airbus A350-900"),
                ("LH", "Lufthansa", "Airbus A350-900"),
            ],
        }

    # Middle East / Southeast Asia / East Asia
    if is_origin_intl_mid or is_dest_intl_mid:
        if "DXB" in (origin, destination) or "AUH" in (origin, destination) or "DOH" in (origin, destination):
            return {
                "base_duration": 235, # ~3h 55m
                "base_price_paise": 1650000, # ₹16,500
                "airlines": [
                    ("EK", "Emirates", "Boeing 777-300ER"),
                    ("6E", "IndiGo", "Airbus A321neo"),
                    ("AI", "Air India", "Airbus A320neo"),
                    ("QR", "Qatar Airways", "Boeing 787-8"),
                ],
            }
        return {
            "base_duration": 270, # ~4h 30m
            "base_price_paise": 1950000, # ₹19,500
            "airlines": [
                ("SQ", "Singapore Airlines", "Airbus A350-900"),
                ("6E", "IndiGo", "Airbus A321neo"),
                ("AI", "Air India", "Airbus A320neo"),
                ("TG", "Thai Airways", "Boeing 787-8"),
            ],
        }

    # Neighboring International (Sri Lanka, Nepal, Maldives)
    if is_origin_intl_short or is_dest_intl_short:
        return {
            "base_duration": 150,
            "base_price_paise": 1200000, # ₹12,000
            "airlines": [
                ("6E", "IndiGo", "Airbus A320neo"),
                ("AI", "Air India", "Airbus A320neo"),
                ("UL", "SriLankan Airlines", "Airbus A321neo"),
            ],
        }

    # Domestic short routes (e.g., MAA-BLR, BOM-GOI, DEL-JAI, etc.)
    short_pairs = {
        ("MAA", "BLR"), ("BLR", "MAA"),
        ("BOM", "GOI"), ("GOI", "BOM"),
        ("BOM", "PNQ"), ("PNQ", "BOM"),
        ("DEL", "JAI"), ("JAI", "DEL"),
        ("DEL", "IXC"), ("IXC", "DEL"),
        ("BLR", "HYD"), ("HYD", "BLR"),
        ("MAA", "CJB"), ("CJB", "MAA"),
        ("BOM", "AMD"), ("AMD", "BOM"),
    }
    if (origin, destination) in short_pairs:
        return {
            "base_duration": 65, # ~1h 05m
            "base_price_paise": 295000, # ₹2,950
            "airlines": [
                ("6E", "IndiGo", "Airbus A320neo"),
                ("QP", "Akasa Air", "Boeing 737 MAX 8"),
                ("AI", "Air India", "Airbus A320neo"),
                ("SG", "SpiceJet", "Boeing 737-800"),
            ],
        }

    # Domestic long routes (e.g. MAA-DEL, BLR-DEL, TRV-DEL, etc.)
    long_domestic_pairs = {
        ("MAA", "DEL"), ("DEL", "MAA"),
        ("BLR", "DEL"), ("DEL", "BLR"),
        ("CCU", "BOM"), ("BOM", "CCU"),
        ("TRV", "DEL"), ("DEL", "TRV"),
        ("COK", "DEL"), ("DEL", "COK"),
        ("GAU", "DEL"), ("DEL", "GAU"),
        ("SXR", "BOM"), ("BOM", "SXR"),
    }
    if (origin, destination) in long_domestic_pairs:
        return {
            "base_duration": 165, # ~2h 45m
            "base_price_paise": 485000, # ₹4,850
            "airlines": [
                ("6E", "IndiGo", "Airbus A321neo"),
                ("AI", "Air India", "Airbus A320neo"),
                ("UK", "Vistara", "Airbus A321neo"),
                ("QP", "Akasa Air", "Boeing 737 MAX 8"),
                ("SG", "SpiceJet", "Boeing 737-800"),
            ],
        }

    # Standard Domestic medium routes (e.g. DEL-BOM, BOM-BLR, etc.)
    return {
        "base_duration": 130, # ~2h 10m
        "base_price_paise": 385000, # ₹3,850
        "airlines": [
            ("6E", "IndiGo", "Airbus A321neo"),
            ("QP", "Akasa Air", "Boeing 737 MAX 8"),
            ("AI", "Air India", "Airbus A320neo"),
            ("UK", "Vistara", "Airbus A321neo"),
            ("SG", "SpiceJet", "Boeing 737-800"),
        ],
    }


def _generate_mock_journeys(
    origin: str = "MAA",
    destination: str = "DEL",
    travel_date: Optional[date] = None,
) -> List[JourneySchema]:
    """Generate 10 realistic flight journeys with accurate timings and prices for the route."""
    base_date = travel_date or (date.today() + timedelta(days=7))
    profile = _get_route_profile(origin, destination)
    base_duration = profile["base_duration"]
    base_price = profile["base_price_paise"]
    airlines = profile["airlines"]

    departure_slots = [
        (6, 0, 0, 0.98),    # 06:00, non-stop, early saver
        (7, 30, 0, 0.92),   # 07:30, non-stop, popular morning
        (9, 15, 0, 1.05),   # 09:15, non-stop, business peak
        (11, 30, 0, 1.00),  # 11:30, non-stop
        (13, 45, 1, 0.88),  # 13:45, 1-stop (cheaper option)
        (15, 15, 0, 1.02),  # 15:15, non-stop, afternoon
        (17, 30, 0, 1.15),  # 17:30, evening peak
        (19, 0, 0, 1.08),   # 19:00, evening
        (20, 45, 0, 0.95),  # 20:45, night
        (22, 30, 0, 0.89),  # 22:30, late night cheapest
    ]

    journeys: List[JourneySchema] = []

    for i, (dep_h, dep_m, stops, price_mult) in enumerate(departure_slots):
        airline_code, airline_name, aircraft = airlines[i % len(airlines)]

        # Unique deterministic flight number
        num_seed = int(hashlib.md5(f"{origin}{destination}{airline_code}{i}".encode()).hexdigest()[:4], 16) % 900 + 100
        flight_number = f"{airline_code}-{num_seed}"

        # Duration adjusts if 1-stop
        actual_duration = base_duration if stops == 0 else (base_duration + 85)

        dep_time = datetime(
            base_date.year,
            base_date.month,
            base_date.day,
            dep_h,
            dep_m,
            tzinfo=timezone.utc,
        )
        arr_time = dep_time + timedelta(minutes=actual_duration)

        calculated_price = int(base_price * price_mult)

        segment = FlightSegmentSchema(
            flight_number=flight_number,
            airline_code=airline_code,
            airline_name=airline_name,
            aircraft_type=aircraft,
            departure_airport=origin,
            departure_time=dep_time,
            arrival_airport=destination,
            arrival_time=arr_time,
            duration_minutes=actual_duration,
            cabin_class="economy",
        )

        journey_id = UUID(f"10000000-0000-0000-0001-{i+1:012d}")

        journeys.append(
            JourneySchema(
                id=journey_id,
                airline_code=airline_code,
                airline_name=airline_name,
                departure_airport=origin,
                arrival_airport=destination,
                departure_time=dep_time,
                arrival_time=arr_time,
                duration_minutes=actual_duration,
                stops=stops,
                segments=[segment],
                cheapest_price_paise=calculated_price,
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
        "origin": request.origin.upper().strip(),
        "destination": request.destination.upper().strip(),
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
        origin=request.origin.upper().strip(),
        destination=request.destination.upper().strip(),
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
    """Return realistic flight search history records."""
    now = datetime.now(timezone.utc)
    today = date.today()

    return [
        SearchHistoryItem(
            id=UUID("20000000-0000-0000-0000-000000000001"),
            origin="MAA",
            destination="DEL",
            departure_date=today + timedelta(days=5),
            created_at=now - timedelta(hours=1),
            result_count=10,
            trip_type="round_trip",
            cabin_class="economy",
        ),
        SearchHistoryItem(
            id=UUID("20000000-0000-0000-0000-000000000002"),
            origin="DEL",
            destination="BOM",
            departure_date=today + timedelta(days=7),
            created_at=now - timedelta(hours=3),
            result_count=10,
            trip_type="one_way",
            cabin_class="economy",
        ),
        SearchHistoryItem(
            id=UUID("20000000-0000-0000-0000-000000000003"),
            origin="BLR",
            destination="DXB",
            departure_date=today + timedelta(days=14),
            created_at=now - timedelta(days=1),
            result_count=8,
            trip_type="round_trip",
            cabin_class="economy",
        ),
        SearchHistoryItem(
            id=UUID("20000000-0000-0000-0000-000000000004"),
            origin="BOM",
            destination="GOI",
            departure_date=today + timedelta(days=20),
            created_at=now - timedelta(days=3),
            result_count=10,
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
    """Retrieve simulated airline flight options for the given search query."""
    search_info = _active_searches.get(search_id)
    origin = search_info["origin"] if search_info else "MAA"
    destination = search_info["destination"] if search_info else "DEL"
    dep_date = search_info["departure_date"] if search_info else (date.today() + timedelta(days=7))

    journeys = _generate_mock_journeys(origin=origin, destination=destination, travel_date=dep_date)

    if sort_by == "duration":
        journeys.sort(key=lambda j: j.duration_minutes)
    elif sort_by == "departure":
        journeys.sort(key=lambda j: j.departure_time)
    else:  # default price ASC
        journeys.sort(key=lambda j: j.cheapest_price_paise)

    logger.info("Returning %d journey results for route %s -> %s", len(journeys), origin, destination)
    return journeys
