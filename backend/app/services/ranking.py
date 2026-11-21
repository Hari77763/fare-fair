"""Ranking service for flight offers in FairFare.

Provides sorting and scoring algorithms:
- 'cheapest': strict ascending price sorting.
- 'cheapest_trusted': price sorting filtered by supplier trust score threshold (>= 0.8).
- 'best_value': weighted composite score balancing price (60%), trust (25%), and amenities (15%).
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


@dataclass
class RankedResults:
    """Container for ranking results and highlighted top picks."""

    ranked_offers: List[Dict[str, Any]]
    cheapest: Optional[Dict[str, Any]]
    cheapest_trusted: Optional[Dict[str, Any]]
    filters_applied: Dict[str, Any] = field(default_factory=dict)


class RankingService:
    """Service to rank, score, and select optimal flight offers."""

    def _get_cheapest_offer(self, offers: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Return the single offer with the lowest total_price_paise, or None if list is empty."""
        if not offers:
            return None
        return min(offers, key=lambda o: o.get("total_price_paise", float("inf")))

    def _get_cheapest_trusted_offer(
        self,
        offers: List[Dict[str, Any]],
        min_trust: float = 0.80,
    ) -> Optional[Dict[str, Any]]:
        """Return the cheapest offer from a supplier meeting the minimum trust threshold."""
        trusted = [
            o for o in offers
            if float(o.get("supplier_trust_score", 0.0)) >= min_trust
        ]
        return self._get_cheapest_offer(trusted)

    def _calculate_trust_weighted_score(
        self,
        offer: Dict[str, Any],
        min_price: int,
        max_price: int,
    ) -> float:
        """Calculate composite 'best_value' score between 0.0 and 1.0.

        Weights:
        - Price (60%): Lower price gives higher score.
        - Trust (25%): Supplier trust score (0.0 to 1.0).
        - Amenities (15%): Meals (5%), seat selection (5%), refundability (5%).

        Returns:
            Composite score as float, higher is better.
        """
        price = offer.get("total_price_paise", max_price)

        # 1. Normalized Price Score (0.0 to 1.0)
        if max_price > min_price:
            price_score = 1.0 - ((price - min_price) / (max_price - min_price))
        else:
            price_score = 1.0
        price_score = max(0.0, min(1.0, price_score))

        # 2. Trust Score (0.0 to 1.0)
        trust_score = float(offer.get("supplier_trust_score", 0.8))
        trust_score = max(0.0, min(1.0, trust_score))

        # 3. Amenities Score (0.0 to 1.0)
        amenity_points = 0.0
        if offer.get("meal_included", False):
            amenity_points += 0.35
        if offer.get("seat_selection_included", False):
            amenity_points += 0.35
        if offer.get("is_refundable", False):
            amenity_points += 0.30
        amenity_score = min(1.0, amenity_points)

        # 4. Composite weighted sum
        composite_score = (
            (0.60 * price_score)
            + (0.25 * trust_score)
            + (0.15 * amenity_score)
        )
        return round(composite_score, 4)

    def rank_offers(
        self,
        offers: List[Dict[str, Any]],
        ranking_type: str = "cheapest",
        min_trust_score: float = 0.80,
        **filter_kwargs: Any,
    ) -> RankedResults:
        """Rank a collection of flight offers according to requested ranking criteria.

        Args:
            offers: List of normalized offer dictionaries.
            ranking_type: One of 'cheapest', 'cheapest_trusted', 'best_value'.
            min_trust_score: Threshold for 'cheapest_trusted' and trust checks.
            **filter_kwargs: Additional filter parameters to record.

        Returns:
            RankedResults containing the ordered list, cheapest, cheapest_trusted, and filter metadata.
        """
        if not offers:
            return RankedResults(
                ranked_offers=[],
                cheapest=None,
                cheapest_trusted=None,
                filters_applied={"ranking_type": ranking_type, **filter_kwargs},
            )

        cheapest = self._get_cheapest_offer(offers)
        cheapest_trusted = self._get_cheapest_trusted_offer(offers, min_trust=min_trust_score)

        normalized_ranking_type = ranking_type.strip().lower()

        if normalized_ranking_type == "cheapest_trusted":
            # Filter offers with trust score >= min_trust_score, sort by price ASC
            trusted_offers = [
                o for o in offers
                if float(o.get("supplier_trust_score", 0.0)) >= min_trust_score
            ]
            ranked = sorted(
                trusted_offers,
                key=lambda o: o.get("total_price_paise", float("inf")),
            )
            logger.debug(
                "Ranked %d trusted offers (min_trust=%.2f) by cheapest price",
                len(ranked),
                min_trust_score,
            )

        elif normalized_ranking_type == "best_value":
            # Composite score: Price (60%), Trust (25%), Amenities (15%)
            prices = [o.get("total_price_paise", 0) for o in offers if o.get("total_price_paise", 0) > 0]
            min_price = min(prices) if prices else 1
            max_price = max(prices) if prices else 1

            # Attach composite score and sort DESC (highest score first)
            scored_offers = []
            for o in offers:
                score = self._calculate_trust_weighted_score(o, min_price, max_price)
                scored = dict(o)
                scored["value_score"] = score
                scored_offers.append(scored)

            ranked = sorted(
                scored_offers,
                key=lambda o: (o.get("value_score", 0.0), -o.get("total_price_paise", float("inf"))),
                reverse=True,
            )
            logger.debug("Ranked %d offers by best_value composite score", len(ranked))

        else:
            # Default: 'cheapest' - sort by total_price_paise ASC
            ranked = sorted(
                offers,
                key=lambda o: o.get("total_price_paise", float("inf")),
            )
            logger.debug("Ranked %d offers by cheapest total_price_paise", len(ranked))

        return RankedResults(
            ranked_offers=ranked,
            cheapest=cheapest,
            cheapest_trusted=cheapest_trusted,
            filters_applied={
                "ranking_type": normalized_ranking_type,
                "min_trust_score": min_trust_score,
                **filter_kwargs,
            },
        )
