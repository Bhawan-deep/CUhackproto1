from fastapi import APIRouter
from app.api.routes import health, simulations

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(simulations.router, prefix="/simulations", tags=["Simulations"])

__all__ = ["api_router"]
