"""Amadeus Flight Supplier Adapter for FairFare.

Comprehensive integration adapter for Amadeus Global Distribution System (GDS) APIs:
  - Flight Offers Search v2 (GET /v2/shopping/flight-offers)
  - Flight Offers Price v1 (POST /v1/shopping/flight-offers/pricing)
  - OAuth2 Client Credentials Authentication (POST /v1/security/oauth2/token)

Integration Architecture & Steps for Production:
------------------------------------------------
1. Credentials & Environments:
   - Amadeus provides two environments:
     * Sandbox (Testing): https://test.api.amadeus.com
     * Production:        https://api.amadeus.com
   - Set environment variables:
     * AMADEUS_CLIENT_ID
     * AMADEUS_CLIENT_SECRET
     * AMADEUS_BASE_URL (defaults to test.api.amadeus.com)

2. Authentication Flow:
   - Make POST to `/v1/security/oauth2/token` with headers:
     `Content-Type: application/x-www-form-urlencoded`
   - Form Body:
     `grant_type=client_credentials&client_id={API_KEY}&client_secret={API_SECRET}`
   - The token response yields:
     `{"access_token": "...", "expires_in": 1799, "token_type": "Bearer"}`
   - Cache access_token and refresh automatically 60 seconds before expiration.

3. Flight Offers Search v2:
   - Endpoint: GET `/v2/shopping/flight-offers`
   - Request Query Parameters:
     * originLocationCode: IATA code (e.g. 'DEL')
     * destinationLocationCode: IATA code (e.g. 'BOM')
     * departureDate: 'YYYY-MM-DD'
     * returnDate: 'YYYY-MM-DD' (optional)
     * adults: integer (e.g. 1)
     * children: integer (optional)
     * infants: integer (optional)
     * travelClass: 'ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'
     * currencyCode: 'INR'
     * max: 50 (results limit)
   - Headers:
     `Authorization: Bearer {access_token}`

4. Flight Offers Price v1:
   - Endpoint: POST `/v1/shopping/flight-offers/pricing`
   - Payload:
     {
       "data": {
         "type": "flight-offers-pricing",
         "flightOffers": [ <flight_offer_object_from_search> ]
       }
     }
   - Verifies seat availability and recalculates fare, taxes, and fees before booking.

5. Field Mapping (Amadeus -> FairFare Canonical):
   - `data[].id`                               -> `offer_id`
   - `data[].itineraries[].duration`           -> `duration_minutes` (parse ISO 8601 'PT2H10M')
   - `data[].itineraries[].segments[]`         -> `segments`
   - `segment.carrierCode`                     -> `airline_code`
   - `segment.number`                          -> `flight_number`
   - `segment.departure.iataCode`              -> `departure_airport`
   - `segment.departure.at`                    -> `departure_time`
   - `segment.arrival.iataCode`                -> `arrival_airport`
   - `segment.arrival.at`                      -> `arrival_time`
   - `data[].price.grandTotal` (str '5400.00') -> `total_price_paise` (540000)
   - `data[].price.base`                       -> `base_fare_paise`
   - `data[].pricingOptions.refundableFare`    -> `is_refundable`
   - `data[].travelerPricings[].fareDetailsBySegment[].includedCheckedBags` -> `baggage_allowance`
"""

from __future__ import annotations

import asyncio
from datetime import date, datetime, timedelta, timezone
import hashlib
import logging
import random
import re
from typing import Any, Dict, List, Optional, Union
import uuid

from app.suppliers.base import (
    FlightSupplier,
    HealthStatus,
    PriceVerificationResult,
    SupplierConnectionError,
    SupplierError,
    SupplierTimeoutError,
)

logger = logging.getLogger(__name__)


def _parse_iso_duration(duration_str: str) -> int:
    """Parse ISO 8601 duration format (e.g., 'PT2H15M', 'PT130M') to total minutes."""
    match = re.match(r"^PT(?:(\d+)H)?(?:(\d+)M)?$", duration_str)
    if not match:
        return 120  # Fallback duration
    hours = int(match.group(1)) if match.group(1) else 0
    minutes = int(match.group(2)) if match.group(2) else 0
    return (hours * 60) + minutes


def _generate_journey_fingerprint(
    airline_code: str,
    flight_number: str,
    origin: str,
    dest: str,
    dep_time_iso: str,
    arr_time_iso: str,
) -> str:
    """Generate deterministic SHA-256 fingerprint for journey deduplication."""
    raw = f"{airline_code}:{flight_number}:{origin}:{dest}:{dep_time_iso}:{arr_time_iso}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:32]


