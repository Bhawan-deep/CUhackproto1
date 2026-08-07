from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.simulation_service import SimulationService

router = APIRouter(prefix="/simulations", tags=["explainability"])


@router.get("/{id}/explain/range")
def get_range_explanation(
    id: UUID,
    from_tick: int = Query(..., alias="from_tick"),
    to_tick: int = Query(..., alias="to_tick"),
    db: Session = Depends(get_db)
):
    """Retrieve dominant simulated causal chains and most affected entities across a tick range."""
    return SimulationService.get_range_explanation(db, id, from_tick, to_tick)


@router.get("/{id}/explain/{tick}")
def get_tick_explanation(id: UUID, tick: int, db: Session = Depends(get_db)):
    """Retrieve full simulated causal trace and agent decision explanations for a specific tick."""
    return SimulationService.get_tick_explanation(db, id, tick)


@router.get("/{id}/explain/{tick}/entity/{entity_id}")
def get_entity_explanation(id: UUID, tick: int, entity_id: str, db: Session = Depends(get_db)):
    """Retrieve entity-specific simulated causal trace explaining what happened to this node during a tick."""
    return SimulationService.get_entity_explanation(db, id, tick, entity_id)
