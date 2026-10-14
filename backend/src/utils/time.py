from datetime import datetime, timezone, date

def generate_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()

def calculate_age(dob_str: str | None) -> int | None:
    if not dob_str or not isinstance(dob_str, str):
        return None
    dob_clean = dob_str.strip()
    try:
        # Support YYYY-MM-DD or DD/MM/YYYY or YYYY/MM/DD
        if "-" in dob_clean:
            parts = [int(p) for p in dob_clean.split("-")]
            if parts[0] > 1000:
                dob = date(parts[0], parts[1], parts[2])
            else:
                dob = date(parts[2], parts[1], parts[0])
        elif "/" in dob_clean:
            parts = [int(p) for p in dob_clean.split("/")]
            if parts[0] > 1000:
                dob = date(parts[0], parts[1], parts[2])
            else:
                dob = date(parts[2], parts[1], parts[0])
        else:
            return None
        today = date.today()
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        return max(0, age)
    except Exception:
        return None
