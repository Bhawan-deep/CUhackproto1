import asyncio
from typing import Dict, Any, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import SessionLocal
from app.models.simulation import Simulation, SimulationStatus
from app.schemas.state import TickResult
from app.services.simulation_service import SimulationService
from app.websocket.publisher import (
    publish_simulation_tick,
    publish_lifecycle,
    publish_reset
)


class SimulationManager:
    """
    Singleton Manager for orchestrating runtime simulation lifecycles.
    Manages non-blocking asyncio task runners, per-simulation concurrency locks,
    and post-commit live WebSocket broadcasts.
    """
    _active_runners: Dict[UUID, asyncio.Task] = {}
    _running_flags: Dict[UUID, bool] = {}
    _simulation_locks: Dict[UUID, asyncio.Lock] = {}

    @classmethod
    def _get_lock(cls, simulation_id: UUID) -> asyncio.Lock:
        if simulation_id not in cls._simulation_locks:
            cls._simulation_locks[simulation_id] = asyncio.Lock()
        return cls._simulation_locks[simulation_id]

    @classmethod
    async def _run_loop(cls, simulation_id: UUID) -> None:
        """
        Background tick runner loop.
        Acquires per-simulation lock ONLY while executing the tick step and DB commit,
        then broadcasts live tick message over WebSocket and sleeps tick_interval.
        """
        print(f"[SimulationManager] Background runner started for simulation '{simulation_id}'")
        while cls._running_flags.get(simulation_id, False):
            tick_data = None
            try:
                lock = cls._get_lock(simulation_id)
                async with lock:
                    if not cls._running_flags.get(simulation_id, False):
                        break
                    db = SessionLocal()
                    try:
                        tick_result, world_summary = SimulationService.step_simulation(db, simulation_id)
                        tick_data = (tick_result, world_summary)
                    finally:
                        db.close()
            except Exception as e:
                print(f"[SimulationManager Error] Runner for simulation '{simulation_id}' error: {e}")

            # Publish live tick message outside lock after DB transaction succeeded
            if tick_data:
                tick_res, w_summary = tick_data
                await publish_simulation_tick(simulation_id, tick_res, w_summary, status_str="running")

            # Sleep outside lock
            await asyncio.sleep(settings.SIMULATION_TICK_INTERVAL)

        print(f"[SimulationManager] Background runner stopped for simulation '{simulation_id}'")

    @classmethod
    async def start_simulation(cls, db: Session, simulation_id: UUID) -> Dict[str, Any]:
        """Start or resume automatic ticking for a simulation."""
        lock = cls._get_lock(simulation_id)
        async with lock:
            sim = SimulationService.get_simulation_by_id(db, simulation_id)
            if not sim:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Simulation with ID '{simulation_id}' not found"
                )

            # Idempotent check for already running task
            existing_task = cls._active_runners.get(simulation_id)
            if sim.status == SimulationStatus.RUNNING and existing_task and not existing_task.done():
                return {
                    "simulation_id": str(sim.id),
                    "status": sim.status.value,
                    "current_tick": sim.current_tick,
                    "message": "Simulation is already running"
                }

            # Ensure Tick 0 initialized if new
            SimulationService.load_engine_for_simulation(db, sim)

            sim.status = SimulationStatus.RUNNING
            db.add(sim)
            db.commit()
            db.refresh(sim)

            cls._running_flags[simulation_id] = True
            cls._active_runners[simulation_id] = asyncio.create_task(cls._run_loop(simulation_id))

        await publish_lifecycle(simulation_id, "running", sim.current_tick)

        return {
            "simulation_id": str(sim.id),
            "status": sim.status.value,
            "current_tick": sim.current_tick,
            "message": "Simulation started successfully"
        }

    @classmethod
    async def pause_simulation(cls, db: Session, simulation_id: UUID) -> Dict[str, Any]:
        """Pause automatic ticking and preserve all current state."""
        lock = cls._get_lock(simulation_id)
        async with lock:
            sim = SimulationService.get_simulation_by_id(db, simulation_id)
            if not sim:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Simulation with ID '{simulation_id}' not found"
                )

            cls._running_flags[simulation_id] = False
            task = cls._active_runners.pop(simulation_id, None)
            if task and not task.done():
                task.cancel()

            sim.status = SimulationStatus.PAUSED
            db.add(sim)
            db.commit()
            db.refresh(sim)

        await publish_lifecycle(simulation_id, "paused", sim.current_tick)

        return {
            "simulation_id": str(sim.id),
            "status": sim.status.value,
            "current_tick": sim.current_tick,
            "message": "Simulation paused successfully"
        }

    @classmethod
    async def resume_simulation(cls, db: Session, simulation_id: UUID) -> Dict[str, Any]:
        """Resume automatic ticking from current state."""
        return await cls.start_simulation(db, simulation_id)

    @classmethod
    async def step_simulation(cls, db: Session, simulation_id: UUID) -> TickResult:
        """
        Manually step the simulation by exactly 1 tick.
        Rejects with HTTP 409 Conflict if simulation is currently RUNNING.
        """
        sim = SimulationService.get_simulation_by_id(db, simulation_id)
        if not sim:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Simulation with ID '{simulation_id}' not found"
            )

        if sim.status == SimulationStatus.RUNNING or cls._running_flags.get(simulation_id, False):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Pause the simulation before manually stepping."
            )

        lock = cls._get_lock(simulation_id)
        async with lock:
            tick_result, world_summary = SimulationService.step_simulation(db, simulation_id)
            
            # Set status to PAUSED after manual step
            sim.status = SimulationStatus.PAUSED
            db.add(sim)
            db.commit()

        # Broadcast tick message post-commit
        await publish_simulation_tick(simulation_id, tick_result, world_summary, status_str="paused")
        return tick_result

    @classmethod
    async def reset_simulation(cls, db: Session, simulation_id: UUID) -> Dict[str, Any]:
        """Stop runner and reset simulation to fresh Tick 0 initial state."""
        lock = cls._get_lock(simulation_id)
        async with lock:
            cls._running_flags[simulation_id] = False
            task = cls._active_runners.pop(simulation_id, None)
            if task and not task.done():
                task.cancel()

            res = SimulationService.reset_simulation(db, simulation_id)
            engine = SimulationService.load_engine_for_simulation(db, SimulationService.get_simulation_by_id(db, simulation_id))
            initial_metrics = engine.get_metrics().model_dump(mode="json")
            world_summary = engine.get_world_summary()

        await publish_reset(simulation_id, initial_metrics, world_summary)
        return res

    @classmethod
    def get_runtime_status(cls, db: Session, simulation_id: UUID) -> Dict[str, Any]:
        """Return runtime status of simulation."""
        sim = SimulationService.get_simulation_by_id(db, simulation_id)
        if not sim:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Simulation with ID '{simulation_id}' not found"
            )

        task = cls._active_runners.get(simulation_id)
        runner_active = task is not None and not task.done() and cls._running_flags.get(simulation_id, False)

        return {
            "simulation_id": str(sim.id),
            "status": sim.status.value,
            "current_tick": sim.current_tick,
            "runner_active": runner_active,
            "tick_interval": settings.SIMULATION_TICK_INTERVAL
        }
