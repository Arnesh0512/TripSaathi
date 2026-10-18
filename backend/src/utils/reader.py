import os
from dotenv import load_dotenv
from pathlib import Path

# Load from backend root .env
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

uri = os.getenv("connection_string") or os.getenv("MONGO_URI")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
JWT_SECRET = os.getenv("JWT_SECRET", "tripsaathi_default_jwt_secret_2026")
JWT_ALGO = os.getenv("JWT_ALGO", "HS256")
TINYFISH_API_KEY = os.getenv("TINYFISH_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-5-nano")
