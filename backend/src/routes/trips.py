from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson import ObjectId
from typing import Optional
from database import trips_collection
from verify.token import verify_access_token
from verify.user import verify_user_payload
from schemas.trip import ExistingTripCreate, PlanTripCreate
from utils.time import generate_timestamp
from services.ticket_parser import extract_text_from_pdf, parse_ticket_with_gpt

security = HTTPBearer(auto_error=False)

router = APIRouter(prefix="/trip", tags=["Trip Management"])

def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if not credentials:
        return None
    try:
        payload = verify_access_token(credentials.credentials)
        user, user_id, email = verify_user_payload(payload)
        return {
            "user_id": str(user_id),
            "email": email,
            "name": user.get("name", "")
        }
    except Exception:
        return None

@router.post("/existing")
def add_existing_trip(
    data: ExistingTripCreate,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """
    Option 1: Upload / Register existing booked tickets (Flight, Railway, Hotel, Cab, Bus).
    TripSaathi stores and monitors these tickets for live delays & downstream impacts.
    """
    if not data.trip_name.strip():
        raise HTTPException(status_code=400, detail="Trip name is required")

    tickets_data = [t.model_dump() for t in data.tickets]
    
    trip_doc = {
        "trip_type": "EXISTING_BOOKED",
        "trip_name": data.trip_name.strip(),
        "tickets": tickets_data,
        "tickets_count": len(tickets_data),
        "notes": data.notes or "",
        "user_id": current_user["user_id"] if current_user else None,
        "user_email": current_user["email"] if current_user else "guest_traveler",
        "monitoring_status": "ACTIVE_MONITORING",
        "created_at": generate_timestamp(),
        "updated_at": generate_timestamp(),
    }

    try:
        result = trips_collection.insert_one(trip_doc)
        trip_doc["_id"] = str(result.inserted_id)
        return {
            "status": "SUCCESS",
            "message": f"Successfully registered {len(tickets_data)} ticket(s) for live monitoring",
            "trip_id": str(result.inserted_id),
            "trip": trip_doc
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database insert failed: {str(e)}")

@router.post("/plan")
def plan_new_trip(
    data: PlanTripCreate,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """
    Option 2: Plan multi-leg chronological trip (Home -> Airport cab, DEL -> BOM plane,
    Airport -> Hotel cab, plus hotel stay plan and budget).
    """
    if not data.trip_name.strip():
        raise HTTPException(status_code=400, detail="Trip name is required")

    legs_data = [leg.model_dump() for leg in data.legs]
    stay_data = data.stay_plan.model_dump() if data.stay_plan else None

    # Calculate total estimated budget across legs + stay
    legs_budget = sum((leg.get("estimated_budget") or 0.0) for leg in legs_data)
    stay_budget = (stay_data.get("hotel_budget") or 0.0) if stay_data else 0.0
    total_budget = legs_budget + stay_budget

    trip_doc = {
        "trip_type": "PLANNED_MULTI_MODAL",
        "trip_name": data.trip_name.strip(),
        "start_date": data.start_date or "",
        "people_count": data.people_count or 1,
        "legs": legs_data,
        "legs_count": len(legs_data),
        "stay_plan": stay_data,
        "total_estimated_budget": total_budget,
        "notes": data.notes or "",
        "user_id": current_user["user_id"] if current_user else None,
        "user_email": current_user["email"] if current_user else "guest_traveler",
        "monitoring_status": "PLAN_SAVED",
        "created_at": generate_timestamp(),
        "updated_at": generate_timestamp(),
    }

    try:
        result = trips_collection.insert_one(trip_doc)
        trip_doc["_id"] = str(result.inserted_id)
        return {
            "status": "SUCCESS",
            "message": f"Successfully planned multi-leg journey with {len(legs_data)} legs",
            "trip_id": str(result.inserted_id),
            "total_budget": total_budget,
            "trip": trip_doc
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database insert failed: {str(e)}")

@router.get("/my-trips")
def get_user_trips(current_user: Optional[dict] = Depends(get_optional_user)):
    """
    Fetch all trips saved in TripSaathi MongoDB for the authenticated user.
    If user is not signed in, returns empty list.
    When signed in, queries specifically for that user's email/id.
    """
    try:
        if not current_user or not current_user.get("email"):
            return {
                "status": "SUCCESS",
                "count": 0,
                "trips": []
            }

        user_email = current_user["email"].lower()
        query_conditions = [{"user_email": user_email}]
        if current_user.get("user_id"):
            query_conditions.append({"user_id": current_user["user_id"]})

        query = {"$or": query_conditions}
        
        cursor = trips_collection.find(query).limit(50)
        all_trips = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            all_trips.append(doc)

        # Separate current vs past trips so current is guaranteed at the top
        current_trips = []
        past_trips = []
        for t in all_trips:
            is_past = (
                t.get("is_past") is True 
                or t.get("status") == "COMPLETED" 
                or t.get("monitoring_status") == "COMPLETED"
            )
            if is_past:
                past_trips.append(t)
            else:
                current_trips.append(t)

        # Sort current trips by created_at desc, and past trips by created_at desc
        current_trips.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
        past_trips.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)

        ordered_trips = current_trips + past_trips

        return {
            "status": "SUCCESS",
            "count": len(ordered_trips),
            "trips": ordered_trips
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {str(e)}")

@router.delete("/{trip_id}")
def delete_trip(
    trip_id: str,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """
    Delete a trip by its MongoDB ObjectId.
    """
    try:
        result = trips_collection.delete_one({"_id": ObjectId(trip_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Trip not found or already deleted")
        return {
            "status": "SUCCESS",
            "message": "Trip deleted successfully from TripSaathi MongoDB",
            "trip_id": trip_id
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid trip id or delete error: {str(e)}")

@router.get("/{trip_id}")
def get_trip_detail(trip_id: str):
    """
    Fetch single trip by its MongoDB ObjectId.
    """
    try:
        doc = trips_collection.find_one({"_id": ObjectId(trip_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Trip not found")
        doc["_id"] = str(doc["_id"])
        return doc
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid trip id or query error: {str(e)}")

@router.post("/parse-ticket-pdf")
async def parse_ticket_pdf(
    file: UploadFile = File(...),
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """
    Accepts an uploaded PDF ticket / boarding pass.
    Uses pypdf to extract text, sends it to configured LLM (gpt-5-nano),
    and returns parsed ticket dictionary along with any missing_fields.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported for ticket scanning.")

    try:
        contents = await file.read()
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        pdf_text = extract_text_from_pdf(contents)
        if not pdf_text.strip():
            return {
                "status": "PARTIAL",
                "message": "No selectable text found in PDF. Please enter details manually.",
                "document_name": file.filename,
                "ticket_data": {
                    "category": "flight",
                    "provider": None,
                    "ticket_number": None,
                    "from_location": None,
                    "to_location": None,
                    "departure_time": None,
                    "arrival_time": None,
                    "seat_or_room": None,
                    "notes": f"Scanned from {file.filename} (image-only/empty)",
                },
                "missing_fields": [
                    "provider", "ticket_number", "from_location", 
                    "to_location", "departure_time", "arrival_time", "seat_or_room"
                ],
                "model_used": "none (empty text)",
            }

        ticket_data, missing_fields, model_used = parse_ticket_with_gpt(pdf_text)

        return {
            "status": "SUCCESS",
            "message": f"Successfully parsed {file.filename} using {model_used}",
            "document_name": file.filename,
            "extracted_text_preview": pdf_text[:300].strip(),
            "ticket_data": ticket_data,
            "missing_fields": missing_fields,
            "model_used": model_used
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse ticket PDF: {str(e)}")
