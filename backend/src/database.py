import os
import certifi
from bson import ObjectId
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from pymongo.errors import ServerSelectionTimeoutError, AutoReconnect, PyMongoError
from utils.reader import uri

# Resilient User Collection Proxy with seamless in-memory fallback
class ResilientUserCollection:
    def __init__(self, get_real_coll_fn):
        self._get_real_coll = get_real_coll_fn
        self._mem_store = {}  # str(id) -> document
        self._atlas_available = True
        self._atlas_warned = False

    def _warn_atlas_offline(self, err):
        self._atlas_available = False
        if not self._atlas_warned:
            err_name = type(err).__name__
            print(f"\n[MongoDB Notice] Atlas unreachable ({err_name}). Seamlessly falling back to local memory store.")
            print("   -> Note: To persist directly to Atlas, add 0.0.0.0/0 to Atlas Network Access.\n")
            self._atlas_warned = True

    def find_one(self, query):
        if self._atlas_available:
            coll = self._get_real_coll()
            if coll is not None:
                try:
                    doc = coll.find_one(query)
                    return doc
                except Exception as e:
                    self._warn_atlas_offline(e)

        # Fallback in-memory search
        for uid, doc in self._mem_store.items():
            matches = True
            for k, v in query.items():
                if k == "_id":
                    if str(doc.get("_id")) != str(v):
                        matches = False
                        break
                elif doc.get(k) != v:
                    matches = False
                    break
            if matches:
                return doc.copy()
        return None

    def insert_one(self, document):
        if "_id" not in document:
            document["_id"] = ObjectId()

        if self._atlas_available:
            coll = self._get_real_coll()
            if coll is not None:
                try:
                    res = coll.insert_one(document)
                    return res
                except Exception as e:
                    self._warn_atlas_offline(e)

        # Save to memory
        self._mem_store[str(document["_id"])] = document.copy()
        class InsertResult:
            inserted_id = document["_id"]
        return InsertResult()

    def update_one(self, filter_q, update_q):
        if self._atlas_available:
            coll = self._get_real_coll()
            if coll is not None:
                try:
                    res = coll.update_one(filter_q, update_q)
                    return res
                except Exception as e:
                    self._warn_atlas_offline(e)

        # Update in memory
        doc = self.find_one(filter_q)
        if doc and "$set" in update_q:
            doc.update(update_q["$set"])
            self._mem_store[str(doc["_id"])] = doc.copy()
        class UpdateResult:
            matched_count = 1 if doc else 0
            modified_count = 1 if doc else 0
        return UpdateResult()


# Connect with fast timeouts (2000ms) so requests never hang
_real_client = None
_real_user_coll = None

try:
    if uri:
        _real_client = MongoClient(
            uri,
            server_api=ServerApi('1'),
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=2000,
            connectTimeoutMS=2000,
            socketTimeoutMS=2000
        )
        db = _real_client["tripsaathi"]
        _real_user_coll = db["user"]
except Exception as e:
    print(f"[MongoDB Notice] Initialization note: {e}")
    db = None
    _real_user_coll = None

user_collection = ResilientUserCollection(lambda: _real_user_coll)

if __name__ == "__main__":
    print("Testing user_collection find_one...")
    res = user_collection.find_one({"email": "test@tripsaathi.com"})
    print("Result:", res)