class AmadeusSupplier(FlightSupplier):
    """Amadeus GDS Supplier Adapter.

    Simulates the full Amadeus v2 Shopping and v1 Pricing API flows while providing
    detailed production implementation architecture, field mappings, and error handling.
    """

    def __init__(
        self,
        client_id: Optional[str] = None,
        client_secret: Optional[str] = None,
        base_url: str = "https://test.api.amadeus.com",
    ) -> None:
        super().__init__()
        self._name = "Amadeus GDS"
        self._code = "AMADEUS"
        self._supplier_type = "gds"
        self._base_url = base_url
        self._client_id = client_id or "MOCK_AMADEUS_CLIENT_ID"
        self._client_secret = client_secret or "MOCK_AMADEUS_CLIENT_SECRET"

        self._is_active = True
        self._is_trusted = True
        self._trust_score = 0.98
        self._priority = 20
        self._timeout_seconds = 15
        self._rate_limit_per_minute = 100

        # OAuth2 token caching
        self._access_token: Optional[str] = None
        self._token_expires_at: Optional[float] = None
        self._auth_lock = asyncio.Lock()

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
    # OAuth2 Authentication Flow
    # ------------------------------------------------------------------------

    async def _get_auth_token(self) -> str:
        """Obtain a valid OAuth2 Bearer token using the Client Credentials grant.

        In production, sends:
            POST /v1/security/oauth2/token
            Headers: Content-Type: application/x-www-form-urlencoded
            Body: grant_type=client_credentials&client_id=...&client_secret=...

        Returns:
            Valid Bearer access token string.
        """
        async with self._auth_lock:
            now = asyncio.get_event_loop().time()
            if self._access_token and self._token_expires_at and (self._token_expires_at - now > 60):
                return self._access_token

            logger.info("Requesting fresh OAuth2 token from Amadeus GDS auth endpoint")
            # Simulate OAuth token round-trip latency
            await asyncio.sleep(0.05)

            # In production, httpx or aiohttp would post to f"{self.base_url}/v1/security/oauth2/token"
            self._access_token = f"amadeus_tok_{uuid.uuid4().hex}"
            # Tokens typically valid for 1800s (30 mins)
            self._token_expires_at = now + 1799
            return self._access_token

    # ------------------------------------------------------------------------
    # Search Flight Offers
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
        """Query Amadeus Flight Offers Search v2 API.

        Real request structure:
            GET /v2/shopping/flight-offers?originLocationCode=DEL&destinationLocationCode=BOM
                &departureDate=2026-12-01&adults=1&travelClass=ECONOMY&currencyCode=INR&max=20

        Returns:
            Canonical FairFare offer list extracted and normalized from Amadeus response.
        """
        token = await self._get_auth_token()
        assert token is not None

        # Format departure date string
        if isinstance(departure_date, str):
            dep_date_str = departure_date
            dep_date_obj = datetime.strptime(departure_date, "%Y-%m-%d").date()
        else:
            dep_date_str = departure_date.strftime("%Y-%m-%d")
            dep_date_obj = departure_date

        travel_class_map = {
            "economy": "ECONOMY",
            "premium_economy": "PREMIUM_ECONOMY",
            "business": "BUSINESS",
            "first": "FIRST",
        }
        amadeus_travel_class = travel_class_map.get(cabin_class.lower(), "ECONOMY")

        logger.info(
            "Searching Amadeus GDS: %s -> %s on %s (Class: %s, Passengers: %d)",
            origin,
            dest,
            dep_date_str,
            amadeus_travel_class,
            passengers,
        )

        # Simulate network latency of Amadeus GDS call (150-300ms)
        await asyncio.sleep(random.uniform(0.15, 0.30))

        # Build realistic Amadeus v2 Flight Offers response payload
        raw_amadeus_response = self._build_mock_amadeus_v2_response(
            origin=origin.upper(),
            dest=dest.upper(),
            dep_date_obj=dep_date_obj,
            passengers=passengers,
            travel_class=amadeus_travel_class,
        )

        return await self.normalize(raw_amadeus_response)

    def _build_mock_amadeus_v2_response(
        self,
        origin: str,
        dest: str,
        dep_date_obj: date,
        passengers: int,
        travel_class: str,
    ) -> Dict[str, Any]:
        """Construct realistic Amadeus Flight Offers v2 JSON schema response."""
        carrier_options = [
            ("AI", "Air India", "865", "A321"),
            ("6E", "IndiGo", "2001", "32N"),
            ("UK", "Vistara", "995", "789"),
            ("QP", "Akasa Air", "1301", "7M8"),
        ]

        data_items: List[Dict[str, Any]] = []
        for idx, (carrier, _, flt_num, equipment) in enumerate(carrier_options):
            offer_id = str(idx + 1)
            dep_hour = 7 + (idx * 4)
            dep_dt = datetime(
                dep_date_obj.year,
                dep_date_obj.month,
                dep_date_obj.day,
                dep_hour,
                15,
                tzinfo=timezone.utc,
            )
            arr_dt = dep_dt + timedelta(hours=2, minutes=10)

            base_price = 4200.00 * (2.2 if travel_class == "BUSINESS" else 1.0)
            taxes = base_price * 0.12
            total = (base_price + taxes) * passengers

            item = {
                "type": "flight-offer",
                "id": offer_id,
                "source": "GDS",
                "instantTicketingRequired": False,
                "nonHomogeneous": False,
                "oneWay": True,
                "lastTicketingDate": dep_date_obj.strftime("%Y-%m-%d"),
                "numberOfBookableSeats": 9,
                "itineraries": [
                    {
                        "duration": "PT2H10M",
                        "segments": [
                            {
                                "departure": {
                                    "iataCode": origin,
                                    "terminal": "3",
                                    "at": dep_dt.strftime("%Y-%m-%dT%H:%M:%S"),
                                },
                                "arrival": {
                                    "iataCode": dest,
                                    "terminal": "2",
                                    "at": arr_dt.strftime("%Y-%m-%dT%H:%M:%S"),
                                },
                                "carrierCode": carrier,
                                "number": flt_num,
                                "aircraft": {"code": equipment},
                                "operating": {"carrierCode": carrier},
                                "duration": "PT2H10M",
                                "id": f"seg-{idx + 1}",
                                "numberOfStops": 0,
                                "blacklistedInEU": False,
                            }
                        ],
                    }
                ],
                "price": {
                    "currency": "INR",
                    "total": f"{total:.2f}",
                    "base": f"{(base_price * passengers):.2f}",
                    "fees": [
                        {"amount": f"{(taxes * passengers):.2f}", "type": "TAXES"}
                    ],
                    "grandTotal": f"{total:.2f}",
                },
                "pricingOptions": {
                    "fareType": ["PUBLISHED"],
                    "includedCheckedBagsOnly": True,
                    "refundableFare": travel_class == "BUSINESS",
                },
                "validatingAirlineCodes": [carrier],
                "travelerPricings": [
                    {
                        "travelerId": "1",
                        "fareOption": "STANDARD",
                        "travelerType": "ADULT",
                        "price": {
                            "currency": "INR",
                            "total": f"{(total / passengers):.2f}",
                            "base": f"{base_price:.2f}",
                        },
                        "fareDetailsBySegment": [
                            {
                                "segmentId": f"seg-{idx + 1}",
                                "cabin": travel_class,
                                "fareBasis": "ECOSTANDARD",
                                "class": "Y",
                                "includedCheckedBags": {
                                    "weight": 15 if travel_class != "BUSINESS" else 30,
                                    "weightUnit": "KG",
                                },
                            }
                        ],
                    }
                ],
            }
            data_items.append(item)

        return {
            "meta": {"count": len(data_items)},
            "data": data_items,
            "dictionaries": {
                "carriers": {
                    "AI": "AIR INDIA",
                    "6E": "INDIGO",
                    "UK": "VISTARA",
                    "QP": "AKASA AIR",
                }
            },
        }

    # ------------------------------------------------------------------------
    # Normalization (Amadeus Schema -> FairFare Canonical Schema)
    # ------------------------------------------------------------------------

    async def normalize(self, raw_response: Any) -> List[Dict[str, Any]]:
        """Map Amadeus GDS response format to FairFare canonical flight offer format.

        Field Mapping Documentation:
          - raw_response['data'] -> array of flight-offer objects
          - offer['price']['grandTotal'] -> convert INR string (e.g. '5400.00') to integer paise (540000)
          - offer['itineraries'][0]['segments'] -> list of journey segments
          - offer['pricingOptions']['refundableFare'] -> is_refundable bool
          - offer['travelerPricings'][0]['fareDetailsBySegment'][0]['includedCheckedBags'] -> baggage allowance
        """
        if not isinstance(raw_response, dict) or "data" not in raw_response:
            return []

        carrier_dict = raw_response.get("dictionaries", {}).get("carriers", {})
        normalized_offers: List[Dict[str, Any]] = []

        for offer in raw_response.get("data", []):
            try:
                offer_id = str(offer.get("id"))
                itineraries = offer.get("itineraries", [])
                if not itineraries:
                    continue

                itinerary = itineraries[0]
                duration_minutes = _parse_iso_duration(itinerary.get("duration", "PT2H"))
                segments_raw = itinerary.get("segments", [])
                if not segments_raw:
                    continue

                first_segment = segments_raw[0]
                last_segment = segments_raw[-1]

                airline_code = first_segment.get("carrierCode", "AI")
                airline_name = carrier_dict.get(airline_code, airline_code)
                flight_number = f"{airline_code}-{first_segment.get('number', '101')}"
                origin_airport = first_segment.get("departure", {}).get("iataCode")
                dest_airport = last_segment.get("arrival", {}).get("iataCode")
                dep_time_str = first_segment.get("departure", {}).get("at")
                arr_time_str = last_segment.get("arrival", {}).get("at")

                # Parse prices in paise
                price_obj = offer.get("price", {})
                grand_total_float = float(price_obj.get("grandTotal", "0.00"))
                base_fare_float = float(price_obj.get("base", "0.00"))
                total_price_paise = int(round(grand_total_float * 100))
                base_fare_paise = int(round(base_fare_float * 100))
                taxes_paise = max(0, total_price_paise - base_fare_paise)

                # Journey fingerprint for deduplication
                fingerprint = _generate_journey_fingerprint(
                    airline_code=airline_code,
                    flight_number=flight_number,
                    origin=origin_airport,
                    dest=dest_airport,
                    dep_time_iso=dep_time_str,
                    arr_time_iso=arr_time_str,
                )

                # Segment parsing
                normalized_segments: List[Dict[str, Any]] = []
                for s_idx, seg in enumerate(segments_raw):
                    seg_dep = seg.get("departure", {})
                    seg_arr = seg.get("arrival", {})
                    seg_duration = _parse_iso_duration(seg.get("duration", "PT2H"))
                    normalized_segments.append(
                        {
                            "segment_order": s_idx,
                            "flight_number": f"{seg.get('carrierCode')}-{seg.get('number')}",
                            "airline_code": seg.get("carrierCode"),
                            "aircraft_type": seg.get("aircraft", {}).get("code", "Airbus A320"),
                            "departure_airport": seg_dep.get("iataCode"),
                            "arrival_airport": seg_arr.get("iataCode"),
                            "departure_time": seg_dep.get("at"),
                            "arrival_time": seg_arr.get("at"),
                            "duration_minutes": seg_duration,
                            "cabin_class": "economy",
                        }
                    )

                # Traveler conditions
                pricing_opts = offer.get("pricingOptions", {})
                is_refundable = bool(pricing_opts.get("refundableFare", False))

                traveler_pricing = offer.get("travelerPricings", [{}])[0]
                fare_details = traveler_pricing.get("fareDetailsBySegment", [{}])[0]
                cabin_class = fare_details.get("cabin", "ECONOMY").lower()
                bag_info = fare_details.get("includedCheckedBags", {})
                bag_weight = bag_info.get("weight", 15)
                bag_unit = bag_info.get("weightUnit", "KG")
                baggage_allowance = f"{bag_weight} {bag_unit} check-in, 7 KG cabin"

                canonical_offer = {
                    "offer_id": f"amadeus-{offer_id}",
                    "supplier_code": self.code,
                    "supplier_name": self.name,
                    "journey_fingerprint": fingerprint,
                    "airline_code": airline_code,
                    "airline_name": airline_name.title(),
                    "departure_airport": origin_airport,
                    "arrival_airport": dest_airport,
                    "departure_time": dep_time_str,
                    "arrival_time": arr_time_str,
                    "duration_minutes": duration_minutes,
                    "stops": len(segments_raw) - 1,
                    "segments": normalized_segments,
                    "pricing": {
                        "base_fare_paise": base_fare_paise,
                        "taxes_paise": taxes_paise,
                        "fees_paise": 0,
                        "total_price_paise": total_price_paise,
                        "currency": price_obj.get("currency", "INR"),
                    },
                    "conditions": {
                        "cabin_class": cabin_class,
                        "fare_class": fare_details.get("fareBasis", "STANDARD"),
                        "baggage_allowance": baggage_allowance,
                        "is_refundable": is_refundable,
                        "cancellation_fee_paise": 250000 if not is_refundable else 50000,
                        "change_fee_paise": 150000 if not is_refundable else 0,
                        "meal_included": cabin_class == "business",
                        "seat_selection_included": cabin_class == "business",
                    },
                    "booking_url": f"https://www.amadeus.net/flights/checkout?offerId={offer_id}",
                    "fetched_at": datetime.now(timezone.utc).isoformat(),
                }
                normalized_offers.append(canonical_offer)

            except Exception as exc:
                logger.warning("Error normalizing Amadeus flight offer: %s", exc)
                continue

        return normalized_offers

    # ------------------------------------------------------------------------
    # Price Verification (Flight Offers Price v1)
    # ------------------------------------------------------------------------

    async def verify_price(
        self,
        offer_id: str,
        journey_fingerprint: str,
    ) -> PriceVerificationResult:
        """Call Amadeus Flight Offers Price v1 API to confirm fare and seat validity.

        In production, executes:
            POST /v1/shopping/flight-offers/pricing
            Headers:
                Authorization: Bearer {token}
                Content-Type: application/json
            Body:
                {
                    "data": {
                        "type": "flight-offers-pricing",
                        "flightOffers": [ <cached_offer_json> ]
                    }
                }

        Returns:
            PriceVerificationResult indicating verified status or updated price.
        """
        token = await self._get_auth_token()
        assert token is not None

        logger.info(
            "Verifying price with Amadeus Pricing v1 for offer %s (fp: %s)",
            offer_id,
            journey_fingerprint,
        )

        # Simulate network latency of re-pricing check (100-250ms)
        await asyncio.sleep(random.uniform(0.10, 0.25))

        # Baseline price in paise
        baseline_price_paise = 470400  # INR 4,704.00

        # Amadeus GDS typically features high price stability (<5% variation)
        price_changed = random.random() < 0.05

        if price_changed:
            delta_paise = random.choice([25000, -15000, 40000])  # small tax adjustment
            current_price = baseline_price_paise + delta_paise
            return PriceVerificationResult(
                status="price_changed",
                original_price_paise=baseline_price_paise,
                current_price_paise=current_price,
                verified_at=datetime.now(timezone.utc),
                price_changed=True,
                change_amount_paise=delta_paise,
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
    # Health Check, Capabilities & Terms
    # ------------------------------------------------------------------------

    async def health_check(self) -> HealthStatus:
        """Ping Amadeus GDS health endpoint."""
        start_time = asyncio.get_event_loop().time()
        try:
            # Simulate authentication token check ping
            await self._get_auth_token()
            latency_ms = int((asyncio.get_event_loop().time() - start_time) * 1000)
            return HealthStatus(
                is_healthy=True,
                latency_ms=latency_ms,
                last_check=datetime.now(timezone.utc),
                error=None,
            )
        except Exception as exc:
            return HealthStatus(
                is_healthy=False,
                latency_ms=999,
                last_check=datetime.now(timezone.utc),
                error=str(exc),
            )

    async def get_capabilities(self) -> Dict[str, Any]:
        """Return Amadeus GDS supported feature flags and operational bounds."""
        return {
            "supplier_code": self.code,
            "supported_trip_types": ["one_way", "round_trip", "multi_city"],
            "supported_cabin_classes": ["economy", "premium_economy", "business", "first"],
            "max_passengers": 9,
            "instant_ticketing": True,
            "seat_maps": True,
            "ancillary_services": ["baggage", "meals", "special_services"],
            "real_time_pricing": True,
            "supported_currencies": ["INR", "USD", "EUR", "GBP", "AED"],
        }

    async def get_terms(self) -> Dict[str, Any]:
        """Return Amadeus GDS legal policies and data usage governance."""
        return {
            "supplier_code": self.code,
            "cancellation_policy": "Fares governed by individual airline ticketing tariffs.",
            "refund_timeline_days": 5,
            "terms_url": "https://developers.amadeus.com/terms-and-conditions",
            "data_usage_policy": "Fare data must be used strictly for direct consumer comparison without unauthorized scraping.",
        }
