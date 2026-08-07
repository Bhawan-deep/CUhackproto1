from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.core.config import settings
from app.db.database import init_db, SessionLocal
from app.services.simulation_service import SimulationService


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on application startup
    try:
        init_db()
        db = SessionLocal()
        try:
            # Normalize any stale RUNNING records in database to PAUSED after server restart
            SimulationService.normalize_stale_running_simulations(db)
        finally:
            db.close()
    except Exception as e:
        print(f"[Warning] Database initialization/recovery on startup encountered an issue: {e}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Real-time agent-based city & economic simulation backend API",
    version="0.1.0",
    lifespan=lifespan
)

# Configure CORS for local Vite frontend access
origins = [
    settings.FRONTEND_ORIGIN,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register API routes under /api prefix
app.include_router(api_router, prefix="/api")


@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "docs": "/docs",
        "health": "/api/health"
    }
