from datetime import datetime, timezone
from typing import Dict, Any, Optional
from uuid import UUID

from app.schemas.state import TickResult
from app.websocket.manager import ws_manager


async def publish_simulation_tick(
    simulation_id: UUID,
    tick_result: TickResult,
    world_summary: Dict[str, Any],
    status_str: str = "running"
) -> None:
    """
    Centralized publisher helper for broadcasting simulation tick state.
    Called ONLY AFTER the PostgreSQL database commit for the tick has succeeded.
    """
    message = {
        "type": "tick",
        "simulation_id": str(simulation_id),
        "tick": tick_result.tick,
        "status": status_str,
        "metrics": tick_result.metrics.model_dump(mode="json"),
        "policy": tick_result.policy.model_dump(mode="json"),
        "active_events": [e.model_dump(mode="json") for e in tick_result.active_events],
        "summary": tick_result.summary.model_dump(mode="json"),
        "world_summary": world_summary,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await ws_manager.broadcast(simulation_id, message)


async def publish_lifecycle(simulation_id: UUID, status_str: str, tick: int) -> None:
    """Broadcast lifecycle state changes (start, pause, resume)."""
    message = {
        "type": "lifecycle",
        "simulation_id": str(simulation_id),
        "status": status_str,
        "tick": tick
    }
    await ws_manager.broadcast(simulation_id, message)


async def publish_reset(simulation_id: UUID, initial_metrics: Dict[str, Any], world_summary: Dict[str, Any]) -> None:
    """Broadcast simulation reset to Tick 0 state."""
    message = {
        "type": "reset",
        "simulation_id": str(simulation_id),
        "status": "created",
        "tick": 0,
        "metrics": initial_metrics,
        "world_summary": world_summary
    }
    await ws_manager.broadcast(simulation_id, message)


async def publish_policy_updated(simulation_id: UUID, tick: int, policy_dict: Dict[str, Any]) -> None:
    """Broadcast government policy update."""
    message = {
        "type": "policy_updated",
        "simulation_id": str(simulation_id),
        "tick": tick,
        "policy": policy_dict
    }
    await ws_manager.broadcast(simulation_id, message)


async def publish_event_injected(simulation_id: UUID, tick: int, event_dict: Dict[str, Any]) -> None:
    """Broadcast injected economic event."""
    message = {
        "type": "event_injected",
        "simulation_id": str(simulation_id),
        "tick": tick,
        "event": event_dict
    }
    await ws_manager.broadcast(simulation_id, message)
