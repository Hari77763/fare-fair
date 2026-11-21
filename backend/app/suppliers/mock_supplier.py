"""Mock Flight Suppliers for FairFare.

Provides synthetic flight search results, price verification, and health monitoring
tailored for Indian domestic aviation routes and airlines. Includes standard,
budget, and premium variations for comprehensive metasearch aggregation testing.
"""

from __future__ import annotations

import asyncio
from datetime import date, datetime, timedelta, timezone
import hashlib
import logging
import random
from typing import Any, Dict, List, Optional, Union
import uuid

from app.suppliers.base import (
    FlightSupplier,
    HealthStatus,
    PriceVerificationResult,
    SupplierConnectionError,
    SupplierError,
)

logger = logging.getLogger(__name__)


# ============================================================================
# Route & Airline Data Constants
# ============================================================================

INDIAN_AIRLINES = [
    {"code": "6E", "name": "IndiGo", "flight_prefix": "6E"},
    {"code": "AI", "name": "Air India", "flight_prefix": "AI"},
    {"code": "SG", "name": "SpiceJet", "flight_prefix": "SG"},
    {"code": "UK", "name": "Vistara", "flight_prefix": "UK"},
    {"code": "QP", "name": "Akasa Air", "flight_prefix": "QP"},
    {"code": "IX", "name": "Air India Express", "flight_prefix": "IX"},
]

AIRCRAFT_TYPES = ["Airbus A320neo", "Boeing 737 MAX 8", "Airbus A321neo", "Boeing 787-8"]

# Realistic flight times for popular Indian domestic city pairs
ROUTE_DURATIONS_MINUTES = {
    ("DEL", "BOM"): 130,
    ("BOM", "DEL"): 130,
    ("BLR", "DEL"): 165,
    ("DEL", "BLR"): 165,
    ("HYD", "BOM"): 95,
    ("BOM", "HYD"): 95,
    ("MAA", "DEL"): 175,
    ("DEL", "MAA"): 175,
    ("DEL", "CCU"): 135,
    ("CCU", "DEL"): 135,
    ("BOM", "BLR"): 100,
    ("BLR", "BOM"): 100,
    ("BOM", "GOI"): 70,
    ("GOI", "BOM"): 70,
    ("DEL", "HYD"): 125,
    ("HYD", "DEL"): 125,
    ("CCU", "BLR"): 155,
    ("BLR", "CCU"): 155,
}

DEPARTURE_SLOTS = [
    (6, 0),
    (8, 30),
    (11, 15),
    (14, 45),
    (18, 20),
    (21, 10),
]


# ============================================================================
# Helpers
# ============================================================================

def _generate_journey_fingerprint(
    airline_code: str,
    flight_number: str,
    origin: str,
    dest: str,
    dep_time_iso: str,
    arr_time_iso: str,
) -> str:
    """Generate deterministic SHA-256 fingerprint for a unique flight journey."""
    raw_key = f"{airline_code}:{flight_number}:{origin}:{dest}:{dep_time_iso}:{arr_time_iso}"
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()[:32]


# ============================================================================
# Standard Mock Supplier
# ============================================================================

