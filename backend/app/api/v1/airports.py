"""Airport lookup and autocomplete endpoints for FairFare API v1.

Provides search and listing for 60+ Indian and international airports
with IATA codes, city names, and timezones.
"""

import logging
from typing import Any, Dict, List

from fastapi import APIRouter, Query

logger = logging.getLogger(__name__)

router = APIRouter()

# Comprehensive catalog of 60+ Indian and major international airports
AIRPORTS_CATALOG: List[Dict[str, Any]] = [
    # Top Tier 1 Indian Metro Hubs
    {"code": "DEL", "name": "Indira Gandhi International Airport", "city": "New Delhi", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "BOM", "name": "Chhatrapati Shivaji Maharaj International Airport", "city": "Mumbai", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "BLR", "name": "Kempegowda International Airport", "city": "Bengaluru", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "MAA", "name": "Chennai International Airport", "city": "Chennai", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "HYD", "name": "Rajiv Gandhi International Airport", "city": "Hyderabad", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "CCU", "name": "Netaji Subhash Chandra Bose International Airport", "city": "Kolkata", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "GOI", "name": "Dabolim Airport", "city": "Goa", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "GOX", "name": "Manohar International Airport (Mopa)", "city": "Goa", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "COK", "name": "Cochin International Airport", "city": "Kochi", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "AMD", "name": "Sardar Vallabhbhai Patel International Airport", "city": "Ahmedabad", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "PNQ", "name": "Pune International Airport", "city": "Pune", "country": "India", "timezone": "Asia/Kolkata"},

    # Tier 2 & Regional Indian Airports
    {"code": "JAI", "name": "Jaipur International Airport", "city": "Jaipur", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "LKO", "name": "Chaudhary Charan Singh International Airport", "city": "Lucknow", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "IXC", "name": "Shaheed Bhagat Singh International Airport", "city": "Chandigarh", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "GAU", "name": "Lokpriya Gopinath Bordoloi International Airport", "city": "Guwahati", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "SXR", "name": "Sheikh ul-Alam International Airport", "city": "Srinagar", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "TRV", "name": "Thiruvananthapuram International Airport", "city": "Thiruvananthapuram", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "BBI", "name": "Biju Patnaik International Airport", "city": "Bhubaneswar", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "IDR", "name": "Devi Ahilya Bai Holkar Airport", "city": "Indore", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "PAT", "name": "Jay Prakash Narayan Airport", "city": "Patna", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "IXB", "name": "Bagdogra International Airport", "city": "Siliguri", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "NAG", "name": "Dr. Babasaheb Ambedkar International Airport", "city": "Nagpur", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "VNS", "name": "Lal Bahadur Shastri International Airport", "city": "Varanasi", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "RPR", "name": "Swami Vivekananda Airport", "city": "Raipur", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "IXR", "name": "Birsa Munda Airport", "city": "Ranchi", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "VTZ", "name": "Visakhapatnam International Airport", "city": "Visakhapatnam", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "CJB", "name": "Coimbatore International Airport", "city": "Coimbatore", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "IXM", "name": "Madurai Airport", "city": "Madurai", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "IMF", "name": "Bir Tikendrajit International Airport", "city": "Imphal", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "CCJ", "name": "Calicut International Airport", "city": "Kozhikode", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "UDR", "name": "Maharana Pratap Airport", "city": "Udaipur", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "STV", "name": "Surat International Airport", "city": "Surat", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "DED", "name": "Jolly Grant Airport", "city": "Dehradun", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "IXZ", "name": "Veer Savarkar International Airport", "city": "Port Blair", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "MAQ", "name": "Mangaluru International Airport", "city": "Mangalore", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "ATQ", "name": "Sri Guru Ram Dass Jee International Airport", "city": "Amritsar", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "BDQ", "name": "Vadodara Airport", "city": "Vadodara", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "IXL", "name": "Kushok Bakula Rimpochee Airport", "city": "Leh", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "IXJ", "name": "Jammu Airport", "city": "Jammu", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "BHO", "name": "Raja Bhoj Airport", "city": "Bhopal", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "GWL", "name": "Rajmata Vijaya Raje Scindia Airport", "city": "Gwalior", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "TIR", "name": "Tirupati Airport", "city": "Tirupati", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "TRZ", "name": "Tiruchirappalli International Airport", "city": "Tiruchirappalli", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "VGA", "name": "Vijayawada International Airport", "city": "Vijayawada", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "JDH", "name": "Jodhpur Airport", "city": "Jodhpur", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "IXU", "name": "Aurangabad Airport", "city": "Chhatrapati Sambhajinagar", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "KNU", "name": "Kanpur Airport", "city": "Kanpur", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "DMU", "name": "Dimapur Airport", "city": "Dimapur", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "AJL", "name": "Lengpui Airport", "city": "Aizawl", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "SHL", "name": "Shillong Airport (Umroi)", "city": "Shillong", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "TEZ", "name": "Tezpur Airport", "city": "Tezpur", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "DIB", "name": "Dibrugarh Airport", "city": "Dibrugarh", "country": "India", "timezone": "Asia/Kolkata"},
    {"code": "JLR", "name": "Jabalpur Airport", "city": "Jabalpur", "country": "India", "timezone": "Asia/Kolkata"},

    # Top International Destinations from India
    {"code": "DXB", "name": "Dubai International Airport", "city": "Dubai", "country": "United Arab Emirates", "timezone": "Asia/Dubai"},
    {"code": "SIN", "name": "Singapore Changi Airport", "city": "Singapore", "country": "Singapore", "timezone": "Asia/Singapore"},
    {"code": "BKK", "name": "Suvarnabhumi Airport", "city": "Bangkok", "country": "Thailand", "timezone": "Asia/Bangkok"},
    {"code": "LHR", "name": "London Heathrow Airport", "city": "London", "country": "United Kingdom", "timezone": "Europe/London"},
    {"code": "JFK", "name": "John F. Kennedy International Airport", "city": "New York", "country": "United States", "timezone": "America/New_York"},
    {"code": "SFO", "name": "San Francisco International Airport", "city": "San Francisco", "country": "United States", "timezone": "America/Los_Angeles"},
    {"code": "HKG", "name": "Hong Kong International Airport", "city": "Hong Kong", "country": "Hong Kong", "timezone": "Asia/Hong_Kong"},
    {"code": "NRT", "name": "Narita International Airport", "city": "Tokyo", "country": "Japan", "timezone": "Asia/Tokyo"},
    {"code": "ICN", "name": "Incheon International Airport", "city": "Seoul", "country": "South Korea", "timezone": "Asia/Seoul"},
    {"code": "KUL", "name": "Kuala Lumpur International Airport", "city": "Kuala Lumpur", "country": "Malaysia", "timezone": "Asia/Kuala_Lumpur"},
    {"code": "CMB", "name": "Bandaranaike International Airport", "city": "Colombo", "country": "Sri Lanka", "timezone": "Asia/Colombo"},
    {"code": "DAC", "name": "Hazrat Shahjalal International Airport", "city": "Dhaka", "country": "Bangladesh", "timezone": "Asia/Dhaka"},
    {"code": "KTM", "name": "Tribhuvan International Airport", "city": "Kathmandu", "country": "Nepal", "timezone": "Asia/Kathmandu"},
    {"code": "MLE", "name": "Velana International Airport", "city": "Male", "country": "Maldives", "timezone": "Indian/Maldives"},
    {"code": "DOH", "name": "Hamad International Airport", "city": "Doha", "country": "Qatar", "timezone": "Asia/Qatar"},
    {"code": "AUH", "name": "Zayed International Airport", "city": "Abu Dhabi", "country": "United Arab Emirates", "timezone": "Asia/Dubai"},
    {"code": "CDG", "name": "Charles de Gaulle Airport", "city": "Paris", "country": "France", "timezone": "Europe/Paris"},
    {"code": "FRA", "name": "Frankfurt Airport", "city": "Frankfurt", "country": "Germany", "timezone": "Europe/Berlin"},
]

