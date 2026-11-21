"""Flight price alert endpoints for FairFare API v1.

Enables users to create, view, update, and remove price threshold alerts for routes.
"""

from datetime import date, datetime, timedelta, timezone
import logging
from typing import List, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.api.deps import RateLimitDep, get_current_active_user, get_optional_user
from app.schemas.alert import AlertCreate, AlertResponse, AlertUpdate

logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory store for simulated alerts
_alerts_db: dict[UUID, dict] = {}


def _init_default_mock_alerts() -> None:
    """Pre-populate mock alerts if the store is empty."""
    if _alerts_db:
        return

    now = datetime.now(timezone.utc)
    today = date.today()

    demo_alerts = [
        {
            "id": UUID("50000000-0000-0000-0000-000000000001"),
            "origin": "DEL",
            "destination": "BOM",
            "departure_date": today + timedelta(days=14),
            "return_date": None,
            "target_price_paise": 400000,  # ₹4,000.00
            "current_lowest_paise": 385000,  # ₹3,850.00 (triggered)
            "cabin_class": "economy",
            "is_active": True,
            "trigger_count": 2,
            "last_checked_at": now - timedelta(minutes=15),
            "created_at": now - timedelta(days=3),
        },
        {
            "id": UUID("50000000-0000-0000-0000-000000000002"),
            "origin": "BLR",
            "destination": "DEL",
            "departure_date": today + timedelta(days=21),
            "return_date": today + timedelta(days=25),
            "target_price_paise": 900000,  # ₹9,000.00
            "current_lowest_paise": 950000,  # ₹9,500.00 (not triggered)
            "cabin_class": "economy",
            "is_active": True,
            "trigger_count": 0,
            "last_checked_at": now - timedelta(minutes=45),
            "created_at": now - timedelta(days=5),
        },
        {
            "id": UUID("50000000-0000-0000-0000-000000000003"),
            "origin": "BOM",
            "destination": "GOI",
            "departure_date": today + timedelta(days=35),
            "return_date": None,
            "target_price_paise": 300000,  # ₹3,000.00
            "current_lowest_paise": 340000,
            "cabin_class": "economy",
            "is_active": False,
            "trigger_count": 1,
            "last_checked_at": now - timedelta(days=1),
            "created_at": now - timedelta(days=10),
        },
    ]

    for alert in demo_alerts:
        _alerts_db[alert["id"]] = alert


_init_default_mock_alerts()


@router.get(
    "",
    response_model=List[AlertResponse],
    summary="List user price alerts",
    description="Retrieve all active and paused flight fare alerts created by the user.",
)
async def get_alerts(
    current_user=Depends(get_optional_user),
) -> List[AlertResponse]:
    """Return all price alerts for the authenticated user."""
    _init_default_mock_alerts()
    alerts = [AlertResponse(**item) for item in _alerts_db.values()]
    alerts.sort(key=lambda a: a.created_at, reverse=True)
    logger.info("Returning %d alerts", len(alerts))
    return alerts


@router.post(
    "",
    response_model=AlertResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new price alert",
    description="Set a target price threshold to monitor route prices and receive alerts.",
    dependencies=[Depends(RateLimitDep(requests_per_minute=20))],
)
async def create_alert(
    payload: AlertCreate,
    current_user=Depends(get_optional_user),
) -> AlertResponse:
    """Create a new flight fare monitor alert."""
    alert_id = uuid4()
    now = datetime.now(timezone.utc)

    # Initial simulated current lowest price (slightly above target)
    initial_current_lowest = payload.target_price_paise + 35000

    new_alert = {
        "id": alert_id,
        "origin": payload.origin,
        "destination": payload.destination,
        "departure_date": payload.departure_date,
        "return_date": payload.return_date,
        "target_price_paise": payload.target_price_paise,
        "current_lowest_paise": initial_current_lowest,
        "cabin_class": payload.cabin_class,
        "is_active": True,
        "trigger_count": 0,
        "last_checked_at": now,
        "created_at": now,
    }

    _alerts_db[alert_id] = new_alert
    logger.info("Created price alert %s: %s -> %s @ target %d paise", alert_id, payload.origin, payload.destination, payload.target_price_paise)
    return AlertResponse(**new_alert)


@router.put(
    "/{alert_id}",
    response_model=AlertResponse,
    summary="Update price alert",
    description="Modify target price threshold or toggle active/inactive status.",
)
async def update_alert(
    alert_id: UUID,
    payload: AlertUpdate,
    current_user=Depends(get_optional_user),
) -> AlertResponse:
    """Update price alert configuration."""
    _init_default_mock_alerts()
    alert = _alerts_db.get(alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Price alert {alert_id} not found",
        )

    if payload.target_price_paise is not None:
        alert["target_price_paise"] = payload.target_price_paise
    if payload.is_active is not None:
        alert["is_active"] = payload.is_active

    logger.info("Updated price alert %s", alert_id)
    return AlertResponse(**alert)


@router.delete(
    "/{alert_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete price alert",
    description="Remove a price alert from monitoring.",
)
async def delete_alert(
    alert_id: UUID,
    current_user=Depends(get_optional_user),
) -> Response:
    """Delete a price alert permanently."""
    _init_default_mock_alerts()
    if alert_id in _alerts_db:
        del _alerts_db[alert_id]
        logger.info("Deleted price alert %s", alert_id)
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Price alert {alert_id} not found",
    )