class MockSupplier(FlightSupplier):
    """Standard Mock Supplier simulating a reliable domestic OTA / aggregator.

    Simulates realistic Indian routes, airlines, 100-500ms API latency,
    and a small 5% failure probability to exercise circuit breakers and retries.
    """

    def __init__(self) -> None:
        super().__init__()
        self._name = "FairFare Mock"
        self._code = "MOCK"
        self._supplier_type = "aggregator"
        self._base_url = "https://mock.fairfare.internal/api/v1"
        self._is_active = True
        self._is_trusted = True
        self._trust_score = 0.85
        self._priority = 10
        self._timeout_seconds = 10
        self._rate_limit_per_minute = 120

    @property
    def name(self) -> str:
        return self._name

    @property
    def code(self) -> str:
        return self._code

    @property
    def supplier_type(self) -> str:
        return self._supplier_type

    @property
    def base_url(self) -> str:
        return self._base_url

    @property
    def is_active(self) -> bool:
        return self._is_active

    @property
    def is_trusted(self) -> bool:
        return self._is_trusted

    @property
    def trust_score(self) -> float:
        return self._trust_score

    @property
    def priority(self) -> int:
        return self._priority

    @property
    def timeout_seconds(self) -> int:
        return self._timeout_seconds

    @property
    def rate_limit_per_minute(self) -> int:
        return self._rate_limit_per_minute

    # ------------------------------------------------------------------------
    # Search & Normalization
    # ------------------------------------------------------------------------

    async def search(
        self,
        origin: str,
        dest: str,
        departure_date: Union[str, date],
        return_date: Optional[Union[str, date]] = None,
        passengers: int = 1,
        cabin_class: str = "economy",
    ) -> List[Dict[str, Any]]:
        """Simulate searching for flight offers with 100-500ms latency and 5% failure rate."""
        # Simulated latency between 100ms and 500ms
        latency = random.uniform(0.1, 0.5)
        await asyncio.sleep(latency)

        # 5% failure chance to test circuit breaker / retry logic
        if random.random() < 0.05:
            logger.warning("MockSupplier [%s] simulated connection failure", self.code)
            raise SupplierConnectionError(
                f"Simulated network connection failure from {self.name}",
                supplier_code=self.code,
            )

        # Parse departure date
        if isinstance(departure_date, str):
            dep_date_obj = datetime.strptime(departure_date, "%Y-%m-%d").date()
        else:
            dep_date_obj = departure_date

        origin_code = origin.upper()
        dest_code = dest.upper()

        # Lookup route duration or compute a plausible default (120 mins)
        duration_minutes = ROUTE_DURATIONS_MINUTES.get((origin_code, dest_code), 120)

        # Generate 3 to 5 realistic flight options
        num_flights = random.randint(3, 5)
        selected_airlines = random.sample(INDIAN_AIRLINES, min(num_flights, len(INDIAN_AIRLINES)))

        raw_offers: List[Dict[str, Any]] = []

        for idx, airline in enumerate(selected_airlines):
            slot_hour, slot_minute = DEPARTURE_SLOTS[idx % len(DEPARTURE_SLOTS)]
            # Add small random minute offset (-15 to +15)
            offset_mins = random.randint(-15, 15)
            dep_dt = datetime(
                dep_date_obj.year,
                dep_date_obj.month,
                dep_date_obj.day,
                slot_hour,
                slot_minute,
                tzinfo=timezone.utc,
            ) + timedelta(minutes=offset_mins)

            arr_dt = dep_dt + timedelta(minutes=duration_minutes)
            flight_number = f"{airline['flight_prefix']}-{random.randint(1001, 8999)}"
            aircraft = random.choice(AIRCRAFT_TYPES)

            # Realistic pricing in paise: 300,000 to 1,500,000 (INR 3,000 to 15,000)
            base_fare_paise = random.randint(300000, 1500000)

            # Class multiplier if premium requested
            if cabin_class == "business":
                base_fare_paise = int(base_fare_paise * 2.5)
            elif cabin_class == "premium_economy":
                base_fare_paise = int(base_fare_paise * 1.5)

            taxes_paise = int(base_fare_paise * 0.12)  # 12% GST and airport fees
            fees_paise = int(base_fare_paise * 0.05)   # 5% convenience and seat fees
            total_price_paise = (base_fare_paise + taxes_paise + fees_paise) * passengers

            raw_offer = {
                "mock_id": f"mock-{self.code.lower()}-{uuid.uuid4().hex[:12]}",
                "airline_code": airline["code"],
                "airline_name": airline["name"],
                "flight_number": flight_number,
                "aircraft_type": aircraft,
                "origin": origin_code,
                "destination": dest_code,
                "departure_time": dep_dt.isoformat(),
                "arrival_time": arr_dt.isoformat(),
                "duration_minutes": duration_minutes,
                "stops": 0,
                "base_fare_paise": base_fare_paise * passengers,
                "taxes_paise": taxes_paise * passengers,
                "fees_paise": fees_paise * passengers,
                "total_price_paise": total_price_paise,
                "currency": "INR",
                "cabin_class": cabin_class,
                "fare_class": "Standard Economy" if cabin_class == "economy" else cabin_class.title(),
                "baggage_allowance": "15 kg check-in, 7 kg cabin",
                "is_refundable": False,
                "cancellation_fee_paise": 350000,  # INR 3,500
                "change_fee_paise": 250000,        # INR 2,500
                "meal_included": False,
                "seat_selection_included": False,
                "booking_url": f"https://book.fairfare.internal/{self.code.lower()}/checkout?offer={uuid.uuid4().hex[:8]}",
            }
            raw_offers.append(raw_offer)

        return await self.normalize(raw_offers)

    async def normalize(self, raw_response: Any) -> List[Dict[str, Any]]:
        """Normalize raw mock flight offers into FairFare canonical structure."""
        if not isinstance(raw_response, list):
            return []

        normalized: List[Dict[str, Any]] = []
        for raw in raw_response:
            fingerprint = _generate_journey_fingerprint(
                airline_code=raw["airline_code"],
                flight_number=raw["flight_number"],
                origin=raw["origin"],
                dest=raw["destination"],
                dep_time_iso=raw["departure_time"],
                arr_time_iso=raw["arrival_time"],
            )

            canonical_offer = {
                "offer_id": raw["mock_id"],
                "supplier_code": self.code,
                "supplier_name": self.name,
                "journey_fingerprint": fingerprint,
                "airline_code": raw["airline_code"],
                "airline_name": raw["airline_name"],
                "departure_airport": raw["origin"],
                "arrival_airport": raw["destination"],
                "departure_time": raw["departure_time"],
                "arrival_time": raw["arrival_time"],
                "duration_minutes": raw["duration_minutes"],
                "stops": raw["stops"],
                "segments": [
                    {
                        "segment_order": 0,
                        "flight_number": raw["flight_number"],
                        "airline_code": raw["airline_code"],
                        "aircraft_type": raw["aircraft_type"],
                        "departure_airport": raw["origin"],
                        "arrival_airport": raw["destination"],
                        "departure_time": raw["departure_time"],
                        "arrival_time": raw["arrival_time"],
                        "duration_minutes": raw["duration_minutes"],
                        "cabin_class": raw["cabin_class"],
                    }
                ],
                "pricing": {
                    "base_fare_paise": raw["base_fare_paise"],
                    "taxes_paise": raw["taxes_paise"],
                    "fees_paise": raw["fees_paise"],
                    "total_price_paise": raw["total_price_paise"],
                    "currency": raw["currency"],
                },
                "conditions": {
                    "cabin_class": raw["cabin_class"],
                    "fare_class": raw["fare_class"],
                    "baggage_allowance": raw["baggage_allowance"],
                    "is_refundable": raw["is_refundable"],
                    "cancellation_fee_paise": raw["cancellation_fee_paise"],
                    "change_fee_paise": raw["change_fee_paise"],
                    "meal_included": raw["meal_included"],
                    "seat_selection_included": raw["seat_selection_included"],
                },
                "booking_url": raw["booking_url"],
                "fetched_at": datetime.now(timezone.utc).isoformat(),
            }
            normalized.append(canonical_offer)

        return normalized

    # ------------------------------------------------------------------------
    # Price Verification
    # ------------------------------------------------------------------------

    async def verify_price(
        self,
        offer_id: str,
        journey_fingerprint: str,
    ) -> PriceVerificationResult:
        """Simulate pre-booking price verification with 20% probability of ±5% price shift."""
        # Realistic verification latency between 50ms and 150ms
        await asyncio.sleep(random.uniform(0.05, 0.15))

        # Baseline price in paise
        baseline_price_paise = random.randint(450000, 950000)

        # 20% probability of price change
        price_changed = random.random() < 0.20

        if price_changed:
            # Change by +/- 5%
            delta_ratio = random.uniform(-0.05, 0.05)
            change_amount = int(baseline_price_paise * delta_ratio)
            # Ensure at least small non-zero change
            if change_amount == 0:
                change_amount = 5000  # INR 50
            current_price_paise = max(100000, baseline_price_paise + change_amount)
            return PriceVerificationResult(
                status="price_changed",
                original_price_paise=baseline_price_paise,
                current_price_paise=current_price_paise,
                verified_at=datetime.now(timezone.utc),
                price_changed=True,
                change_amount_paise=current_price_paise - baseline_price_paise,
            )

        return PriceVerificationResult(
            status="verified",
            original_price_paise=baseline_price_paise,
            current_price_paise=baseline_price_paise,
            verified_at=datetime.now(timezone.utc),
            price_changed=False,
            change_amount_paise=0,
        )

    # ------------------------------------------------------------------------
    # Health, Capabilities & Terms
    # ------------------------------------------------------------------------

    async def health_check(self) -> HealthStatus:
        """Check supplier API connectivity and record ping response time."""
        start_time = time.monotonic()
        await asyncio.sleep(0.02)  # fast simulated ping
        latency_ms = int((time.monotonic() - start_time) * 1000)
        return HealthStatus(
            is_healthy=True,
            latency_ms=latency_ms,
            last_check=datetime.now(timezone.utc),
            error=None,
        )

    async def get_capabilities(self) -> Dict[str, Any]:
        """Return supported capabilities for this mock supplier."""
        return {
            "supplier_code": self.code,
            "supported_trip_types": ["one_way", "round_trip"],
            "supported_cabin_classes": ["economy", "premium_economy", "business"],
            "max_passengers": 9,
            "instant_ticketing": True,
            "seat_selection": False,
            "ancillary_services": ["extra_baggage"],
            "real_time_pricing": True,
        }

    async def get_terms(self) -> Dict[str, Any]:
        """Return standardized terms and conditions."""
        return {
            "supplier_code": self.code,
            "cancellation_policy": "Cancellations permitted up to 2 hours before departure. INR 3,500 fee applies.",
            "refund_timeline_days": 7,
            "terms_url": "https://fairfare.internal/terms/mock-supplier",
            "baggage_policy": "15 kg standard check-in luggage included for economy. 7 kg cabin bag.",
        }


