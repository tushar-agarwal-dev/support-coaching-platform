import logging
import chromadb
from backend.config.settings import settings

logger = logging.getLogger(__name__)

class ChromaDB:
    client = None

    @classmethod
    def get_client(cls):
        if cls.client is None:
            if settings.CHROMADB_HOST:
                logger.info(f"Connecting to remote ChromaDB at {settings.CHROMADB_HOST}:{settings.CHROMADB_PORT}")
                cls.client = chromadb.HttpClient(
                    host=settings.CHROMADB_HOST,
                    port=settings.CHROMADB_PORT
                )
            else:
                logger.info(f"Initializing persistent ChromaDB at {settings.CHROMADB_PERSIST_DIR}")
                cls.client = chromadb.PersistentClient(
                    path=settings.CHROMADB_PERSIST_DIR
                )
        return cls.client

def get_chroma_client():
    return ChromaDB.get_client()
