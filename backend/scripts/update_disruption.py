import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from database import disruptions_collection

doc = {
    "user_email": "arnesh052006@gmail.com",
    "trip_name": "conference",
    "route": "Delhi (DEL) → Mumbai (BOM)",
    "monitor": {
        "cadence_title": "T − 2 Hours to Departure",
        "active_cadence_tier": "IMMINENT",
        "has_delay": True,
        "delay_text": "Flight Delay: +2h 15m",
        "delay_detail": "AirIndia SP-952 pushed to 19:15. Delayed BOM arrival at 01:15 impacts hotel check-in.",
        "bookings": [
            {
                "id": "flight-1",
                "category": "flight",
                "icon": "✈️",
                "title": "AirIndia SP-952 (DEL → BOM)",
                "portal": "demo-arilines.vercel.app",
                "status_badge": "DELAYED +2h 15m",
                "status_badge_normal": "ON TIME",
                "pnr": "SP-952 • PNR-DEL-882",
                "schedule": "17:00 → Revised 19:15",
                "schedule_normal": "17:00 → 23:00 (19 Oct 2026)",
                "est_arrival": "01:15 (+1 day, BOM T6)",
                "last_check": "Scraped 1m ago • Delay Verified"
            },
            {
                "id": "hotel-1",
                "category": "hotel",
                "icon": "🏨",
                "title": "Deluxe Airport View Room",
                "portal": "stay-pulse.vercel.app",
                "status_badge": "AT RISK (LATE ARRIVAL)",
                "status_badge_normal": "CONFIRMED",
                "pnr": "RES-SP-84920 (Deluxe Room • ₹5,299/night)",
                "schedule": "Check-in 19 Oct • Cut-off 23:59",
                "schedule_normal": "Check-in 19 Oct 2026 (2 Nights)",
                "est_arrival": "02:00 (Arrival slot held)",
                "last_check": "Scraped 2m ago • Slot Protected"
            }
        ]
    },
    "impact": {
        "delay_time": "+2h 15m",
        "lag_minutes": "135 MIN LAG",
        "hero_description": "AirIndia SP-952 (DEL → BOM): Touchdown pushed from 23:00 to 01:15.",
        "cascading_steps": [
            {
                "title": "Flight SP-952 Departure (DEL T5)",
                "desc": "Scheduled 17:00 → Revised 19:15",
                "is_alert": True
            },
            {
                "title": "Touchdown & Arrival (BOM T6)",
                "desc": "Revised 01:15 • Luggage retrieval: 01:40",
                "is_alert": False
            },
            {
                "title": "Airport Chauffeur Transfer",
                "desc": "Pickup re-timed to 01:45 at Terminal 6",
                "is_alert": True
            },
            {
                "title": "StayPulse Room Check-in",
                "desc": "Expected 02:00 • Covered under late hold policy",
                "is_alert": True
            }
        ],
        "financial_risk": "₹12,506 room reservation protected with automated hold."
    },
    "recovery": {
        "protected_amount": "₹12,506 (StayPulse 2 Nights)",
        "penalty_amount": "₹0 Penalty",
        "hotel_policy": {
            "title": "StayPulse Direct Hold Policy",
            "text": "Late arrivals notified before midnight receive guaranteed room hold until 04:00 with zero penalty."
        },
        "airline_policy": {
            "title": "AirIndia DGCA Delay Charter",
            "text": "DGCA 2h+ delay entitles passengers to terminal refreshments and priority rescheduling."
        },
        "todos": [
            {
                "id": 1,
                "title": "Hold StayPulse Deluxe Room until 04:00",
                "sub": "Guaranteed room held with zero penalty",
                "done": True,
                "category": "HOTEL"
            },
            {
                "id": 2,
                "title": "Re-time BOM airport pickup to 01:45",
                "sub": "Matches revised AirIndia SP-952 landing at BOM T6",
                "done": True,
                "category": "TRANSIT"
            },
            {
                "id": 3,
                "title": "Claim delay meal voucher at DEL T5",
                "sub": "Eligible under DGCA 2h+ delay rule",
                "done": False,
                "category": "AIRLINE"
            },
            {
                "id": 4,
                "title": "Track baggage at BOM Terminal 6",
                "sub": "Priority baggage for flight SP-952",
                "done": False,
                "category": "AIRLINE"
            }
        ]
    }
}

result = disruptions_collection.update_one(
    {"user_email": "arnesh052006@gmail.com"},
    {"$set": doc},
    upsert=True
)
print("Updated MongoDB disruptions. Matched:", result.matched_count, "Modified:", result.modified_count)
