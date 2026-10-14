from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from utils.reader import uri
import certifi

# Initialize MongoDB Client
client = MongoClient(uri, server_api=ServerApi('1'), tlsCAFile=certifi.where())

# TripSaathi Database & Collections
db = client["tripsaathi"]

user_collection = db["user"]
trips_collection = db["trips"]
searches_collection = db["searches"]
bookings_collection = db["bookings"]

if __name__ == "__main__":
    try:
        client.admin.command("ping")
        print("MongoDB connection is working! Connected to tripsaathi database.")
    except Exception as e:
        print("MongoDB Error:", e)
