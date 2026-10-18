import os
import sys
from pathlib import Path

# Ensure src directory is on sys.path regardless of how uvicorn is launched
CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

import certifi
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from routes import auth, user, travel

# SSL certificate setup for MongoDB Atlas and external APIs
os.environ["SSL_CERT_FILE"] = certifi.where()

app = FastAPI(
    title="TripSaathi API",
    description="Full-stack AI travel backend: Google OAuth, MongoDB profile management, and TinyFish travel intelligence.",
    version="1.0.0"
)

# CORS setup: Allow Railway deployment, localhost, Expo tunnel, and mobile clients
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Domain Routers
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(travel.router)

# Path to the Architecture PPT Slide
SLIDE_PATH = CURRENT_DIR.parent.parent / "architecture_slide" / "index.html"

@app.get("/")
def root():
    return {
        "message": "Welcome to TripSaathi Backend API",
        "docs": "/docs",
        "status": "healthy"
    }

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/architecture", response_class=HTMLResponse)
@app.get("/slide", response_class=HTMLResponse)
def get_architecture_slide():
    if SLIDE_PATH.exists():
        return HTMLResponse(content=SLIDE_PATH.read_text(encoding="utf-8"))
    return HTMLResponse("<h1>Architecture slide file not found at " + str(SLIDE_PATH) + "</h1>", status_code=404)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 7000))
    print(f"Starting TripSaathi Backend Server on port {port}...")
    print(f"API Documentation: http://localhost:{port}/docs")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
