from pydantic import BaseModel, EmailStr
from typing import Optional

class GoogleAuthRequest(BaseModel):
    token: str

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone_number: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    home_location: Optional[str] = None

class UserProfileResponse(BaseModel):
    user_id: str
    email: str
    name: Optional[str] = None
    profile_pic: Optional[str] = None
    phone_number: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    age: Optional[int] = None
    home_location: Optional[str] = None
    created_on: Optional[str] = None
    updated_on: Optional[str] = None