# ============================================================================
# Budget Mock Supplier
# ============================================================================

class MockBudgetSupplier(MockSupplier):
    """Budget Flights Mock supplier.

    Characteristics:
        - 20% lower fares across all routes
        - Lower trust score (0.70)
        - No complimentary meals
        - No complimentary seat selection
        - Cabin baggage only by default (7 kg)
    """

    def __init__(self) -> None:
        super().__init__()
        self._name = "Budget Flights Mock"
        self._code = "MOCK_BUDGET"
        self._supplier_type = "low_cost_ota"
        self._base_url = "https://budget-mock.fairfare.internal/api/v1"
        self._trust_score = 0.70
        self._priority = 8
        self._rate_limit_per_minute = 150

    async def search(
        self,
        origin: str,
        dest: str,
        departure_date: Union[str, date],
        return_date: Optional[Union[str, date]] = None,
        passengers: int = 1,
        cabin_class: str = "economy",
    ) -> List[Dict[str, Any]]:
        """Search budget flights with 20% discounted prices and strict budget conditions."""
        offers = await super().search(
            origin=origin,
            dest=dest,
            departure_date=departure_date,
            return_date=return_date,
            passengers=passengers,
            cabin_class=cabin_class,
        )

        for offer in offers:
            # Apply 20% price reduction
            pricing = offer["pricing"]
            pricing["base_fare_paise"] = int(pricing["base_fare_paise"] * 0.80)
            pricing["taxes_paise"] = int(pricing["taxes_paise"] * 0.80)
            pricing["fees_paise"] = int(pricing["fees_paise"] * 0.80)
            pricing["total_price_paise"] = (
                pricing["base_fare_paise"] + pricing["taxes_paise"] + pricing["fees_paise"]
            )

            # Restrict amenities
            conditions = offer["conditions"]
            conditions["meal_included"] = False
            conditions["seat_selection_included"] = False
            conditions["baggage_allowance"] = "7 kg cabin baggage only. Check-in luggage chargeable."
            conditions["is_refundable"] = False
            conditions["fare_class"] = "Super Saver"

            offer["supplier_code"] = self.code
            offer["supplier_name"] = self.name

        return offers

    async def get_terms(self) -> Dict[str, Any]:
        """Return budget-specific strict cancellation and baggage terms."""
        return {
            "supplier_code": self.code,
            "cancellation_policy": "Strictly non-refundable. Flight changes permitted with INR 3,000 fee + fare difference.",
            "refund_timeline_days": 14,
            "terms_url": "https://fairfare.internal/terms/mock-budget",
            "baggage_policy": "7 kg cabin luggage only. Check-in luggage must be purchased separately.",
        }