POPULAR_AIRPORT_CODES = ["DEL", "BOM", "BLR", "HYD", "MAA", "CCU", "GOI", "COK", "AMD", "PNQ"]


@router.get(
    "/search",
    response_model=List[Dict[str, Any]],
    summary="Search airports by code or city name",
    description="Search 60+ airports by IATA code or city name. Case-insensitive, returns up to 10 matches.",
)
async def search_airports(
    q: str = Query(..., min_length=1, description="Search query (IATA code, city name, or airport name)"),
) -> List[Dict[str, Any]]:
    """Filter airports by query string matching code or city."""
    query = q.strip().lower()
    matches: List[Dict[str, Any]] = []

    # Priority 1: Exact code match
    for airport in AIRPORTS_CATALOG:
        if airport["code"].lower() == query:
            matches.append(airport)
            break

    # Priority 2: Code starts with query or city starts with query
    for airport in AIRPORTS_CATALOG:
        if airport in matches:
            continue
        if airport["code"].lower().startswith(query) or airport["city"].lower().startswith(query):
            matches.append(airport)
            if len(matches) >= 10:
                break

    # Priority 3: City or name contains query
    if len(matches) < 10:
        for airport in AIRPORTS_CATALOG:
            if airport in matches:
                continue
            if query in airport["city"].lower() or query in airport["name"].lower():
                matches.append(airport)
                if len(matches) >= 10:
                    break

    logger.debug("Airport search for '%s' returned %d results", q, len(matches))
    return matches[:10]


@router.get(
    "/popular",
    response_model=List[Dict[str, Any]],
    summary="Get top 10 popular Indian airports",
    description="Retrieve the 10 most popular commercial aviation hubs in India.",
)
async def get_popular_airports() -> List[Dict[str, Any]]:
    """Return top 10 Indian airports for quick selection."""
    code_map = {a["code"]: a for a in AIRPORTS_CATALOG}
    popular = [code_map[code] for code in POPULAR_AIRPORT_CODES if code in code_map]
    return popular
