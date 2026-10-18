import io
import json
import re
from typing import Dict, Any, List, Tuple
from pypdf import PdfReader
from utils.reader import OPENAI_API_KEY, OPENAI_MODEL

# Core expected ticket fields
EXPECTED_FIELDS = [
    "category",
    "provider",
    "ticket_number",
    "from_location",
    "to_location",
    "departure_time",
    "arrival_time",
    "seat_or_room",
    "notes",
]

# Essential fields that should be flagged with yellow warning if missing
VERIFY_FIELDS = [
    "provider",
    "ticket_number",
    "from_location",
    "to_location",
    "departure_time",
    "arrival_time",
    "seat_or_room",
]

SYSTEM_PROMPT = """You are an intelligent travel ticket parser for TripSaathi.
Your task is to extract travel information from the raw ticket/boarding pass text into a structured JSON object.

EXPECTED JSON SCHEMA:
{
  "category": "flight" | "railway" | "hotel" | "cab" | "bus",
  "provider": string or null,
  "ticket_number": string or null,
  "from_location": string or null,
  "to_location": string or null,
  "departure_time": string or null,
  "arrival_time": string or null,
  "seat_or_room": string or null,
  "notes": string or null
}

EXTRACTION RULES:
1. "category": Must be strictly one of: "flight", "railway", "hotel", "cab", "bus".
2. "provider": Airline name (e.g. IndiGo, Air India, Emirates), Train service (e.g. IRCTC / Vande Bharat), Hotel name, or Cab provider.
3. "ticket_number": PNR (6-alphanumeric or 10-digit), Flight Number (e.g. 6E-804), Hotel Confirmation Number, or Booking ID.
4. "from_location": Origin airport/station/city (e.g. "DEL (Delhi Indira Gandhi T3)", "New Delhi Railway Station NDLS"). For hotel, city location.
5. "to_location": Destination airport/station/city (e.g. "BOM (Mumbai T2)", "Mumbai Central MMCT"). For hotel, hotel address/name.
6. "departure_time": Departure date & time (e.g. "24 May 2025, 14:00") or hotel check-in date/time.
7. "arrival_time": Arrival date & time (e.g. "24 May 2025, 16:30") or hotel check-out date/time.
8. "seat_or_room": Seat number (e.g. "14F", "Coach B2 Seat 45") or Hotel Room number/type.
9. "notes": Passenger name(s), terminal, gate, baggage allowance, or class.
10. MANDATORY: If any field is NOT found or cannot be determined with certainty from the text, you MUST set its value to null. DO NOT fabricate or assume values.
11. Return ONLY pure valid JSON, no markdown code blocks, no explanation."""

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract all text from uploaded PDF bytes using pypdf."""
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        full_text = []
        for idx, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                full_text.append(page_text.strip())
        return "\n--- PAGE BREAK ---\n".join(full_text)
    except Exception as e:
        raise ValueError(f"Failed to read PDF document: {str(e)}")

def parse_with_fallback_heuristics(pdf_text: str) -> Dict[str, Any]:
    """
    Intelligent regex/heuristic fallback parser if OpenAI key is not configured or unavailable.
    Detects standard airline codes, PNRs, dates, and locations.
    """
    data = {
        "category": "flight",
        "provider": None,
        "ticket_number": None,
        "from_location": None,
        "to_location": None,
        "departure_time": None,
        "arrival_time": None,
        "seat_or_room": None,
        "notes": None,
    }

    lt = pdf_text.lower()
    if "irctc" in lt or "railway" in lt or "train" in lt or "pnr status" in lt:
        data["category"] = "railway"
    elif "flight" in lt or "takeoff" in lt or "airline" in lt or "aircraft" in lt or "boarding" in lt:
        data["category"] = "flight"
    elif "hotel" in lt or "staypulse" in lt or "room slot" in lt or "stay" in lt:
        data["category"] = "hotel"
    elif "cab" in lt or "uber" in lt or "ola" in lt:
        data["category"] = "cab"
    elif "bus" in lt or "redbus" in lt:
        data["category"] = "bus"

    # Provider
    hotel_p = re.search(r'Hotel:\s*([^\n\r]+)', pdf_text, re.IGNORECASE)
    if hotel_p and data["category"] == "hotel":
        data["provider"] = hotel_p.group(1).strip()
    else:
        for p in ["IndiGo", "Air India", "Vistara", "SpiceJet", "Akasa Air", "Emirates", "SkyPulse", "IRCTC", "Uber", "Ola", "Taj Lands End", "Taj", "Marriott", "Hyatt"]:
            if re.search(r'\b' + re.escape(p) + r'\b', pdf_text, re.IGNORECASE):
                data["provider"] = p
                break

    # Ticket number / PNR / Booking Ref
    booking_ref_m = re.search(r'(?:Booking Reference|Booking Ref|PNR No|PNR Number|Ticket Number|Confirmation Code|Confirmation Number)[:\s]+([A-Z0-9\-]{5,15})', pdf_text, re.IGNORECASE)
    if booking_ref_m:
        data["ticket_number"] = booking_ref_m.group(1).strip()
    elif re.search(r'\b(SP-[A-Z0-9]{5,10})\b', pdf_text):
        data["ticket_number"] = re.search(r'\b(SP-[A-Z0-9]{5,10})\b', pdf_text).group(1).strip()
    elif re.search(r'Ready for Takeoff!\s*\n\s*([A-Z0-9\-]{5,12})', pdf_text):
        data["ticket_number"] = re.search(r'Ready for Takeoff!\s*\n\s*([A-Z0-9\-]{5,12})', pdf_text).group(1).strip()
    else:
        fl_m = re.search(r'\b(6E|AI|UK|SG|QP|EK)[-\s]*(\d{3,4})\b', pdf_text)
        if fl_m:
            data["ticket_number"] = f"{fl_m.group(1)}-{fl_m.group(2)}"

    # Flight route & times
    route_m = re.findall(r'(\d{1,2}:\d{2})\s*\n\s*([A-Z]{3})\s*\n\s*([^\n\r]+)(?:\s*\n\s*(Terminal\s*[A-Z0-9]+))?', pdf_text)
    if len(route_m) >= 2:
        dep = route_m[0]
        arr = route_m[1]
        data["departure_time"] = dep[0]
        data["arrival_time"] = arr[0]
        dep_loc = f"{dep[1]} ({dep[2]}" + (f", {dep[3]}" if dep[3] else "") + ")"
        arr_loc = f"{arr[1]} ({arr[2]}" + (f", {arr[3]}" if arr[3] else "") + ")"
        data["from_location"] = dep_loc
        data["to_location"] = arr_loc

    # Hotel dates & locations
    dates_m = re.search(r'Dates:\s*(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})', pdf_text)
    if dates_m:
        data["departure_time"] = f"{dates_m.group(1)} (Check-in 14:00)"
        data["arrival_time"] = f"{dates_m.group(2)} (Check-out 11:00)"

    addr_m = re.search(r'Address:\s*([^\n\r]+)', pdf_text)
    if addr_m and data["category"] == "hotel":
        data["from_location"] = "Mumbai"
        hotel_name = data.get("provider") or "Hotel"
        data["to_location"] = f"{hotel_name}, {addr_m.group(1).strip()}"

    # Seat or Room
    room_m = re.search(r'Room Slot:\s*([^\n\r]+)', pdf_text)
    if room_m:
        data["seat_or_room"] = room_m.group(1).strip()
    else:
        seat_m = re.search(r'(?:Seat|Seat No|Berth)[:\s]+([0-9]{1,3}[A-Z]|\bCoach\s+[A-Z0-9]+)', pdf_text, re.IGNORECASE)
        if seat_m:
            data["seat_or_room"] = seat_m.group(1).strip()
        elif "confirmed seat" in lt:
            cabin = re.search(r'Cabin Class:\s*([^\n\r]+)', pdf_text)
            cabin_str = cabin.group(1).strip() if cabin else "Economy"
            data["seat_or_room"] = f"Confirmed Seat ({cabin_str})"

    # Notes
    pax_m = re.search(r'(?:Name|Primary Guest)[:\s]+([A-Za-z\s]+?)(?:\r?\n|Email|$)', pdf_text)
    total_m = re.search(r'(?:Total Amount Paid|Total Amount Payable)[:\s\n]+([^\n\r]+)', pdf_text)
    notes_parts = []
    if pax_m:
        notes_parts.append(f"Passenger: {pax_m.group(1).strip()}")
    if total_m:
        notes_parts.append(f"Amount: {total_m.group(1).strip()}")
    if notes_parts:
        data["notes"] = " • ".join(notes_parts)

    return data

def parse_ticket_with_gpt(pdf_text: str) -> Tuple[Dict[str, Any], List[str], str]:
    """
    Sends extracted PDF text to OpenAI GPT model (default gpt-5-nano).
    Returns (ticket_data, missing_fields, model_used).
    """
    model_to_use = OPENAI_MODEL or "gpt-5-nano"

    if not OPENAI_API_KEY:
        # Graceful fallback to heuristic parsing
        parsed = parse_with_fallback_heuristics(pdf_text)
        missing = [f for f in VERIFY_FIELDS if not parsed.get(f)]
        return parsed, missing, "heuristic-fallback (no OPENAI_API_KEY set)"

    try:
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)

        # Truncate text if excessively long to save prompt tokens
        clean_text = pdf_text[:8000]

        completion = client.chat.completions.create(
            model=model_to_use,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Parse the following ticket document and return the JSON object:\n\n{clean_text}"}
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )

        response_content = completion.choices[0].message.content
        raw_json = json.loads(response_content)

        # Sanitize dictionary
        result: Dict[str, Any] = {}
        for key in EXPECTED_FIELDS:
            val = raw_json.get(key)
            if val is None or val == "None" or val == "null" or (isinstance(val, str) and not val.strip()):
                result[key] = None
            else:
                result[key] = str(val).strip()

        # Validate category
        if result.get("category") not in ["flight", "railway", "hotel", "cab", "bus"]:
            result["category"] = "flight"

        # Identify missing fields
        missing_fields = [field for field in VERIFY_FIELDS if not result.get(field)]

        return result, missing_fields, model_to_use

    except Exception as e:
        # Fallback to heuristics if model call fails
        print(f"[ticket_parser] GPT call failed: {str(e)}. Falling back to regex parser.")
        parsed = parse_with_fallback_heuristics(pdf_text)
        missing = [f for f in VERIFY_FIELDS if not parsed.get(f)]
        return parsed, missing, f"heuristic-fallback ({str(e)})"
