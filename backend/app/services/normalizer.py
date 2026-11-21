"""Flight offer normalizer for FairFare backend.

Validates raw supplier offers, standardizes prices to integer paise, normalizes
cabin classes and UTC datetimes, generates journey fingerprints, and deduplicates
offers keeping the cheapest option per journey per supplier.
"""

from __future__ import annotations

import hashlib
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union

logger = logging.getLogger(__name__)

# Standard conversion rates to INR
EXCHANGE_RATES_TO_INR: Dict[str, float] = {
    "INR": 1.0,
    "USD": 83.0,
    "EUR": 90.0,
    "GBP": 105.0,
    "AED": 22.6,
    "SGD": 62.0,
}

# Canonical cabin class mappings
CABIN_CLASS_MAPPINGS: Dict[str, str] = {
    "economy": "economy",
    "econ": "economy",
    "eco": "economy",
    "coach": "economy",
    "y": "economy",
    "m": "economy",
    "premium_economy": "premium_economy",
    "premium economy": "premium_economy",
    "premium": "premium_economy",
    "prem": "premium_economy",
    "w": "premium_economy",
    "business": "business",
    "biz": "business",
    "c": "business",
    "j": "business",
    "first": "first",
    "first_class": "first",
    "first class": "first",
    "f": "first",
}


