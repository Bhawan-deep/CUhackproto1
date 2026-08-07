from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.simulation_service import SimulationService

router = APIRouter(prefix="/simulations", tags=["agents"])


@router.get("/{id}/agents/latest")
def get_latest_agent_decisions(id: UUID, db: Session = Depends(get_db)):
    """Retrieve recent agent decision records for a simulation."""
    return SimulationService.get_latest_agent_decisions(db, id)


@router.get("/{id}/agents/history")
def get_agent_decision_history(id: UUID, db: Session = Depends(get_db)):
    """Retrieve full chronological agent decision history."""
    return SimulationService.get_agent_decision_history(db, id)


@router.get("/{id}/agents/history/{tick}")
def get_agent_decisions_by_tick(id: UUID, tick: int, db: Session = Depends(get_db)):
    """Retrieve agent decision records generated at a specific tick."""
    return SimulationService.get_agent_decisions_by_tick(db, id, tick)
