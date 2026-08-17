import logging
import asyncio
import copy
import uuid
from motor.motor_asyncio import AsyncIOMotorClient
from backend.config.settings import settings

logger = logging.getLogger(__name__)

class MockCursor:
    def __init__(self, data):
        self.data = data
        self.index = 0

    def sort(self, key, direction=-1):
        self.data = sorted(
            self.data, 
            key=lambda x: x.get(key) if x.get(key) is not None else "", 
            reverse=(direction == -1)
        )
        return self
        
    def limit(self, limit_num):
        self.data = self.data[:limit_num]
        return self

    def __aiter__(self):
        return self

    async def __anext__(self):
        if self.index < len(self.data):
            val = self.data[self.index]
            self.index += 1
            return val
        else:
            raise StopAsyncIteration

class MockCollection:
    def __init__(self, name, store):
        self.name = name
        self.store = store
        if name not in self.store:
            self.store[name] = {}

    def _match_doc(self, doc, query) -> bool:
        if not query:
            return True
        for k, v in query.items():
            if k == "$or":
                if not isinstance(v, list):
                    return False
                or_match = False
                for sub_query in v:
                    if self._match_doc(doc, sub_query):
                        or_match = True
                        break
                if not or_match:
                    return False
            elif k == "$and":
                if not isinstance(v, list):
                    return False
                for sub_query in v:
                    if not self._match_doc(doc, sub_query):
                        return False
            elif isinstance(v, dict):
                for op, op_val in v.items():
                    if op == "$exists":
                        exists = k in doc
                        if exists != op_val:
                            return False
                    elif op == "$gt":
                        if doc.get(k) is None or doc.get(k) <= op_val:
                            return False
                    elif op == "$gte":
                        if doc.get(k) is None or doc.get(k) < op_val:
                            return False
                    elif op == "$lt":
                        if doc.get(k) is None or doc.get(k) >= op_val:
                            return False
                    elif op == "$lte":
                        if doc.get(k) is None or doc.get(k) > op_val:
                            return False
                    elif op == "$ne":
                        if doc.get(k) == op_val:
                            return False
                    elif op == "$in":
                        if doc.get(k) not in op_val:
                            return False
                    else:
                        if doc.get(k) != v:
                            return False
            else:
                if doc.get(k) != v:
                    return False
        return True

    async def find_one(self, query):
        for doc in self.store[self.name].values():
            if self._match_doc(doc, query):
                return copy.deepcopy(doc)
        return None

    async def insert_one(self, doc):
        if "_id" not in doc:
            doc["_id"] = str(uuid.uuid4())
        self.store[self.name][doc["_id"]] = copy.deepcopy(doc)
        return doc

    def find(self, query=None):
        query = query or {}
        results = []
        for doc in self.store[self.name].values():
            if self._match_doc(doc, query):
                results.append(copy.deepcopy(doc))
        return MockCursor(results)

    async def update_one(self, query, update):
        for doc_id, doc in self.store[self.name].items():
            if self._match_doc(doc, query):
                if "$set" in update:
                    for k, v in update["$set"].items():
                        doc[k] = v
                if "$push" in update:
                    for k, v in update["$push"].items():
                        if k not in doc:
                            doc[k] = []
                        if isinstance(v, dict) and "$each" in v:
                            doc[k].extend(copy.deepcopy(v["$each"]))
                        else:
                            doc[k].append(copy.deepcopy(v))
                if "$inc" in update:
                    for k, v in update["$inc"].items():
                        doc[k] = doc.get(k, 0) + v
                return True
        return False

    async def delete_one(self, query):
        for doc_id, doc in list(self.store[self.name].items()):
            if self._match_doc(doc, query):
                del self.store[self.name][doc_id]
                return True
        return False

    async def delete_many(self, query):
        deleted_count = 0
        for doc_id, doc in list(self.store[self.name].items()):
            if self._match_doc(doc, query):
                del self.store[self.name][doc_id]
                deleted_count += 1
        return deleted_count

class MockDatabase:
    def __init__(self):
        self.store = {}

    def __getitem__(self, name):
        return MockCollection(name, self.store)

class MongoDB:
    client = None
    db = None
    is_mock = False

    @classmethod
    async def connect_to_database(cls):
        logger.info(f"Connecting to MongoDB at {settings.MONGODB_URI}")
        try:
            temp_client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=1000)
            await asyncio.wait_for(temp_client.admin.command('ping'), timeout=1.5)
            
            cls.client = temp_client
            cls.db = cls.client[settings.MONGODB_DB_NAME]
            cls.is_mock = False
            logger.info("Connected to MongoDB server successfully.")
        except Exception as e:
            logger.warning(
                f"Could not connect to MongoDB server ({e}). "
                "Falling back to an in-memory MockDatabase for local prototyping!"
            )
            cls.client = None
            cls.db = MockDatabase()
            cls.is_mock = True
            
            # Bootstrap default users to prevent "unable to sign in" after uvicorn reloads!
            try:
                import bcrypt
                from datetime import datetime
                hashed_pwd = bcrypt.hashpw(b"password123", bcrypt.gensalt()).decode("utf-8")
                
                # Pre-populate MockDatabase users collection
                cls.db.store["users"] = {
                    "agent-uuid-default": {
                        "_id": "agent-uuid-default",
                        "email": "agent@vantrixai.io",
                        "hashed_password": hashed_pwd,
                        "full_name": "Tushar Agarwal (Agent)",
                        "role": "agent",
                        "created_at": datetime.utcnow()
                    },
                    "manager-uuid-default": {
                        "_id": "manager-uuid-default",
                        "email": "manager@vantrixai.io",
                        "hashed_password": hashed_pwd,
                        "full_name": "Tushar Agarwal (Manager)",
                        "role": "manager",
                        "created_at": datetime.utcnow()
                    }
                }
                logger.info("Bootstrapped default MockDatabase users: agent@vantrixai.io and manager@vantrixai.io (password: password123)")
            except Exception as ex:
                logger.error(f"Failed to bootstrap mock database users: {ex}")

    @classmethod
    async def close_database_connection(cls):
        if cls.client:
            cls.client.close()
            logger.info("MongoDB connection closed.")

async def get_database():
    return MongoDB.db
