"""Flight search orchestration across multiple flight suppliers.

Coordinates concurrent supplier queries, handles timeouts, circuit breaker states,
tracks per-supplier metrics, aggregates partial responses, and maintains an in-memory cache.
"""

from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Any, Dict, List, Optional, Union

logger = logging.getLogger(__name__)


@dataclass
class SupplierStats:
    """Performance and response statistics for an individual supplier during a search."""

    name: str
    status: str  # "success" | "error" | "timeout" | "circuit_open"
    latency_ms: int
    offer_count: int
    error: Optional[str] = None


@dataclass
class SearchResult:
    """Aggregated search result containing offers from all queried suppliers."""

    all_offers: List[Dict[str, Any]]
    supplier_stats: List[SupplierStats]
    search_duration_ms: int
    from_cache: bool = False


class SearchOrchestrator:
    """Orchestrates concurrent searches across multiple flight suppliers with caching and resilience."""

    def __init__(
        self,
        suppliers: Optional[List[Any]] = None,
        cache_ttl_seconds: int = 300,
        default_supplier_timeout_seconds: float = 15.0,
    ) -> None:
        """Initialize the search orchestrator.

        Args:
            suppliers: List of FlightSupplier instances to query.
            cache_ttl_seconds: Cache time-to-live in seconds (default 300s / 5min).
            default_supplier_timeout_seconds: Default timeout for supplier searches.
        """
        self.suppliers: List[Any] = suppliers or []
        self.cache_ttl_seconds: int = cache_ttl_seconds
        self.default_supplier_timeout: float = default_supplier_timeout_seconds
        # In-memory cache storage: key -> (cached_at_timestamp, offers)
        self._cache: Dict[str, tuple[float, List[Dict[str, Any]]]] = {}

    def _build_cache_key(
        self,
        origin: str,
        destination: str,
        departure_date: Union[str, date],
        return_date: Optional[Union[str, date]] = None,
        cabin_class: str = "economy",
    ) -> str:
        """Build a deterministic cache key for a flight search route and parameters."""
        dept_str = departure_date.isoformat() if isinstance(departure_date, (date, datetime)) else str(departure_date)
        ret_str = ""
        if return_date:
            ret_str = return_date.isoformat() if isinstance(return_date, (date, datetime)) else str(return_date)
        return (
            f"{origin.strip().upper()}:"
            f"{destination.strip().upper()}:"
            f"{dept_str}:"
            f"{ret_str or 'oneway'}:"
            f"{cabin_class.strip().lower()}"
        )

    def _check_cache(self, key: str) -> Optional[List[Dict[str, Any]]]:
        """Check if cached offers exist for the key and are not expired.

        Returns:
            Cached offers list if valid and unexpired, None otherwise.
        """
        cached = self._cache.get(key)
        if not cached:
            return None

        cached_at, offers = cached
        now = time.time()
        if now - cached_at > self.cache_ttl_seconds:
            # Expired cache entry, evict
            self._cache.pop(key, None)
            logger.debug("Cache expired for key: %s", key)
            return None

        logger.info("Cache hit for key: %s (age: %.1fs)", key, now - cached_at)
        return offers

    def _store_cache(self, key: str, results: List[Dict[str, Any]]) -> None:
        """Store search results in the in-memory cache."""
        self._cache[key] = (time.time(), results)
        logger.debug("Cached %d offers under key: %s", len(results), key)

    async def _query_supplier(
        self,
        supplier: Any,
        params: Dict[str, Any],
    ) -> tuple[List[Dict[str, Any]], SupplierStats]:
        """Query a single supplier with timeout, circuit breaker checks, and latency tracking.

        Returns:
            Tuple of (offers_list, supplier_stats).
        """
        supplier_name = getattr(supplier, "name", supplier.__class__.__name__)
        timeout_seconds = getattr(supplier, "timeout_seconds", self.default_supplier_timeout)
        circuit_breaker = getattr(supplier, "circuit_breaker", None)

        # Check circuit breaker if available
        if circuit_breaker is not None and hasattr(circuit_breaker, "can_execute"):
            if not circuit_breaker.can_execute():
                logger.warning("Circuit breaker OPEN for supplier: %s, skipping query", supplier_name)
                stats = SupplierStats(
                    name=supplier_name,
                    status="circuit_open",
                    latency_ms=0,
                    offer_count=0,
                    error="Circuit breaker is open",
                )
                return [], stats

        start_time = time.perf_counter()
        try:
            # Execute supplier search with timeout protection
            search_coro = supplier.search(**params)
            raw_offers = await asyncio.wait_for(search_coro, timeout=timeout_seconds)

            latency_ms = int((time.perf_counter() - start_time) * 1000)

            # Record success in circuit breaker if supported
            if circuit_breaker is not None and hasattr(circuit_breaker, "record_success"):
                circuit_breaker.record_success()

            offers = raw_offers if isinstance(raw_offers, list) else []
            stats = SupplierStats(
                name=supplier_name,
                status="success",
                latency_ms=latency_ms,
                offer_count=len(offers),
                error=None,
            )
            logger.info(
                "Supplier '%s' returned %d offers in %d ms",
                supplier_name,
                len(offers),
                latency_ms,
            )
            return offers, stats

        except asyncio.TimeoutError:
            latency_ms = int((time.perf_counter() - start_time) * 1000)
            logger.warning(
                "Supplier '%s' TIMED OUT after %d ms (threshold: %.1fs)",
                supplier_name,
                latency_ms,
                timeout_seconds,
            )
            if circuit_breaker is not None and hasattr(circuit_breaker, "record_failure"):
                circuit_breaker.record_failure()

            stats = SupplierStats(
                name=supplier_name,
                status="timeout",
                latency_ms=latency_ms,
                offer_count=0,
                error=f"Query timed out after {timeout_seconds}s",
            )
            return [], stats

        except Exception as exc:
            latency_ms = int((time.perf_counter() - start_time) * 1000)
            logger.error(
                "Supplier '%s' failed after %d ms with error: %s",
                supplier_name,
                latency_ms,
                exc,
                exc_info=True,
            )
            if circuit_breaker is not None and hasattr(circuit_breaker, "record_failure"):
                circuit_breaker.record_failure()

            stats = SupplierStats(
                name=supplier_name,
                status="error",
                latency_ms=latency_ms,
                offer_count=0,
                error=str(exc),
            )
            return [], stats

    async def search(
        self,
        origin: str,
        destination: str,
        departure_date: Union[str, date],
        return_date: Optional[Union[str, date]] = None,
        passengers: Optional[Union[int, Dict[str, int]]] = None,
        cabin_class: str = "economy",
    ) -> SearchResult:
        """Search flight offers across all registered suppliers concurrently.

        Args:
            origin: 3-letter IATA origin airport code.
            destination: 3-letter IATA destination airport code.
            departure_date: Date of departure.
            return_date: Date of return for round-trips (optional).
            passengers: Passenger count or breakdown dict.
            cabin_class: Cabin class (e.g. "economy", "business").

        Returns:
            SearchResult containing aggregated offers, per-supplier stats, duration, and cache flag.
        """
        overall_start = time.perf_counter()

        # 1. Check in-memory cache
        cache_key = self._build_cache_key(
            origin=origin,
            destination=destination,
            departure_date=departure_date,
            return_date=return_date,
            cabin_class=cabin_class,
        )
        cached_offers = self._check_cache(cache_key)
        if cached_offers is not None:
            total_duration_ms = int((time.perf_counter() - overall_start) * 1000)
            return SearchResult(
                all_offers=cached_offers,
                supplier_stats=[],
                search_duration_ms=total_duration_ms,
                from_cache=True,
            )

        # 2. Filter active suppliers
        active_suppliers = [
            s for s in self.suppliers
            if getattr(s, "is_active", True)
        ]

        if not active_suppliers:
            logger.warning("No active suppliers configured for search %s -> %s", origin, destination)
            return SearchResult(
                all_offers=[],
                supplier_stats=[],
                search_duration_ms=int((time.perf_counter() - overall_start) * 1000),
                from_cache=False,
            )

        # 3. Build supplier query parameters
        search_params: Dict[str, Any] = {
            "origin": origin,
            "destination": destination,
            "departure_date": departure_date,
            "return_date": return_date,
            "passengers": passengers if passengers is not None else 1,
            "cabin_class": cabin_class,
        }

        # 4. Concurrently query all active suppliers
        tasks = [
            self._query_supplier(supplier, search_params)
            for supplier in active_suppliers
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # 5. Process responses, aggregate partial results and stats
        all_offers: List[Dict[str, Any]] = []
        supplier_stats: List[SupplierStats] = []

        for idx, result in enumerate(results):
            supplier = active_suppliers[idx]
            supplier_name = getattr(supplier, "name", supplier.__class__.__name__)

            if isinstance(result, Exception):
                logger.error(
                    "Unexpected exception from supplier task '%s': %s",
                    supplier_name,
                    result,
                )
                supplier_stats.append(
                    SupplierStats(
                        name=supplier_name,
                        status="error",
                        latency_ms=0,
                        offer_count=0,
                        error=str(result),
                    )
                )
            elif isinstance(result, tuple) and len(result) == 2:
                offers, stats = result
                supplier_stats.append(stats)
                all_offers.extend(offers)
            else:
                logger.warning("Unknown result shape from supplier %s: %s", supplier_name, type(result))

        # 6. Store non-empty results in cache
        if all_offers:
            self._store_cache(cache_key, all_offers)

        total_duration_ms = int((time.perf_counter() - overall_start) * 1000)
        logger.info(
            "Completed search %s -> %s across %d suppliers: %d total offers found in %d ms",
            origin,
            destination,
            len(active_suppliers),
            len(all_offers),
            total_duration_ms,
        )

        return SearchResult(
            all_offers=all_offers,
            supplier_stats=supplier_stats,
            search_duration_ms=total_duration_ms,
            from_cache=False,
        )
