from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import user_collection
from verify.token import verify_access_token
from verify.user import verify_user_payload
from schemas.user import UserProfileUpdate, UserProfileResponse
from utils.time import generate_timestamp, calculate_age

security = HTTPBearer()

router = APIRouter(prefix="/user", tags=["User Profile"])

@router.get("/profile", response_model=UserProfileResponse)
def get_user_profile(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_access_token(token)
    user, user_id, email = verify_user_payload(payload)

    dob = user.get("date_of_birth", "")
    age = calculate_age(dob)

    return UserProfileResponse(
        user_id=str(user["_id"]),
        email=user.get("email", ""),
        name=user.get("name", ""),
        profile_pic=user.get("profile_pic", ""),
        phone_number=user.get("phone_number", ""),
        gender=user.get("gender", ""),
        date_of_birth=dob,
        age=age,
        home_location=user.get("home_location", ""),
        created_on=user.get("created_on"),
        updated_on=user.get("updated_on"),
    )

@router.put("/profile", response_model=UserProfileResponse)
def update_user_profile(
    profile_data: UserProfileUpdate,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials
    payload = verify_access_token(token)
    user, user_id, email = verify_user_payload(payload)

    # Filter out None values - email is strictly non-editable
    raw_updates = profile_data.model_dump(exclude_unset=True)
    
    # Allowed editable fields
    editable_fields = ["name", "phone_number", "gender", "date_of_birth", "home_location"]
    update_dict = {}
    for f in editable_fields:
        if f in raw_updates and raw_updates[f] is not None:
            update_dict[f] = raw_updates[f]

    update_dict["updated_on"] = generate_timestamp()

    user_collection.update_one(
        {"_id": user_id},
        {"$set": update_dict}
    )

    # Fetch fresh updated document
    updated_user = user_collection.find_one({"_id": user_id})
    dob = updated_user.get("date_of_birth", "")
    age = calculate_age(dob)

    return UserProfileResponse(
        user_id=str(updated_user["_id"]),
        email=updated_user.get("email", ""),
        name=updated_user.get("name", ""),
        profile_pic=updated_user.get("profile_pic", ""),
        phone_number=updated_user.get("phone_number", ""),
        gender=updated_user.get("gender", ""),
        date_of_birth=dob,
        age=age,
        home_location=updated_user.get("home_location", ""),
        created_on=updated_user.get("created_on"),
        updated_on=updated_user.get("updated_on"),
    )
