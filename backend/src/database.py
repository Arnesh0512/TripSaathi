import os
import certifi
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from utils.reader import uri

# MongoDB Atlas Client (Direct Production Connection)
client = MongoClient(
    uri,
    server_api=ServerApi('1'),
    tlsCAFile=certifi.where()
)

db = client["tripsaathi"]
user_collection = db["user"]

if __name__ == "__main__":
    try:
        client.admin.command("ping")
        print("Connected to MongoDB Atlas successfully!")
        print("Active database: tripsaathi")
        print("User collection:", user_collection.name)
    except Exception as e:
        print("MongoDB Atlas connection error:", e)
