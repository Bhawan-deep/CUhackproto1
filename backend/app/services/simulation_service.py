from typing import List, Optional, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.simulation import (
    Simulation,
    SimulationStatus,
    Citizen,
    Business,
    GovernmentState,
    Policy,
    SimulationEvent,
    Snapshot,
)
from app.schemas.simulation import SimulationCreate
from app.schemas.state import (
    EconomicMetrics,
    PolicyState,
    PolicyUpdate,
    EventState,
    EventCreate,
    TickResult,
)
from app.simulation.mock_engine import MockSimulationEngine

SUPPORTED_EVENTS = {"flood", "recession", "boom", "factory_closure", "investment_stimulus"}


class SimulationService:
    @staticmethod
    def create_simulation(db: Session, data: SimulationCreate) -> Simulation:
        simulation = Simulation(
            name=data.name,
            random_seed=data.random_seed,
            status=SimulationStatus.CREATED,
            current_tick=0,
        )
        db.add(simulation)
        db.commit()
        db.refresh(simulation)
        return simulation

    @staticmethod
    def get_simulations(db: Session) -> List[Simulation]:
        return db.query(Simulation).order_by(Simulation.created_at.desc()).all()

    @staticmethod
    def get_simulation_by_id(db: Session, simulation_id: UUID) -> Optional[Simulation]:
        return db.query(Simulation).filter(Simulation.id == simulation_id).first()

    @staticmethod
    def load_engine_for_simulation(db: Session, sim: Simulation) -> MockSimulationEngine:
        """
        Load an engine instance for a simulation.
        If a Snapshot exists for sim.current_tick, import state from DB JSONB snapshot.
        Otherwise, initialize state, persist Snapshot tick 0 and initial database records.
        """
        engine = MockSimulationEngine()

        # Check for existing snapshot at current_tick
        snapshot = db.query(Snapshot).filter(
            Snapshot.simulation_id == sim.id,
            Snapshot.tick == sim.current_tick
        ).first()

        if snapshot and snapshot.state:
            # Import engine state from persisted JSON snapshot
            engine.import_state(snapshot.state)
        else:
            # First-time initialization for this simulation (Tick 0)
            engine.initialize(simulation_id=sim.id, seed=sim.random_seed)
            export_data = engine.export_state()

            # Atomic persistence of Tick 0 initial state
            try:
                # 1. Government State
                gov_obj = GovernmentState(
                    simulation_id=sim.id,
                    tax_rate=engine.government.tax_rate,
                    infrastructure_spending=engine.government.infrastructure_spending,
                    treasury=engine.government.treasury,
                    public_satisfaction=engine.government.public_satisfaction
                )
                db.merge(gov_obj)

                # 2. Citizens
                for c in engine.citizens:
                    c_obj = Citizen(
                        id=c.id,
                        simulation_id=sim.id,
                        name=c.name,
                        age=c.age,
                        occupation=c.occupation,
                        income=c.income,
                        wealth=c.wealth,
                        employed=c.employed,
                        employer_id=c.employer_id,
                        satisfaction=c.satisfaction,
                        current_goal=c.current_goal,
                        recent_decisions=c.recent_decisions
                    )
                    db.merge(c_obj)

                # 3. Businesses
                for b in engine.businesses:
                    b_obj = Business(
                        id=b.id,
                        simulation_id=sim.id,
                        name=b.name,
                        industry=b.industry,
                        employee_count=b.employee_count,
                        revenue=b.revenue,
                        expenses=b.expenses,
                        profit=b.profit,
                        health=b.health,
                        current_goal=b.current_goal,
                        recent_decisions=b.recent_decisions
                    )
                    db.merge(b_obj)

                # 4. Policy record
                policy_obj = Policy(
                    simulation_id=sim.id,
                    tick=0,
                    tax_rate=engine.government.tax_rate,
                    infrastructure_spending=engine.government.infrastructure_spending
                )
                db.add(policy_obj)

                # 5. Snapshot Tick 0
                snapshot_obj = Snapshot(
                    simulation_id=sim.id,
                    tick=0,
                    state=export_data,
                    metrics=engine.get_metrics().model_dump(mode="json")
                )
                db.add(snapshot_obj)

                db.commit()
            except Exception:
                db.rollback()
                raise

        return engine

    @classmethod
    def step_simulation(cls, db: Session, simulation_id: UUID) -> TickResult:
        """
        Execute exactly ONE simulation step and persist state atomically.
        """
        sim = cls.get_simulation_by_id(db, simulation_id)
        if not sim:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Simulation with ID '{simulation_id}' not found"
            )

        # 1. Load engine state (ensures Tick 0 snapshot exists if uninitialized)
        engine = cls.load_engine_for_simulation(db, sim)

        # 2. Execute step
        tick_result = engine.step()
        export_data = engine.export_state()

        # 3. Persist updated state atomically in a DB transaction
        try:
            # Update Simulation current_tick and status
            sim.current_tick = engine.tick
            sim.status = SimulationStatus.RUNNING
            db.add(sim)

            # Update Government State
            gov_obj = db.query(GovernmentState).filter(GovernmentState.simulation_id == sim.id).first()
            if not gov_obj:
                gov_obj = GovernmentState(simulation_id=sim.id)
            gov_obj.tax_rate = engine.government.tax_rate
            gov_obj.infrastructure_spending = engine.government.infrastructure_spending
            gov_obj.treasury = engine.government.treasury
            gov_obj.public_satisfaction = engine.government.public_satisfaction
            db.add(gov_obj)

            # Update Citizens
            for c in engine.citizens:
                c_obj = db.query(Citizen).filter(Citizen.id == c.id).first()
                if not c_obj:
                    c_obj = Citizen(id=c.id, simulation_id=sim.id)
                c_obj.name = c.name
                c_obj.age = c.age
                c_obj.occupation = c.occupation
                c_obj.income = c.income
                c_obj.wealth = c.wealth
                c_obj.employed = c.employed
                c_obj.employer_id = c.employer_id
                c_obj.satisfaction = c.satisfaction
                c_obj.current_goal = c.current_goal
                c_obj.recent_decisions = c.recent_decisions
                db.add(c_obj)

            # Update Businesses
            for b in engine.businesses:
                b_obj = db.query(Business).filter(Business.id == b.id).first()
                if not b_obj:
                    b_obj = Business(id=b.id, simulation_id=sim.id)
                b_obj.name = b.name
                b_obj.industry = b.industry
                b_obj.employee_count = b.employee_count
                b_obj.revenue = b.revenue
                b_obj.expenses = b.expenses
                b_obj.profit = b.profit
                b_obj.health = b.health
                b_obj.current_goal = b.current_goal
                b_obj.recent_decisions = b.recent_decisions
                db.add(b_obj)

            # Save Policy record for tick
            policy_obj = Policy(
                simulation_id=sim.id,
                tick=engine.tick,
                tax_rate=engine.government.tax_rate,
                infrastructure_spending=engine.government.infrastructure_spending
            )
            db.add(policy_obj)

            # Save Snapshot for tick
            snapshot_obj = Snapshot(
                simulation_id=sim.id,
                tick=engine.tick,
                state=export_data,
                metrics=tick_result.metrics.model_dump(mode="json")
            )
            db.add(snapshot_obj)

            # Commit transaction atomically
            db.commit()
        except Exception:
            db.rollback()
            raise

        world_summary = engine.get_world_summary()
        return tick_result, world_summary

    @classmethod
    def get_full_world_state(cls, db: Session, simulation_id: UUID) -> Dict[str, Any]:
        """
        Retrieve detailed current world state formatted for Phase 4B interactive visualization.
        """
        sim = cls.get_simulation_by_id(db, simulation_id)
        if not sim:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Simulation with ID '{simulation_id}' not found"
            )
        engine = cls.load_engine_for_simulation(db, sim)
        return engine.get_full_world_state()


    @classmethod
    def get_current_metrics(cls, db: Session, simulation_id: UUID) -> EconomicMetrics:
        sim = cls.get_simulation_by_id(db, simulation_id)
        if not sim:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Simulation with ID '{simulation_id}' not found"
            )
        engine = cls.load_engine_for_simulation(db, sim)
        return engine.get_metrics()

    @classmethod
    def get_policy(cls, db: Session, simulation_id: UUID) -> PolicyState:
        sim = cls.get_simulation_by_id(db, simulation_id)
        if not sim:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Simulation with ID '{simulation_id}' not found"
            )
        engine = cls.load_engine_for_simulation(db, sim)
        return PolicyState(
            tax_rate=engine.government.tax_rate,
            infrastructure_spending=engine.government.infrastructure_spending
        )

    @classmethod
    def update_policy(cls, db: Session, simulation_id: UUID, payload: PolicyUpdate) -> PolicyState:
        sim = cls.get_simulation_by_id(db, simulation_id)
        if not sim:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Simulation with ID '{simulation_id}' not found"
            )
        engine = cls.load_engine_for_simulation(db, sim)
        new_policy = engine.update_policy(payload.model_dump(exclude_unset=True))
        
        # Persist updated policy to database and active snapshot
        try:
            gov_obj = db.query(GovernmentState).filter(GovernmentState.simulation_id == sim.id).first()
            if gov_obj:
                gov_obj.tax_rate = new_policy.tax_rate
                gov_obj.infrastructure_spending = new_policy.infrastructure_spending
                db.add(gov_obj)

            snapshot = db.query(Snapshot).filter(
                Snapshot.simulation_id == sim.id,
                Snapshot.tick == sim.current_tick
            ).first()
            if snapshot:
                snapshot.state = engine.export_state()
                db.add(snapshot)

            db.commit()

        except Exception:
            db.rollback()
            raise

        return new_policy

    @classmethod
    def inject_event(cls, db: Session, simulation_id: UUID, payload: EventCreate) -> EventState:
        sim = cls.get_simulation_by_id(db, simulation_id)
        if not sim:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Simulation with ID '{simulation_id}' not found"
            )
        if payload.type not in SUPPORTED_EVENTS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported event type '{payload.type}'. Supported types: {list(SUPPORTED_EVENTS)}"
            )

        engine = cls.load_engine_for_simulation(db, sim)
        event_state = engine.inject_event(payload.type, payload.severity, payload.metadata)

        # Persist event to DB
        try:
            ev_obj = SimulationEvent(
                id=event_state.id,
                simulation_id=sim.id,
                tick=sim.current_tick,
                event_type=payload.type,
                severity=payload.severity,
                event_metadata=payload.metadata or {}
            )
            db.add(ev_obj)

            # Update current snapshot
            snapshot = db.query(Snapshot).filter(
                Snapshot.simulation_id == sim.id,
                Snapshot.tick == sim.current_tick
            ).first()
            if snapshot:
                snapshot.state = engine.export_state()
                db.add(snapshot)

            db.commit()
        except Exception:
            db.rollback()
            raise

        return event_state

    @classmethod
    def get_event_history(cls, db: Session, simulation_id: UUID) -> List[Dict[str, Any]]:
        """Retrieve persisted event injection history from DB."""
        sim = cls.get_simulation_by_id(db, simulation_id)
        if not sim:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Simulation with ID '{simulation_id}' not found"
            )
        events = db.query(SimulationEvent).filter(SimulationEvent.simulation_id == sim.id).order_by(SimulationEvent.tick.asc()).all()
        return [
            {
                "id": str(e.id),
                "tick": e.tick,
                "event_type": e.event_type,
                "severity": e.severity,
                "metadata": e.event_metadata or {},
                "created_at": e.created_at.isoformat() if e.created_at else None
            }
            for e in events
        ]

    @classmethod
    def get_policy_history(cls, db: Session, simulation_id: UUID) -> List[Dict[str, Any]]:
        """Retrieve persisted policy change history from DB."""
        sim = cls.get_simulation_by_id(db, simulation_id)
        if not sim:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Simulation with ID '{simulation_id}' not found"
            )
        policies = db.query(Policy).filter(Policy.simulation_id == sim.id).order_by(Policy.tick.asc()).all()
        return [
            {
                "id": str(p.id),
                "tick": p.tick,
                "tax_rate": p.tax_rate,
                "infrastructure_spending": p.infrastructure_spending,
                "created_at": p.created_at.isoformat() if p.created_at else None
            }
            for p in policies
        ]


    @classmethod
    def reset_simulation(cls, db: Session, simulation_id: UUID) -> Dict[str, Any]:
        """
        Reset simulation back to original deterministic Tick 0 state using its original random_seed.
        Wipes old historical snapshots, events, policies, citizens, and businesses for that simulation.
        """
        sim = cls.get_simulation_by_id(db, simulation_id)
        if not sim:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Simulation with ID '{simulation_id}' not found"
            )

        try:
            # Delete old historical records for this simulation
            db.query(Snapshot).filter(Snapshot.simulation_id == sim.id).delete()
            db.query(SimulationEvent).filter(SimulationEvent.simulation_id == sim.id).delete()
            db.query(Policy).filter(Policy.simulation_id == sim.id).delete()
            db.query(Citizen).filter(Citizen.simulation_id == sim.id).delete()
            db.query(Business).filter(Business.simulation_id == sim.id).delete()
            db.query(GovernmentState).filter(GovernmentState.simulation_id == sim.id).delete()

            # Reset simulation record state
            sim.current_tick = 0
            sim.status = SimulationStatus.CREATED
            db.add(sim)

            # Re-initialize deterministic engine Tick 0 state
            engine = MockSimulationEngine()
            engine.initialize(simulation_id=sim.id, seed=sim.random_seed)
            export_data = engine.export_state()

            # Persist fresh Tick 0 records
            gov_obj = GovernmentState(
                simulation_id=sim.id,
                tax_rate=engine.government.tax_rate,
                infrastructure_spending=engine.government.infrastructure_spending,
                treasury=engine.government.treasury,
                public_satisfaction=engine.government.public_satisfaction
            )
            db.add(gov_obj)

            for c in engine.citizens:
                c_obj = Citizen(
                    id=c.id,
                    simulation_id=sim.id,
                    name=c.name,
                    age=c.age,
                    occupation=c.occupation,
                    income=c.income,
                    wealth=c.wealth,
                    employed=c.employed,
                    employer_id=c.employer_id,
                    satisfaction=c.satisfaction,
                    current_goal=c.current_goal,
                    recent_decisions=c.recent_decisions
                )
                db.add(c_obj)

            for b in engine.businesses:
                b_obj = Business(
                    id=b.id,
                    simulation_id=sim.id,
                    name=b.name,
                    industry=b.industry,
                    employee_count=b.employee_count,
                    revenue=b.revenue,
                    expenses=b.expenses,
                    profit=b.profit,
                    health=b.health,
                    current_goal=b.current_goal,
                    recent_decisions=b.recent_decisions
                )
                db.add(b_obj)

            policy_obj = Policy(
                simulation_id=sim.id,
                tick=0,
                tax_rate=engine.government.tax_rate,
                infrastructure_spending=engine.government.infrastructure_spending
            )
            db.add(policy_obj)

            snapshot_obj = Snapshot(
                simulation_id=sim.id,
                tick=0,
                state=export_data,
                metrics=engine.get_metrics().model_dump(mode="json")
            )
            db.add(snapshot_obj)

            db.commit()
            db.refresh(sim)
        except Exception:
            db.rollback()
            raise

        return {
            "simulation_id": str(sim.id),
            "status": sim.status.value,
            "current_tick": 0,
            "message": "Simulation reset to initial deterministic state"
        }

    @classmethod
    def normalize_stale_running_simulations(cls, db: Session) -> int:
        """
        Normalize stale RUNNING database records to PAUSED on server startup.
        """
        try:
            stale_sims = db.query(Simulation).filter(Simulation.status == SimulationStatus.RUNNING).all()
            count = len(stale_sims)
            for sim in stale_sims:
                sim.status = SimulationStatus.PAUSED
                db.add(sim)
            db.commit()
            if count > 0:
                print(f"[Startup Recovery] Normalized {count} stale RUNNING simulation(s) to PAUSED")
            return count
        except Exception as e:
            db.rollback()
            print(f"[Warning] Failed to normalize stale simulations on startup: {e}")
            return 0
