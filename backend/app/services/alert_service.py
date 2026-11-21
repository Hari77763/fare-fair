"""Price alert tracking and trigger service for FairFare.

Stores user flight price alerts, simulates route price checks, and notifies
when live route prices drop below user-specified target thresholds.
"""

from __future__ import annotations

import logging
import random
import uuid
from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional, Union

logger = logging.getLogger(__name__)


class AlertService:
    """Manages creation, lifecycle, and periodic evaluation of flight price alerts."""

    def __init__(self) -> None:
        """Initialize in-memory alert storage."""
        # Key: alert_id (str) -> alert dict
        self._alerts: Dict[str, Dict[str, Any]] = {}

    async def create_alert(
        self,
        user_id: Union[str, uuid.UUID],
        alert_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Create a new price alert for a user.

        Args:
            user_id: User identifier.
            alert_data: Dictionary containing origin, destination, departure_date,
                        target_price_paise, and optional return_date, cabin_class.

        Returns:
            The created alert dictionary with UUID key and timestamps.
        """
        alert_id = str(uuid.uuid4())
        dept_date = alert_data.get("departure_date")
        if isinstance(dept_date, (date, datetime)):
            dept_str = dept_date.isoformat()
        else:
            dept_str = str(dept_date)

        ret_date = alert_data.get("return_date")
        ret_str = None
        if ret_date:
            ret_str = ret_date.isoformat() if isinstance(ret_date, (date, datetime)) else str(ret_date)

        target_price = int(alert_data.get("target_price_paise", 0))
        cabin = alert_data.get("cabin_class", "economy")

        now_iso = datetime.now(timezone.utc).isoformat()

        alert_record: Dict[str, Any] = {
            "id": alert_id,
            "user_id": str(user_id),
            "origin": str(alert_data.get("origin", "")).strip().upper(),
            "destination": str(alert_data.get("destination", "")).strip().upper(),
            "departure_date": dept_str,
            "return_date": ret_str,
            "target_price_paise": target_price,
            "current_lowest_paise": alert_data.get("current_lowest_paise"),
            "cabin_class": cabin,
            "is_active": True,
            "trigger_count": 0,
            "last_triggered_at": None,
            "last_checked_at": None,
            "created_at": now_iso,
            "updated_at": now_iso,
        }

        self._alerts[alert_id] = alert_record
        logger.info(
            "Created price alert %s for user %s (%s -> %s, target: ₹%.2f)",
            alert_id,
            user_id,
            alert_record["origin"],
            alert_record["destination"],
            target_price / 100.0,
        )
        return alert_record

    async def get_user_alerts(self, user_id: Union[str, uuid.UUID]) -> List[Dict[str, Any]]:
        """Fetch all alerts configured by a specific user.

        Args:
            user_id: User identifier.

        Returns:
            List of alert records.
        """
        uid_str = str(user_id)
        return [
            alert for alert in self._alerts.values()
            if alert["user_id"] == uid_str
        ]

    async def update_alert(
        self,
        alert_id: str,
        user_id: Union[str, uuid.UUID],
        update_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Update an existing price alert's target price or active status.

        Args:
            alert_id: Unique alert ID.
            user_id: User ID (ownership check).
            update_data: Fields to update (e.g. 'target_price_paise', 'is_active').

        Returns:
            Updated alert dictionary.

        Raises:
            KeyError: If alert is not found.
            PermissionError: If alert does not belong to user.
        """
        alert = self._alerts.get(str(alert_id))
        if not alert:
            raise KeyError(f"Alert with id '{alert_id}' not found")

        if alert["user_id"] != str(user_id):
            raise PermissionError("User is not authorized to modify this alert")

        if "target_price_paise" in update_data:
            alert["target_price_paise"] = int(update_data["target_price_paise"])

        if "is_active" in update_data:
            alert["is_active"] = bool(update_data["is_active"])

        alert["updated_at"] = datetime.now(timezone.utc).isoformat()
        logger.info("Updated price alert %s for user %s", alert_id, user_id)
        return alert

    async def deactivate_alert(
        self,
        alert_id: str,
        user_id: Union[str, uuid.UUID],
    ) -> bool:
        """Deactivate a price alert for a user.

        Args:
            alert_id: Unique alert ID.
            user_id: User ID.

        Returns:
            True if successfully deactivated, False otherwise.
        """
        try:
            await self.update_alert(alert_id, user_id, {"is_active": False})
            return True
        except (KeyError, PermissionError):
            return False

    async def _get_current_price(
        self,
        origin: str,
        dest: str,
        date: Any,
        cabin: str = "economy",
    ) -> int:
        """Simulate obtaining current lowest market price for a route in paise.

        In production, this queries the search orchestrator or fare cache.
        Returns mock realistic domestic fare in paise (₹3,000 to ₹12,000).
        """
        base_rupees = random.randint(3000, 12000)
        if cabin in ("business", "first"):
            base_rupees *= 3
        elif cabin == "premium_economy":
            base_rupees = int(base_rupees * 1.5)
        return base_rupees * 100

    def _should_notify(self, alert: Dict[str, Any], current_price: int) -> bool:
        """Determine if an alert condition is satisfied.

        Condition: alert is active and current price <= target price.

        Args:
            alert: Alert record dictionary.
            current_price: Current market lowest price in paise.

        Returns:
            True if notification condition is met, False otherwise.
        """
        if not alert.get("is_active", True):
            return False

        target = alert.get("target_price_paise", 0)
        return current_price <= target

    async def check_alerts(self) -> List[Dict[str, Any]]:
        """Check all active alerts against current market prices and trigger matches.

        Returns:
            List of triggered alerts with updated metrics.
        """
        triggered_alerts: List[Dict[str, Any]] = []
        now = datetime.now(timezone.utc)

        for alert in list(self._alerts.values()):
            if not alert.get("is_active", True):
                continue

            current_price = await self._get_current_price(
                origin=alert["origin"],
                dest=alert["destination"],
                date=alert["departure_date"],
                cabin=alert.get("cabin_class", "economy"),
            )

            alert["last_checked_at"] = now.isoformat()
            alert["current_lowest_paise"] = current_price

            if self._should_notify(alert, current_price):
                alert["trigger_count"] = alert.get("trigger_count", 0) + 1
                alert["last_triggered_at"] = now.isoformat()
                alert["updated_at"] = now.isoformat()

                triggered_record = dict(alert)
                triggered_record["triggered_price_paise"] = current_price
                triggered_alerts.append(triggered_record)

                logger.info(
                    "TRIGGERED alert %s for user %s: route %s->%s current ₹%.2f <= target ₹%.2f",
                    alert["id"],
                    alert["user_id"],
                    alert["origin"],
                    alert["destination"],
                    current_price / 100.0,
                    alert["target_price_paise"] / 100.0,
                )

        return triggered_alerts
