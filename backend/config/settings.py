import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Development of AI-Powered Customer Support Assistant with Live Response Guidance."
    
    # MongoDB Configuration
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "support_coaching"
    
    # ChromaDB Configuration
    # If CHROMADB_HOST is set, client will connect to server. Otherwise, uses local persistent client.
    CHROMADB_HOST: str | None = None
    CHROMADB_PORT: int = 8000
    CHROMADB_PERSIST_DIR: str = "./chroma_db"
    
    # Security Configuration
    JWT_SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # RAG Settings
    EMBEDDING_MODEL_NAME: str = "sentence-transformers/all-MiniLM-L6-v2"
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50

    # Groq AI Settings
    GROQ_API_KEY: str | None = None
    GROQ_MODEL_NAME: str = "llama-3.1-8b-instant"


    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