class FlightNormalizer:
    """Normalizes, validates, and deduplicates flight offers from diverse suppliers."""

    def __init__(self) -> None:
        self.stats: Dict[str, int] = {
            "total": 0,
            "accepted": 0,
            "rejected": 0,
            "deduplicated": 0,
        }

    def _generate_journey_fingerprint(
        self,
        airline: str,
        flight_number: str,
        departure: str,
        arrival: str,
        date: str,
    ) -> str:
        """Generate a deterministic SHA-256 hash representing a unique flight journey.

        Args:
            airline: Airline IATA/ICAO code or name.
            flight_number: Flight number (e.g. '6E-2001').
            departure: Departure airport IATA code.
            arrival: Arrival airport IATA code.
            date: Departure date/time string.

        Returns:
            64-character SHA-256 hexadecimal hash string.
        """
        raw_key = (
            f"{airline.strip().upper()}|"
            f"{flight_number.strip().upper()}|"
            f"{departure.strip().upper()}|"
            f"{arrival.strip().upper()}|"
            f"{date.strip()}"
        )
        return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

    def _normalize_price(
        self,
        amount: Union[float, int, str],
        currency: str = "INR",
        is_paise: bool = False,
    ) -> int:
        """Convert a monetary amount into integer paise (1 INR = 100 paise).

        Handles foreign currencies with standard exchange rates (USD -> *83, EUR -> *90).

        Args:
            amount: The numerical amount in currency units or paise.
            currency: 3-letter currency code (e.g. 'INR', 'USD', 'EUR').
            is_paise: True if amount is already in paise.

        Returns:
            Integer amount in paise.
        """
        try:
            num = float(amount)
        except (ValueError, TypeError):
            logger.warning("Invalid price amount '%s', defaulting to 0", amount)
            return 0

        curr_upper = currency.strip().upper()

        if is_paise and curr_upper == "INR":
            return int(round(num))

        rate = EXCHANGE_RATES_TO_INR.get(curr_upper, 1.0)
        # Convert to INR, then to paise (1 INR = 100 paise)
        inr_amount = num * rate
        return int(round(inr_amount * 100))

    def _normalize_cabin_class(self, raw: Optional[str]) -> str:
        """Normalize raw cabin class string to canonical enum value."""
        if not raw:
            return "economy"
        cleaned = raw.strip().lower()
        return CABIN_CLASS_MAPPINGS.get(cleaned, "economy")

    def _normalize_datetime(self, dt_val: Union[str, datetime]) -> datetime:
        """Normalize datetime to timezone-aware UTC datetime.

        Args:
            dt_val: datetime object or ISO string.

        Returns:
            Timezone-aware datetime in UTC.
        """
        if isinstance(dt_val, datetime):
            if dt_val.tzinfo is None:
                return dt_val.replace(tzinfo=timezone.utc)
            return dt_val.astimezone(timezone.utc)

        if not isinstance(dt_val, str) or not dt_val.strip():
            return datetime.now(timezone.utc)

        cleaned_str = dt_val.strip()
        # Handle trailing 'Z' for fromisoformat compatibility in older python
        if cleaned_str.endswith("Z"):
            cleaned_str = cleaned_str[:-1] + "+00:00"

        try:
            parsed = datetime.fromisoformat(cleaned_str)
            if parsed.tzinfo is None:
                return parsed.replace(tzinfo=timezone.utc)
            return parsed.astimezone(timezone.utc)
        except ValueError:
            # Fallback to standard date/time format parsing
            for fmt in (
                "%Y-%m-%d %H:%M:%S",
                "%Y-%m-%dT%H:%M:%S",
                "%Y-%m-%d %H:%M",
                "%Y-%m-%d",
            ):
                try:
                    parsed = datetime.strptime(cleaned_str, fmt)
                    return parsed.replace(tzinfo=timezone.utc)
                except ValueError:
                    continue

        logger.warning("Could not parse datetime string '%s', using UTC now", dt_val)
        return datetime.now(timezone.utc)

    def _validate_offer(self, offer: Dict[str, Any]) -> bool:
        """Validate that an offer contains essential fields and reasonable values."""
        if not isinstance(offer, dict):
            return False

        # Validate origin & destination
        origin = offer.get("departure_airport") or offer.get("origin")
        destination = offer.get("arrival_airport") or offer.get("destination")
        if not origin or not destination:
            return False
        if str(origin).strip().upper() == str(destination).strip().upper():
            return False

        # Validate departure time
        departure_time = offer.get("departure_time")
        if not departure_time:
            return False

        # Validate price
        price = offer.get("total_price_paise")
        if price is None:
            # Check if raw price exists
            price_val = offer.get("price") or offer.get("total_price")
            if price_val is None:
                return False
        elif not isinstance(price, (int, float)) or price <= 0:
            return False

        return True

    def _deduplicate_journeys(self, journeys: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Deduplicate journeys keeping unique items by journey fingerprint."""
        seen_fingerprints: set[str] = set()
        unique_journeys: List[Dict[str, Any]] = []

        for j in journeys:
            fp = j.get("journey_fingerprint")
            if not fp:
                unique_journeys.append(j)
                continue
            if fp not in seen_fingerprints:
                seen_fingerprints.add(fp)
                unique_journeys.append(j)
            else:
                self.stats["deduplicated"] += 1

        return unique_journeys

    def _merge_duplicate_offers(self, offers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Keep only the cheapest offer per supplier per journey."""
        # Key: (supplier_code, journey_fingerprint) -> cheapest offer
        best_offers: Dict[tuple[str, str], Dict[str, Any]] = {}
        no_key_offers: List[Dict[str, Any]] = []

        for offer in offers:
            supplier = (
                offer.get("supplier_code")
                or offer.get("supplier_name")
                or "UNKNOWN"
            )
            fingerprint = offer.get("journey_fingerprint")

            if not fingerprint:
                no_key_offers.append(offer)
                continue

            dedup_key = (str(supplier).upper(), str(fingerprint))
            existing = best_offers.get(dedup_key)

            if existing is None:
                best_offers[dedup_key] = offer
            else:
                self.stats["deduplicated"] += 1
                curr_price = offer.get("total_price_paise", float("inf"))
                exist_price = existing.get("total_price_paise", float("inf"))
                if curr_price < exist_price:
                    best_offers[dedup_key] = offer

        return list(best_offers.values()) + no_key_offers

    def normalize_offers(
        self,
        raw_offers: List[Dict[str, Any]],
        supplier_name: str,
    ) -> List[Dict[str, Any]]:
        """Normalize a batch of raw supplier offers into canonical FairFare offer dicts.

        Args:
            raw_offers: List of raw offer dicts from supplier.
            supplier_name: Name of the supplying partner/OTA.

        Returns:
            List of validated, standardized, and deduplicated offer dicts.
        """
        self.stats["total"] += len(raw_offers)
        normalized_batch: List[Dict[str, Any]] = []

        for raw in raw_offers:
            # 1. Basic structure extraction
            origin = (raw.get("departure_airport") or raw.get("origin") or "").strip().upper()
            destination = (raw.get("arrival_airport") or raw.get("destination") or "").strip().upper()
            airline = (raw.get("airline_code") or raw.get("airline") or "").strip().upper()
            flight_number = str(raw.get("flight_number") or raw.get("flight_no") or "").strip()
            cabin = self._normalize_cabin_class(raw.get("cabin_class"))

            # 2. Datetime normalization
            raw_dep = raw.get("departure_time")
            departure_dt = self._normalize_datetime(raw_dep) if raw_dep else datetime.now(timezone.utc)
            raw_arr = raw.get("arrival_time")
            arrival_dt = self._normalize_datetime(raw_arr) if raw_arr else departure_dt

            # 3. Price normalization
            raw_price = raw.get("total_price_paise")
            currency = raw.get("currency") or "INR"
            if raw_price is not None:
                total_paise = int(raw_price)
            else:
                raw_amount = raw.get("total_price") or raw.get("price") or raw.get("amount") or 0
                total_paise = self._normalize_price(raw_amount, currency=currency)

            base_fare_paise = raw.get("base_fare_paise")
            if base_fare_paise is None:
                raw_base = raw.get("base_fare") or (total_paise * 0.85 / 100)
                base_fare_paise = self._normalize_price(raw_base, currency=currency)

            taxes_paise = raw.get("taxes_paise")
            if taxes_paise is None:
                raw_tax = raw.get("taxes") or ((total_paise - base_fare_paise) / 100)
                taxes_paise = self._normalize_price(raw_tax, currency=currency)

            fees_paise = raw.get("fees_paise", 0)

            # 4. Fingerprint generation
            dep_date_str = departure_dt.date().isoformat()
            fingerprint = raw.get("journey_fingerprint") or self._generate_journey_fingerprint(
                airline=airline,
                flight_number=flight_number,
                departure=origin,
                arrival=destination,
                date=dep_date_str,
            )

            # Build canonical offer dict
            offer: Dict[str, Any] = {
                "id": raw.get("id"),
                "supplier_name": supplier_name,
                "supplier_code": (raw.get("supplier_code") or supplier_name[:4]).upper(),
                "supplier_trust_score": float(raw.get("supplier_trust_score") or 0.85),
                "airline_code": airline,
                "airline_name": raw.get("airline_name") or airline,
                "flight_number": flight_number,
                "departure_airport": origin,
                "arrival_airport": destination,
                "departure_time": departure_dt,
                "arrival_time": arrival_dt,
                "duration_minutes": int(raw.get("duration_minutes") or 120),
                "stops": int(raw.get("stops") or 0),
                "journey_fingerprint": fingerprint,
                "base_fare_paise": int(base_fare_paise),
                "taxes_paise": int(taxes_paise),
                "fees_paise": int(fees_paise),
                "total_price_paise": int(total_paise),
                "currency": "INR",
                "cabin_class": cabin,
                "fare_class": raw.get("fare_class"),
                "baggage_allowance": raw.get("baggage_allowance") or "15 kg Check-in, 7 kg Cabin",
                "is_refundable": bool(raw.get("is_refundable", False)),
                "cancellation_fee_paise": raw.get("cancellation_fee_paise"),
                "change_fee_paise": raw.get("change_fee_paise"),
                "meal_included": bool(raw.get("meal_included", False)),
                "seat_selection_included": bool(raw.get("seat_selection_included", False)),
                "booking_url": raw.get("booking_url"),
                "verification_status": raw.get("verification_status", "unverified"),
                "last_verified_at": raw.get("last_verified_at"),
            }

            # 5. Validation check
            if not self._validate_offer(offer):
                self.stats["rejected"] += 1
                logger.debug("Rejected invalid offer from %s: %s", supplier_name, raw)
                continue

            self.stats["accepted"] += 1
            normalized_batch.append(offer)

        # 6. Merge duplicates per supplier per journey
        merged_offers = self._merge_duplicate_offers(normalized_batch)

        logger.info(
            "Normalized %s offers: total=%d, accepted=%d, rejected=%d, deduplicated=%d",
            supplier_name,
            self.stats["total"],
            self.stats["accepted"],
            self.stats["rejected"],
            self.stats["deduplicated"],
        )

        return merged_offers
