from pydantic import BaseModel, Field
from typing import List, Optional

class ExistingTicketItem(BaseModel):
    category: str = "flight"  # flight, railway, hotel, cab, bus
    provider: Optional[str] = ""
    ticket_number: Optional[str] = ""
    from_location: Optional[str] = ""
    to_location: Optional[str] = ""
    departure_time: Optional[str] = ""
    arrival_time: Optional[str] = ""
    seat_or_room: Optional[str] = ""
    document_name: Optional[str] = ""
    notes: Optional[str] = ""

class ExistingTripCreate(BaseModel):
    trip_name: str
    tickets: List[ExistingTicketItem] = []
    notes: Optional[str] = ""

class TripLegItem(BaseModel):
    leg_index: int = 1
    from_point: str
    to_point: str
    mode: str = "airplane"  # cab, airplane, train, bus, metro
    departure_time: Optional[str] = ""
    arrival_time: Optional[str] = ""
    estimated_budget: Optional[float] = 0.0
    preferred_service_url: Optional[str] = ""
    notes: Optional[str] = ""

class StayPlanItem(BaseModel):
    city_or_hotel: Optional[str] = ""
    days_count: Optional[int] = 1
    people_count: Optional[int] = 1
    hotel_budget: Optional[float] = 0.0
    checkin_date: Optional[str] = ""
    checkout_date: Optional[str] = ""
    preferred_service_url: Optional[str] = ""
    notes: Optional[str] = ""

class PlanTripCreate(BaseModel):
    trip_name: str
    start_date: Optional[str] = ""
    people_count: Optional[int] = 1
    legs: List[TripLegItem] = []
    stay_plan: Optional[StayPlanItem] = None
    notes: Optional[str] = ""