# ============================================================================
# Premium Mock Supplier
# ============================================================================

class MockPremiumSupplier(MockSupplier):
    """Premium Travel Mock supplier.

    Characteristics:
        - 15% higher fares reflecting premium inclusions
        - High trust score (0.95)
        - Fully refundable with nominal INR 500 cancellation fee
        - Complimentary hot meals included
        - Complimentary seat selection included
        - Generous 25 kg check-in baggage allowance
    """

    def __init__(self) -> None:
        super().__init__()
        self._name = "Premium Travel Mock"
        self._code = "MOCK_PREMIUM"
        self._supplier_type = "premium_ota"
        self._base_url = "https://premium-mock.fairfare.internal/api/v1"
        self._trust_score = 0.95
        self._priority = 15
        self._rate_limit_per_minute = 100

    async def search(
        self,
        origin: str,
        dest: str,
        departure_date: Union[str, date],
        return_date: Optional[Union[str, date]] = None,
        passengers: int = 1,
        cabin_class: str = "economy",
    ) -> List[Dict[str, Any]]:
        """Search premium flight offers with 15% uplift and full luxury amenities."""
        offers = await super().search(
            origin=origin,
            dest=dest,
            departure_date=departure_date,
            return_date=return_date,
            passengers=passengers,
            cabin_class=cabin_class,
        )

        for offer in offers:
            # Apply 15% price uplift
            pricing = offer["pricing"]
            pricing["base_fare_paise"] = int(pricing["base_fare_paise"] * 1.15)
            pricing["taxes_paise"] = int(pricing["taxes_paise"] * 1.15)
            pricing["fees_paise"] = int(pricing["fees_paise"] * 1.15)
            pricing["total_price_paise"] = (
                pricing["base_fare_paise"] + pricing["taxes_paise"] + pricing["fees_paise"]
            )

            # Premium amenities and conditions
            conditions = offer["conditions"]
            conditions["meal_included"] = True
            conditions["seat_selection_included"] = True
            conditions["baggage_allowance"] = "25 kg check-in baggage + 7 kg cabin bag"
            conditions["is_refundable"] = True
            conditions["cancellation_fee_paise"] = 50000  # Nominal INR 500 fee
            conditions["change_fee_paise"] = 0            # Free rescheduling
            conditions["fare_class"] = "Premium Flex"

            offer["supplier_code"] = self.code
            offer["supplier_name"] = self.name

        return offers

    async def get_terms(self) -> Dict[str, Any]:
        """Return premium customer-friendly refund and amenity terms."""
        return {
            "supplier_code": self.code,
            "cancellation_policy": "Fully refundable up to 4 hours before departure with flat INR 500 handling fee. Free date changes.",
            "refund_timeline_days": 3,
            "terms_url": "https://fairfare.internal/terms/mock-premium",
            "baggage_policy": "25 kg check-in luggage and 7 kg hand baggage included.",
        }
