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

    lower_text = pdf_text.lower()
    if "irctc" in lower_text or "train" in lower_text or "railway" in lower_text:
        data["category"] = "railway"
    elif "hotel" in lower_text or "stay" in lower_text or "check-in" in lower_text:
        data["category"] = "hotel"
    elif "uber" in lower_text or "ola" in lower_text or "cab" in lower_text:
        data["category"] = "cab"
    elif "bus" in lower_text or "redbus" in lower_text:
        data["category"] = "bus"
    else:
        data["category"] = "flight"

    # Airline / Provider
    for provider in ["IndiGo", "Air India", "Vistara", "SpiceJet", "Akasa Air", "Emirates", "IRCTC", "Uber", "Ola", "Taj", "Marriott"]:
        if re.search(r'\b' + re.escape(provider) + r'\b', pdf_text, re.IGNORECASE):
            data["provider"] = provider
            break

    # PNR search (e.g. PNR: ABC123, PNR / Booking Ref: 1234567890)
    pnr_match = re.search(r'(?:PNR|Booking Ref|Ticket No|Confirmation)[:\s]+([A-Z0-9]{6,10})', pdf_text, re.IGNORECASE)
    if pnr_match:
        data["ticket_number"] = pnr_match.group(1).strip()
    else:
        # Flight number search e.g. 6E 804 or AI 101
        flight_match = re.search(r'\b(6E|AI|UK|SG|QP|EK)\s*[-]?\s*(\d{3,4})\b', pdf_text, re.IGNORECASE)
        if flight_match:
            data["ticket_number"] = f"{flight_match.group(1).upper()}-{flight_match.group(2)}"

    # Seat search (e.g. Seat: 14F, 23B)
    seat_match = re.search(r'(?:Seat|Seat No|Berth)[:\s]+([0-9]{1,3}[A-Z]|\bCoach\s+[A-Z0-9]+)', pdf_text, re.IGNORECASE)
    if seat_match:
        data["seat_or_room"] = seat_match.group(1).strip()

    # Date / Time extraction
    date_matches = re.findall(r'\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}(?:\s+\d{1,2}:\d{2})?\b', pdf_text, re.IGNORECASE)
    if len(date_matches) >= 2:
        data["departure_time"] = date_matches[0]
        data["arrival_time"] = date_matches[1]
    elif len(date_matches) == 1:
        data["departure_time"] = date_matches[0]

    # Origin and Destination airport codes (e.g. DEL -> BOM)
    cities = ["DEL", "BOM", "BLR", "HYD", "CCU", "MAA", "GOI", "PNQ", "Delhi", "Mumbai", "Bangalore", "Hyderabad", "Goa"]
    found_cities = []
    for city in cities:
        if re.search(r'\b' + re.escape(city) + r'\b', pdf_text, re.IGNORECASE):
            found_cities.append(city)
    if len(found_cities) >= 2:
        data["from_location"] = found_cities[0]
        data["to_location"] = found_cities[1]
    elif len(found_cities) == 1:
        data["from_location"] = found_cities[0]

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
