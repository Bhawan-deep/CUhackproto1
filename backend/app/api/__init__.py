from fastapi import APIRouter
from app.api.routes import health, simulations, experiments, agents, explainability

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(simulations.router, prefix="/simulations", tags=["Simulations"])
api_router.include_router(experiments.router, tags=["Experiments"])
api_router.include_router(agents.router, tags=["Agents"])
api_router.include_router(explainability.router, tags=["Explainability"])

__all__ = ["api_router"]
