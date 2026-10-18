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
                "icon": "🛫",
                "title": "Flight Departure (DEL T5)",
                "desc": "Scheduled 17:00 → Revised 19:15 (+2h 15m)",
                "is_alert": True
            },
            {
                "icon": "🛬",
                "title": "Mumbai Landing (BOM T6)",
                "desc": "Delayed landing at 01:15 • Bags: 01:40",
                "is_alert": False
            },
            {
                "icon": "🚕",
                "title": "Airport Cab Chauffeur",
                "desc": "Pickup rescheduled from 23:30 to 01:45",
                "is_alert": True
            },
            {
                "icon": "🏨",
                "title": "StayPulse Deluxe Room Check-in",
                "desc": "Expected 02:00. Room held past midnight via StayPulse.",
                "is_alert": True
            }
        ],
        "financial_risk": "₹12,506 room reservation protected with automated hold."
    },
    "recovery": {
        "protected_amount": "₹12,506",
        "penalty_amount": "₹0 Penalty",
        "hotel_policy": {
            "title": "STAYPULSE POLICY (DELUXE AIRPORT VIEW ROOM)",
            "text": "Direct slot policy: Late arrival notice extends check-in hold until 04:00 with ₹0 penalty."
        },
        "airline_policy": {
            "title": "AIRLINE POLICY (AIRINDIA SP-952)",
            "text": "DGCA Charter: 2h+ delay entitles passenger to meal vouchers at DEL T5 and free rescheduling."
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
print("Updated MongoDB disruptions. Matched:", result.matched_count, "Modified:", result.modified_count, "UpsertedId:", result.upserted_id)
