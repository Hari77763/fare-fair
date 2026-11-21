"""Abstract base class and core contracts for FairFare supplier adapters.

This module defines the foundational FlightSupplier abstract base class,
the CircuitBreaker pattern for resilience, rate limiting, retry mechanisms,
and dataclasses for supplier health and price verification.
"""

from __future__ import annotations

import abc
import asyncio
from collections import deque
from dataclasses import dataclass
from datetime import datetime, timezone
import logging
import math
import random
import time
from typing import Any, Callable, Coroutine, Dict, List, Optional, TypeVar, Union

logger = logging.getLogger(__name__)

T = TypeVar("T")


# ============================================================================
# Dataclasses
# ============================================================================

@dataclass
class HealthStatus:
    """Represents the current operational status of a supplier connection."""

    is_healthy: bool
    latency_ms: int
    last_check: datetime
    error: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert health status to a serializable dictionary."""
        return {
            "is_healthy": self.is_healthy,
            "latency_ms": self.latency_ms,
            "last_check": self.last_check.isoformat(),
            "error": self.error,
        }


@dataclass
class PriceVerificationResult:
    """Represents the outcome of a pre-booking price verification check."""

    status: str  # "verified", "price_changed", "unavailable"
    original_price_paise: int
    current_price_paise: int
    verified_at: datetime
    price_changed: bool
    change_amount_paise: int

    def to_dict(self) -> Dict[str, Any]:
        """Convert price verification result to a serializable dictionary."""
        return {
            "status": self.status,
            "original_price_paise": self.original_price_paise,
            "current_price_paise": self.current_price_paise,
            "verified_at": self.verified_at.isoformat(),
            "price_changed": self.price_changed,
            "change_amount_paise": self.change_amount_paise,
        }


# ============================================================================
# Exceptions
# ============================================================================

class SupplierError(Exception):
    """Base exception for all supplier adapter errors."""

    def __init__(self, message: str, supplier_code: Optional[str] = None) -> None:
        super().__init__(message)
        self.message = message
        self.supplier_code = supplier_code


class SupplierTimeoutError(SupplierError):
    """Raised when a supplier API call exceeds configured timeout."""


class SupplierRateLimitError(SupplierError):
    """Raised when request quota or rate limits for a supplier are exceeded."""


class SupplierConnectionError(SupplierError):
    """Raised when network transport or HTTP connectivity fails."""


class CircuitBreakerOpenError(SupplierError):
    """Raised when a request is blocked because the supplier circuit breaker is OPEN."""


# ============================================================================
# Circuit Breaker
# ============================================================================

class CircuitBreaker:
    """Resilient Circuit Breaker to prevent cascading failures.

    States:
        - "closed": Normal operation. Requests flow freely.
        - "open": Failures exceeded threshold. Requests are blocked immediately.
        - "half_open": Recovery test period. A limited number of trial requests execute.
    """

    STATE_CLOSED = "closed"
    STATE_OPEN = "open"
    STATE_HALF_OPEN = "half_open"

    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: float = 60.0,
        half_open_success_threshold: int = 2,
    ) -> None:
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.half_open_success_threshold = half_open_success_threshold

        self._state: str = self.STATE_CLOSED
        self._failure_count: int = 0
        self._success_count: int = 0
        self._last_state_change: float = time.monotonic()
        self._lock = asyncio.Lock()

    @property
    def state(self) -> str:
        """Get the current circuit state, transitioning from OPEN to HALF_OPEN if timeout elapsed."""
        if self._state == self.STATE_OPEN:
            elapsed = time.monotonic() - self._last_state_change
            if elapsed >= self.recovery_timeout:
                self._state = self.STATE_HALF_OPEN
                self._last_state_change = time.monotonic()
                self._success_count = 0
                logger.info(
                    "Circuit breaker recovery timeout reached (%.1fs). State -> HALF_OPEN",
                    elapsed,
                )
        return self._state

    async def can_execute(self) -> bool:
        """Check whether a request is allowed to execute under current circuit state."""
        async with self._lock:
            current_state = self.state
            if current_state == self.STATE_CLOSED:
                return True
            if current_state == self.STATE_HALF_OPEN:
                return True
            # STATE_OPEN
            return False

    async def record_success(self) -> None:
        """Record a successful execution, recovering circuit state if half-open."""
        async with self._lock:
            current_state = self.state
            if current_state == self.STATE_HALF_OPEN:
                self._success_count += 1
                if self._success_count >= self.half_open_success_threshold:
                    self._state = self.STATE_CLOSED
                    self._failure_count = 0
                    self._success_count = 0
                    self._last_state_change = time.monotonic()
                    logger.info("Circuit breaker recovered successfully. State -> CLOSED")
            elif current_state == self.STATE_CLOSED:
                self._failure_count = 0

    async def record_failure(self) -> None:
        """Record an execution failure, potentially tripping the circuit to OPEN."""
        async with self._lock:
            current_state = self.state
            self._failure_count += 1
            if current_state == self.STATE_HALF_OPEN:
                self._state = self.STATE_OPEN
                self._last_state_change = time.monotonic()
                logger.warning(
                    "Failure occurred during HALF_OPEN trial. Circuit tripped back -> OPEN"
                )
            elif current_state == self.STATE_CLOSED:
                if self._failure_count >= self.failure_threshold:
                    self._state = self.STATE_OPEN
                    self._last_state_change = time.monotonic()
                    logger.error(
                        "Failure threshold (%d) reached. Circuit tripped -> OPEN",
                        self.failure_threshold,
                    )


# ============================================================================
# Abstract FlightSupplier Base Class
# ============================================================================

class FlightSupplier(abc.ABC):
    """Abstract Base Class for FairFare flight suppliers (GDS, OTA, Airline Direct APIs).

    Every supplier adapter subclass must implement standard search, normalization,
    price verification, capabilities, health check, and terms methods. Subclasses inherit
    built-in token-bucket rate limiting, timeout enforcement, exponential backoff retries,
    and circuit breaking.
    """

    def __init__(self) -> None:
        self.circuit_breaker = CircuitBreaker(
            failure_threshold=5,
            recovery_timeout=60.0,
            half_open_success_threshold=2,
        )
        self._rate_limit_lock = asyncio.Lock()
        self._request_timestamps: deque[float] = deque()

    # ------------------------------------------------------------------------
    # Abstract Properties
    # ------------------------------------------------------------------------

    @property
    @abc.abstractmethod
    def name(self) -> str:
        """Human-readable display name of the supplier (e.g. 'Amadeus GDS')."""

    @property
    @abc.abstractmethod
    def code(self) -> str:
        """Unique uppercase alphanumeric identifier code (e.g. 'AMADEUS', 'MOCK')."""

    @property
    @abc.abstractmethod
    def supplier_type(self) -> str:
        """Supplier integration type (e.g. 'gds', 'airline_direct', 'ota', 'aggregator')."""

    @property
    @abc.abstractmethod
    def base_url(self) -> str:
        """Target API base URL for outbound network requests."""

    @property
    @abc.abstractmethod
    def is_active(self) -> bool:
        """Whether this supplier is active and eligible to receive search traffic."""

    @property
    @abc.abstractmethod
    def is_trusted(self) -> bool:
        """Whether this supplier is trusted for transparent fare presentation."""

    @property
    @abc.abstractmethod
    def trust_score(self) -> float:
        """Trust rating between 0.0 and 1.0 reflecting pricing fidelity and fulfillment reliability."""

    @property
    @abc.abstractmethod
    def priority(self) -> int:
        """Priority weighting integer (higher integer = higher precedence in rank sorting)."""

    @property
    @abc.abstractmethod
    def timeout_seconds(self) -> int:
        """Default maximum timeout in seconds allowed for external API calls."""

    @property
    @abc.abstractmethod
    def rate_limit_per_minute(self) -> int:
        """Maximum number of outbound requests allowed within a rolling 60-second window."""

    # ------------------------------------------------------------------------
    # Abstract Async Methods
    # ------------------------------------------------------------------------

    @abc.abstractmethod
    async def search(
        self,
        origin: str,
        dest: str,
        departure_date: Union[str, Any],
        return_date: Optional[Union[str, Any]] = None,
        passengers: int = 1,
        cabin_class: str = "economy",
    ) -> List[Dict[str, Any]]:
        """Query the supplier API for available flights matching criteria.

        Args:
            origin: 3-letter IATA airport code of origin (e.g., 'DEL').
            dest: 3-letter IATA airport code of destination (e.g., 'BOM').
            departure_date: Date of departure in ISO format ('YYYY-MM-DD') or date object.
            return_date: Optional return date for round trips in ISO format ('YYYY-MM-DD').
            passengers: Total passenger seat count (defaults to 1).
            cabin_class: Travel class ('economy', 'premium_economy', 'business', 'first').

        Returns:
            List of normalized flight offer dictionaries conforming to FairFare canonical schema.
        """

    @abc.abstractmethod
    async def normalize(self, raw_response: Any) -> List[Dict[str, Any]]:
        """Transform raw supplier API response payload into canonical FairFare offer format.

        Args:
            raw_response: Raw JSON, dict, or data structure returned by supplier API.

        Returns:
            List of normalized offer dicts containing journey, segment, and fare details.
        """

    @abc.abstractmethod
    async def verify_price(
        self,
        offer_id: str,
        journey_fingerprint: str,
    ) -> PriceVerificationResult:
        """Perform real-time re-pricing check with supplier before checkout/redirect.

        Args:
            offer_id: Unique supplier offer identifier.
            journey_fingerprint: Deterministic fingerprint identifying the specific journey.

        Returns:
            PriceVerificationResult indicating whether price is unchanged, modified, or expired.
        """

    @abc.abstractmethod
    async def get_capabilities(self) -> Dict[str, Any]:
        """Return supplier-supported features (e.g., multi-city, seat selection, ancillaries)."""

    @abc.abstractmethod
    async def health_check(self) -> HealthStatus:
        """Perform lightweight diagnostic check against supplier endpoint."""

    @abc.abstractmethod
    async def get_terms(self) -> Dict[str, Any]:
        """Return legal terms, cancellation policies, refund processing timelines, and baggage rules."""

    # ------------------------------------------------------------------------
    # Concrete Resiliency and Utility Methods
    # ------------------------------------------------------------------------

    async def _apply_rate_limit(self) -> None:
        """Enforce rolling 60-second token bucket rate limit using sliding window timestamps.

        Suspends caller via asyncio.sleep if rolling window capacity is reached.
        """
        async with self._rate_limit_lock:
            now = time.monotonic()
            window_start = now - 60.0

            # Prune timestamps older than 60 seconds
            while self._request_timestamps and self._request_timestamps[0] <= window_start:
                self._request_timestamps.popleft()

            # If capacity reached, wait until the oldest recorded request rolls out of the window
            if len(self._request_timestamps) >= self.rate_limit_per_minute:
                oldest_timestamp = self._request_timestamps[0]
                sleep_duration = max(0.01, 60.0 - (now - oldest_timestamp))
                logger.warning(
                    "Supplier %s rate limit reached (%d/min). Throttling for %.2fs",
                    self.code,
                    self.rate_limit_per_minute,
                    sleep_duration,
                )
                await asyncio.sleep(sleep_duration)
                # Re-clean after waking up
                now = time.monotonic()
                window_start = now - 60.0
                while self._request_timestamps and self._request_timestamps[0] <= window_start:
                    self._request_timestamps.popleft()

            self._request_timestamps.append(time.monotonic())

    async def _apply_timeout(
        self,
        coro: Coroutine[Any, Any, T],
        timeout: Optional[float] = None,
    ) -> T:
        """Execute a coroutine wrapped in an asyncio timeout ceiling.

        Args:
            coro: The coroutine to execute.
            timeout: Maximum allowed execution time in seconds. Defaults to self.timeout_seconds.

        Returns:
            The coroutine result.

        Raises:
            SupplierTimeoutError: If execution exceeds timeout ceiling.
        """
        effective_timeout = timeout if timeout is not None else float(self.timeout_seconds)
        try:
            return await asyncio.wait_for(coro, timeout=effective_timeout)
        except asyncio.TimeoutError as err:
            logger.error(
                "Supplier %s timed out after %.2f seconds",
                self.code,
                effective_timeout,
            )
            raise SupplierTimeoutError(
                f"Supplier {self.code} timed out after {effective_timeout:.2f}s",
                supplier_code=self.code,
            ) from err

    async def _retry_with_backoff(
        self,
        coro_func: Callable[[], Coroutine[Any, Any, T]],
        max_retries: int = 3,
        base_delay: float = 0.5,
        max_delay: float = 5.0,
    ) -> T:
        """Execute coroutine with exponential backoff and randomized full jitter.

        Args:
            coro_func: Factory callable returning a new Coroutine instance per attempt.
            max_retries: Maximum number of retry attempts before propagating failure.
            base_delay: Initial retry delay in seconds.
            max_delay: Ceiling cap for retry delay in seconds.

        Returns:
            Result of the successful coroutine execution.

        Raises:
            CircuitBreakerOpenError: If circuit breaker refuses execution.
            SupplierError: Propagated if all retry attempts fail.
        """
        if not await self.circuit_breaker.can_execute():
            raise CircuitBreakerOpenError(
                f"Circuit breaker for supplier {self.code} is OPEN. Calls rejected.",
                supplier_code=self.code,
            )

        last_exception: Optional[Exception] = None

        for attempt in range(max_retries + 1):
            try:
                await self._apply_rate_limit()
                result = await self._apply_timeout(coro_func())
                await self.circuit_breaker.record_success()
                return result
            except (SupplierTimeoutError, SupplierConnectionError) as exc:
                last_exception = exc
                await self.circuit_breaker.record_failure()

                if attempt >= max_retries:
                    logger.error(
                        "Supplier %s exhausted all %d retries. Last error: %s",
                        self.code,
                        max_retries,
                        str(exc),
                    )
                    break

                # Exponential backoff with full jitter
                exp_delay = min(max_delay, base_delay * (2 ** attempt))
                jittered_delay = random.uniform(0.1, exp_delay)
                logger.warning(
                    "Supplier %s attempt %d failed (%s). Retrying in %.2fs...",
                    self.code,
                    attempt + 1,
                    str(exc),
                    jittered_delay,
                )
                await asyncio.sleep(jittered_delay)
            except Exception as exc:
                # Other unexpected exceptions recorded as failure without retry
                await self.circuit_breaker.record_failure()
                raise exc

        if last_exception:
            raise last_exception
        raise SupplierError(
            f"Execution failed for supplier {self.code} with unknown error",
            supplier_code=self.code,
        )
