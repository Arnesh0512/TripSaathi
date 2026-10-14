import os
import certifi
from fastapi import FastAPI
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

# CORS setup for React Native web & mobile clients
origins = [
    "http://localhost:8081",
    "http://127.0.0.1:8081",
    "http://localhost:8082",
    "http://127.0.0.1:8082",
    "http://localhost:19006",
    "http://localhost:3000",
    "http://localhost:7000",
    "http://127.0.0.1:7000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Domain Routers
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(travel.router)

@app.get("/")
def root():
    return {
        "message": "Welcome to TripSaathi Backend API",
        "docs": "http://localhost:7000/docs",
        "status": "healthy"
    }

if __name__ == "__main__":
    print("Starting TripSaathi Backend Server on port 7000...")
    print("API Documentation: http://localhost:7000/docs")
    uvicorn.run("main:app", host="0.0.0.0", port=7000, reload=True)
