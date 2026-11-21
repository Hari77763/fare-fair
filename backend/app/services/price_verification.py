"""Price verification service for FairFare backend.

Verifies live fares directly against suppliers prior to checkout or re-display,
detects fare increases or decreases, flags stale prices, maintains audit logs
of price movements, and prioritizes verification queue by lowest price.
"""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union

logger = logging.getLogger(__name__)


@dataclass
class VerificationResult:
    """Outcome of verifying a flight fare product with a supplier."""

    status: str  # "verified" | "price_changed" | "unavailable"
    previous_price_paise: int
    current_price_paise: int
    verified_at: datetime
    price_changed: bool
    change_amount_paise: int
    change_direction: str  # "up" | "down" | "none"


class PriceVerificationService:
    """Verifies live prices against suppliers and tracks historical price changes."""

    def __init__(self, stale_threshold_minutes: int = 15) -> None:
        """Initialize price verification service.

        Args:
            stale_threshold_minutes: Max age in minutes before a cached price is considered stale.
        """
        self.stale_threshold_minutes: int = stale_threshold_minutes
        # Audit log of recorded price adjustments
        self._price_change_history: List[Dict[str, Any]] = []

    def _is_stale(
        self,
        last_verified_at: Optional[datetime],
        max_age_minutes: Optional[int] = None,
    ) -> bool:
        """Check whether the last price verification timestamp has expired.

        Args:
            last_verified_at: Time when price was last verified.
            max_age_minutes: Maximum age allowed in minutes.

        Returns:
            True if timestamp is missing or older than threshold, False otherwise.
        """
        if last_verified_at is None:
            return True

        threshold = max_age_minutes or self.stale_threshold_minutes

        # Ensure UTC timezone awareness
        if last_verified_at.tzinfo is None:
            last_verified_at = last_verified_at.replace(tzinfo=timezone.utc)

        age_seconds = (datetime.now(timezone.utc) - last_verified_at).total_seconds()
        return age_seconds > (threshold * 60)

    def _record_price_change(
        self,
        offer_id: Union[str, uuid.UUID],
        old_price: int,
        new_price: int,
    ) -> None:
        """Log and store a price change event in internal audit history.

        Args:
            offer_id: Identifier of the fare offer.
            old_price: Previous price in paise.
            new_price: New price in paise.
        """
        change_amount = new_price - old_price
        direction = "up" if change_amount > 0 else "down"

        entry: Dict[str, Any] = {
            "offer_id": str(offer_id),
            "old_price_paise": old_price,
            "new_price_paise": new_price,
            "change_amount_paise": change_amount,
            "change_direction": direction,
            "recorded_at": datetime.now(timezone.utc),
        }
        self._price_change_history.append(entry)

        logger.info(
            "Price change recorded for offer '%s': %d paise -> %d paise (%s %d paise)",
            str(offer_id),
            old_price,
            new_price,
            direction,
            abs(change_amount),
        )

    def _get_verification_priority(
        self,
        offers: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """Order offers by verification priority, with cheapest fares first."""
        return sorted(
            offers,
            key=lambda o: o.get("total_price_paise", float("inf")),
        )

    async def verify_price(
        self,
        offer_id: Union[str, uuid.UUID],
        supplier: Any,
        journey_fingerprint: str = "",
        stored_price_paise: Optional[int] = None,
    ) -> VerificationResult:
        """Verify the current real-time price of an offer against the supplier adapter.

        Args:
            offer_id: Unique offer ID.
            supplier: Supplier adapter instance implementing verify_price().
            journey_fingerprint: Unique journey SHA256 fingerprint.
            stored_price_paise: Previously known price in paise.

        Returns:
            VerificationResult detailing status, new price, difference, and direction.
        """
        now = datetime.now(timezone.utc)
        prev_price = stored_price_paise if stored_price_paise is not None else 0

        try:
            # Query supplier's verify_price method
            supplier_res = await supplier.verify_price(
                offer_id=str(offer_id),
                journey_fingerprint=journey_fingerprint,
            )

            # Adapt from PriceVerificationResult object or dictionary
            if hasattr(supplier_res, "status"):
                status = supplier_res.status
                curr_price = getattr(supplier_res, "current_price_paise", prev_price)
                if prev_price == 0 and hasattr(supplier_res, "original_price_paise"):
                    prev_price = supplier_res.original_price_paise
            elif isinstance(supplier_res, dict):
                status = supplier_res.get("status", "verified")
                curr_price = supplier_res.get("current_price_paise", prev_price)
                if prev_price == 0:
                    prev_price = supplier_res.get("original_price_paise", curr_price)
            else:
                status = "verified"
                curr_price = prev_price

            # If supplier reported unavailable
            if status == "unavailable":
                return VerificationResult(
                    status="unavailable",
                    previous_price_paise=prev_price,
                    current_price_paise=prev_price,
                    verified_at=now,
                    price_changed=False,
                    change_amount_paise=0,
                    change_direction="none",
                )

            change_amount = curr_price - prev_price
            price_changed = (change_amount != 0)

            if price_changed:
                direction = "up" if change_amount > 0 else "down"
                final_status = "price_changed"
                self._record_price_change(offer_id, prev_price, curr_price)
            else:
                direction = "none"
                final_status = "verified"

            return VerificationResult(
                status=final_status,
                previous_price_paise=prev_price,
                current_price_paise=curr_price,
                verified_at=now,
                price_changed=price_changed,
                change_amount_paise=change_amount,
                change_direction=direction,
            )

        except Exception as exc:
            logger.error(
                "Error during price verification for offer '%s': %s",
                offer_id,
                exc,
                exc_info=True,
            )
            return VerificationResult(
                status="unavailable",
                previous_price_paise=prev_price,
                current_price_paise=prev_price,
                verified_at=now,
                price_changed=False,
                change_amount_paise=0,
                change_direction="none",
            )
