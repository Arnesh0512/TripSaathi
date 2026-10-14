from fastapi import APIRouter
from datetime import datetime, timezone, timedelta
from database import user_collection
from verify.token import verify_google_token, create_access_token
from utils.time import generate_timestamp
from schemas.user import GoogleAuthRequest

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/google")
def google_auth(data: GoogleAuthRequest):
    idinfo = verify_google_token({"token": data.token})
    email = idinfo.get("email", "").lower()
    name = idinfo.get("name", "")
    profile_pic = idinfo.get("picture", "")

    user = user_collection.find_one({"email": email})
    if user:
        user_id = str(user["_id"])
        update_fields = {}
        if name and not user.get("name"):
            update_fields["name"] = name
        if profile_pic:
            update_fields["profile_pic"] = profile_pic
        if update_fields:
            update_fields["updated_on"] = generate_timestamp()
            user_collection.update_one({"_id": user["_id"]}, {"$set": update_fields})
    else:
        new_user = {
            "email": email,
            "name": name,
            "profile_pic": profile_pic,
            "phone_number": "",
            "gender": "",
            "date_of_birth": "",
            "home_location": "",
            "created_on": generate_timestamp(),
            "updated_on": generate_timestamp(),
        }
        result = user_collection.insert_one(new_user)
        user_id = str(result.inserted_id)

    # 60 days expiration
    exp_time = datetime.now(timezone.utc) + timedelta(days=60)

    # JWT payload as requested: user_id, email, name, role='user', exp
    payload = {
        "user_id": user_id,
        "email": email,
        "name": name,
        "role": "user",
        "exp": int(exp_time.timestamp())
    }

    access_token = create_access_token(payload)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "user_id": user_id,
            "email": email,
            "name": name,
            "profile_pic": profile_pic
        }
    }
