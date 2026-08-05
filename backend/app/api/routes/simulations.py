from typing import List, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.db.database import get_db, SessionLocal
from app.schemas.simulation import SimulationCreate, SimulationResponse
from app.schemas.state import (
    EconomicMetrics,
    PolicyState,
    PolicyUpdate,
    EventState,
    EventCreate,
    TickResult,
)
from app.services.simulation_service import SimulationService
from app.simulation.manager import SimulationManager
from app.websocket.manager import ws_manager
from app.websocket.publisher import publish_policy_updated, publish_event_injected

router = APIRouter()


@router.websocket("/ws/{simulation_id}")
async def websocket_simulation_endpoint(

    websocket: WebSocket,
    simulation_id: UUID
):
    """
    Real-time WebSocket connection endpoint per simulation UUID.
    Sends initial_state payload on connection, then streams tick and lifecycle events.
    """
    try:
        db = SessionLocal()
        try:
            sim = SimulationService.get_simulation_by_id(db, simulation_id)
            if not sim:
                print(f"[WS Error] Simulation '{simulation_id}' not found in DB")
                await websocket.close(code=4004, reason=f"Simulation '{simulation_id}' not found")
                return

            current_tick = sim.current_tick
            status_val = sim.status.value

            # Load engine to obtain initial state metrics & world summary
            engine = SimulationService.load_engine_for_simulation(db, sim)
            initial_metrics = engine.get_metrics().model_dump(mode="json")
            world_summary = engine.get_world_summary()
            policy_dict = PolicyState(
                tax_rate=engine.government.tax_rate,
                infrastructure_spending=engine.government.infrastructure_spending
            ).model_dump(mode="json")
            active_events = [e.model_dump(mode="json") for e in engine.active_events]

        finally:
            db.close()

        await ws_manager.connect(simulation_id, websocket)

        # 1. Send INITIAL_STATE message
        initial_payload = {
            "type": "initial_state",
            "simulation_id": str(simulation_id),
            "tick": current_tick,
            "status": status_val,
            "metrics": initial_metrics,
            "policy": policy_dict,
            "active_events": active_events,
            "world_summary": world_summary
        }

        await websocket.send_json(initial_payload)

        # Keep socket open to receive client close or server broadcasts
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        await ws_manager.disconnect(simulation_id, websocket)
    except Exception as e:
        print(f"[WS Error] Exception in websocket endpoint for '{simulation_id}': {e}")
        import traceback
        traceback.print_exc()
        await ws_manager.disconnect(simulation_id, websocket)



@router.post("", response_model=SimulationResponse, status_code=status.HTTP_201_CREATED)
def create_simulation(
    payload: SimulationCreate,
    db: Session = Depends(get_db)
):
    """Create a new simulation record."""
    return SimulationService.create_simulation(db, payload)


@router.get("", response_model=List[SimulationResponse])
def list_simulations(
    db: Session = Depends(get_db)
):
    """Retrieve all simulation records."""
    return SimulationService.get_simulations(db)


@router.get("/{simulation_id}", response_model=SimulationResponse)
def get_simulation(
    simulation_id: UUID,
    db: Session = Depends(get_db)
):
    """Retrieve a single simulation record by UUID."""
    simulation = SimulationService.get_simulation_by_id(db, simulation_id)
    if not simulation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Simulation with ID '{simulation_id}' not found"
        )
    return simulation


@router.get("/{simulation_id}/world")
def get_world(
    simulation_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Retrieve full current world state formatted for Phase 4B interactive visualization.
    Includes stable node IDs, citizen group aggregates, flows, and graph relationships.
    """
    return SimulationService.get_full_world_state(db, simulation_id)


@router.post("/{simulation_id}/start")
async def start_simulation(
    simulation_id: UUID,
    db: Session = Depends(get_db)
):
    """Start automatic background runner for simulation."""
    return await SimulationManager.start_simulation(db, simulation_id)


@router.post("/{simulation_id}/pause")
async def pause_simulation(
    simulation_id: UUID,
    db: Session = Depends(get_db)
):
    """Pause automatic background runner."""
    return await SimulationManager.pause_simulation(db, simulation_id)


@router.post("/{simulation_id}/resume")
async def resume_simulation(
    simulation_id: UUID,
    db: Session = Depends(get_db)
):
    """Resume automatic background runner from current state."""
    return await SimulationManager.resume_simulation(db, simulation_id)


@router.post("/{simulation_id}/step", response_model=TickResult)
async def step_simulation(
    simulation_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Manually advance simulation by 1 tick.
    Rejects with HTTP 409 Conflict if simulation is currently RUNNING.
    """
    return await SimulationManager.step_simulation(db, simulation_id)


@router.post("/{simulation_id}/reset")
async def reset_simulation(
    simulation_id: UUID,
    db: Session = Depends(get_db)
):
    """Stop runner and reset simulation to initial Tick 0 state."""
    return await SimulationManager.reset_simulation(db, simulation_id)


@router.get("/{simulation_id}/runtime")
def get_runtime_status(
    simulation_id: UUID,
    db: Session = Depends(get_db)
):
    """Get runtime runner status."""
    return SimulationManager.get_runtime_status(db, simulation_id)


@router.get("/{simulation_id}/metrics", response_model=EconomicMetrics)
def get_metrics(
    simulation_id: UUID,
    db: Session = Depends(get_db)
):
    """Retrieve current economic metrics for the simulation."""
    return SimulationService.get_current_metrics(db, simulation_id)


@router.get("/{simulation_id}/policy", response_model=PolicyState)
def get_policy(
    simulation_id: UUID,
    db: Session = Depends(get_db)
):
    """Retrieve current government policy parameters."""
    return SimulationService.get_policy(db, simulation_id)


@router.put("/{simulation_id}/policy", response_model=PolicyState)
async def update_policy(
    simulation_id: UUID,
    payload: PolicyUpdate,
    db: Session = Depends(get_db)
):
    """Update government policy parameters and broadcast change."""
    sim = SimulationService.get_simulation_by_id(db, simulation_id)
    new_policy = SimulationService.update_policy(db, simulation_id, payload)
    await publish_policy_updated(simulation_id, sim.current_tick, new_policy.model_dump(mode="json"))
    return new_policy


@router.post("/{simulation_id}/events", response_model=EventState, status_code=status.HTTP_201_CREATED)
async def inject_event(
    simulation_id: UUID,
    payload: EventCreate,
    db: Session = Depends(get_db)
):
    """Inject an economic event and broadcast change."""
    sim = SimulationService.get_simulation_by_id(db, simulation_id)
    event_state = SimulationService.inject_event(db, simulation_id, payload)
    await publish_event_injected(simulation_id, sim.current_tick, event_state.model_dump(mode="json"))
    return event_state


@router.get("/{simulation_id}/history/events")
def get_event_history(
    simulation_id: UUID,
    db: Session = Depends(get_db)
):
    """Retrieve persisted event injection history for the simulation."""
    return SimulationService.get_event_history(db, simulation_id)


@router.get("/{simulation_id}/history/policies")
def get_policy_history(
    simulation_id: UUID,
    db: Session = Depends(get_db)
):
    """Retrieve persisted policy change history for the simulation."""
    return SimulationService.get_policy_history(db, simulation_id)


