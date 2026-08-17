import logging
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from backend.config.settings import settings
from backend.database.mongodb import MongoDB
from backend.api import auth, sessions, knowledge, users, chat, simulator, manager, scenarios

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for the AI-Powered Real-Time Customer Support Coaching Platform",
    version="1.0.0"
)

# Set CORS origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup / Shutdown Handlers
@app.on_event("startup")
async def startup_db_client():
    await MongoDB.connect_to_database()

@app.on_event("shutdown")
async def shutdown_db_client():
    await MongoDB.close_database_connection()

# Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(sessions.router, prefix="/api/sessions", tags=["Sessions"])
app.include_router(knowledge.router, prefix="/api/knowledge", tags=["Knowledge Base"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat Engine"])
app.include_router(simulator.router, prefix="/api/simulator", tags=["Simulator Engine"])
app.include_router(manager.router, prefix="/api/manager", tags=["Manager Portal"])
app.include_router(scenarios.router, prefix="/api/scenarios", tags=["Scenario Templates"])

@app.get("/api/health", tags=["Health"])
async def health_check():
    """Returns application health status."""
    mongodb_status = "connected" if MongoDB.client is not None else "disconnected"
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "database": {
            "mongodb": mongodb_status,
            "chromadb": "ready"  # Initialized lazily
        }
    }
