from typing import Optional, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.db.database import get_db
from app.services.simulation_service import SimulationService

router = APIRouter(prefix="/experiments", tags=["experiments"])


class ExperimentCreatePayload(BaseModel):
    source_tick: int
    name: Optional[str] = "Counterfactual Experiment"
    horizon_ticks: Optional[int] = 12


class ExperimentRunPayload(BaseModel):
    horizon_ticks: Optional[int] = 12
    variant_policy: Optional[Dict[str, Any]] = None
    variant_event: Optional[Dict[str, Any]] = None


@router.post("/simulations/{source_id}", status_code=status.HTTP_201_CREATED)
def create_experiment(
    source_id: UUID,
    payload: ExperimentCreatePayload,
    db: Session = Depends(get_db)
):
    """
    Create a parallel experiment by forking baseline (Universe A) and variant (Universe B)
    branches from the exact same historical snapshot tick.
    """
    return SimulationService.create_experiment(
        db=db,
        source_simulation_id=source_id,
        source_tick=payload.source_tick,
        name=payload.name,
        horizon_ticks=payload.horizon_ticks
    )


@router.post("/{experiment_id}/run")
def run_experiment(
    experiment_id: UUID,
    payload: ExperimentRunPayload,
    db: Session = Depends(get_db)
):
    """
    Run both Universe A (Baseline) and Universe B (Variant) for N horizon ticks.
    Computes empirical counterfactual comparison deltas.
    """
    return SimulationService.run_experiment(
        db=db,
        experiment_id=experiment_id,
        horizon_ticks=payload.horizon_ticks or 12,
        variant_policy=payload.variant_policy,
        variant_event=payload.variant_event
    )


@router.get("/{experiment_id}")
def get_experiment_comparison(
    experiment_id: UUID,
    db: Session = Depends(get_db)
):
    """Retrieve full counterfactual comparison for an experiment."""
    return SimulationService.compare_experiment_universes(db, experiment_id)


@router.get("/{experiment_id}/snapshots/{relative_tick}")
def get_experiment_snapshot(
    experiment_id: UUID,
    relative_tick: int,
    db: Session = Depends(get_db)
):
    """
    Retrieve synchronized world snapshots for both Universe A and Universe B at a specific tick.
    """
    return SimulationService.get_experiment_snapshot(db, experiment_id, relative_tick)
