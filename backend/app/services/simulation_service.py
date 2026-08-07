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
    ParallelExperiment,
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
from app.models.simulation import AgentDecisionRecord, CausalEvent
from app.explainability.trace_builder import TraceBuilder


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

            # Persist agent decision records
            decisions = getattr(engine, "latest_agent_decisions", [])
            for dec in decisions:
                rec = AgentDecisionRecord(
                    simulation_id=sim.id,
                    tick=engine.tick,
                    agent_type=dec.get("agent_type", "unknown"),
                    action_type=dec.get("action_type", "unknown"),
                    decision_payload=dec.get("decision_payload", {}),
                    reasoning_summary=dec.get("reasoning_summary", ""),
                    provider=dec.get("provider", "mock")
                )
                db.add(rec)

            # Build and persist causal events
            try:
                from app.explainability.delta_analyzer import DeltaAnalyzer
                from app.explainability.causal_trace import CausalTraceBuilder
                prev_snap = db.query(Snapshot).filter(
                    Snapshot.simulation_id == sim.id,
                    Snapshot.tick == engine.tick - 1
                ).first()
                pre_st = prev_snap.state if prev_snap else {}
                deltas = DeltaAnalyzer.analyze(pre_st, export_data)
                trace_res = CausalTraceBuilder.build_trace(
                    str(sim.id), engine.tick, pre_st, export_data, deltas, decisions
                )
                for ev in trace_res.get("events", []):
                    c_ev = CausalEvent(
                        simulation_id=sim.id,
                        tick=engine.tick,
                        source_type=ev["source_type"],
                        source_id=str(ev["source_id"]) if ev.get("source_id") else None,
                        cause_type=ev["cause_type"],
                        action=ev["action"],
                        target_type=ev["target_type"],
                        target_id=str(ev["target_id"]) if ev.get("target_id") else None,
                        metric=ev["metric"],
                        before_value=ev.get("before_value"),
                        after_value=ev.get("after_value"),
                        delta=ev.get("delta"),
                        parent_event_id=ev.get("parent_event_id"),
                        confidence=ev.get("confidence", "deterministic"),
                        description=ev.get("description", ""),
                        causal_metadata=ev.get("metadata", {})
                    )
                    db.add(c_ev)
            except Exception as e:
                print(f"[Warning] Failed to generate causal events at tick {engine.tick}: {e}")


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
    def get_timeline(cls, db: Session, simulation_id: UUID) -> Dict[str, Any]:
        """
        Retrieve lightweight timeline metadata for a simulation.
        Returns simulation current_tick, snapshot tick list, and persisted policy/event intervention markers.
        Never returns full snapshot JSONB data.
        """
        sim = cls.get_simulation_by_id(db, simulation_id)
        if not sim:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Simulation with ID '{simulation_id}' not found"
            )

        # 1. Fetch available snapshot ticks (ordered asc)
        snapshots = db.query(Snapshot.tick).filter(Snapshot.simulation_id == sim.id).order_by(Snapshot.tick.asc()).all()
        snapshot_ticks = [{"tick": s[0]} for s in snapshots]

        # 2. Fetch persisted event interventions
        events = db.query(SimulationEvent).filter(SimulationEvent.simulation_id == sim.id).order_by(SimulationEvent.tick.asc()).all()
        event_markers = [
            {
                "id": str(e.id),
                "tick": e.tick,
                "type": "shock",
                "event_type": e.event_type,
                "name": e.event_type.upper().replace("_", " ") + " SHOCK",
                "severity": e.severity,
                "detail": f"Severity {int(e.severity * 100)}%",
                "created_at": e.created_at.isoformat() if e.created_at else None
            }
            for e in events
        ]

        # 3. Fetch persisted policy interventions (only include actual policy changes)
        policies = db.query(Policy).filter(Policy.simulation_id == sim.id).order_by(Policy.tick.asc()).all()
        policy_markers = []
        prev_tax = None
        prev_infra = None

        for p in policies:
            if prev_tax is None and prev_infra is None:
                prev_tax = p.tax_rate
                prev_infra = p.infrastructure_spending
                continue

            if p.tax_rate != prev_tax or p.infrastructure_spending != prev_infra:
                policy_markers.append({
                    "id": str(p.id),
                    "tick": p.tick,
                    "type": "policy",
                    "name": f"POLICY UPDATE (Tax {int(p.tax_rate * 100)}%, Infra ${int(p.infrastructure_spending / 1000)}k)",
                    "detail": f"Tax {int(p.tax_rate * 100)}%, Infra ${int(p.infrastructure_spending / 1000)}k/mo",
                    "tax_rate": p.tax_rate,
                    "infrastructure_spending": p.infrastructure_spending,
                    "created_at": p.created_at.isoformat() if p.created_at else None
                })
                prev_tax = p.tax_rate
                prev_infra = p.infrastructure_spending

        all_interventions = sorted(event_markers + policy_markers, key=lambda x: x["tick"])


        return {
            "simulation_id": str(sim.id),
            "current_tick": sim.current_tick,
            "status": sim.status.value,
            "snapshots": snapshot_ticks,
            "interventions": all_interventions
        }

    @classmethod
    def get_snapshot_world(cls, db: Session, simulation_id: UUID, tick: int) -> Dict[str, Any]:
        """
        Retrieve historical world state for a specific tick.
        Deserializes JSONB snapshot safely and transforms it into the clean frontend world representation.
        STRICTLY READ-ONLY: Does NOT mutate simulation current_tick or database state.
        """
        sim = cls.get_simulation_by_id(db, simulation_id)
        if not sim:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Simulation with ID '{simulation_id}' not found"
            )

        snapshot = db.query(Snapshot).filter(
            Snapshot.simulation_id == sim.id,
            Snapshot.tick == tick
        ).first()

        if not snapshot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Snapshot for tick {tick} not found in simulation '{simulation_id}'"
            )

        engine = MockSimulationEngine()
        engine.import_state(snapshot.state)
        return engine.get_full_world_state()

    @classmethod
    def fork_simulation_from_snapshot(
        cls,
        db: Session,
        source_simulation_id: UUID,
        source_tick: int,
        branch_name: str
    ) -> Simulation:
        """
        Fork a historical snapshot into a new standalone simulation branch.
        Preserves complete engine state (citizens, businesses, government, policy, events, RNG).
        STRICTLY DOES NOT MUTATE source simulation current_tick or history.
        """
        source_sim = cls.get_simulation_by_id(db, source_simulation_id)
        if not source_sim:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Source simulation '{source_simulation_id}' not found"
            )

        snapshot = db.query(Snapshot).filter(
            Snapshot.simulation_id == source_sim.id,
            Snapshot.tick == source_tick
        ).first()

        if not snapshot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Snapshot for tick {source_tick} not found in simulation '{source_simulation_id}'"
            )

        # 1. Create new branch Simulation record
        branch_sim = Simulation(
            name=branch_name,
            random_seed=source_sim.random_seed,
            current_tick=source_tick,
            status=SimulationStatus.PAUSED
        )
        db.add(branch_sim)
        db.flush()

        # 2. Restore engine state & update simulation_id
        engine = MockSimulationEngine()
        engine.import_state(snapshot.state)
        engine.simulation_id = branch_sim.id
        export_state = engine.export_state()

        # 3. Create initial branch snapshot at source_tick
        branch_snap = Snapshot(
            simulation_id=branch_sim.id,
            tick=source_tick,
            state=export_state,
            metrics=snapshot.metrics
        )
        db.add(branch_snap)

        # 4. Materialize GovernmentState record
        gov_obj = GovernmentState(
            simulation_id=branch_sim.id,
            tax_rate=engine.government.tax_rate,
            infrastructure_spending=engine.government.infrastructure_spending,
            treasury=engine.government.treasury,
            public_satisfaction=engine.government.public_satisfaction
        )
        db.add(gov_obj)

        # 5. Materialize Policy record
        pol_obj = Policy(
            simulation_id=branch_sim.id,
            tick=source_tick,
            tax_rate=engine.government.tax_rate,
            infrastructure_spending=engine.government.infrastructure_spending
        )
        db.add(pol_obj)

        # 6. Materialize Businesses & Citizens
        for b in engine.businesses:
            b_obj = Business(
                simulation_id=branch_sim.id,
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

        for c in engine.citizens:
            c_obj = Citizen(
                simulation_id=branch_sim.id,
                name=c.name,
                age=c.age,
                occupation=c.occupation,
                income=c.income,
                wealth=c.wealth,
                employed=c.employed,
                employer_id=None,
                satisfaction=c.satisfaction,
                current_goal=c.current_goal,
                recent_decisions=c.recent_decisions
            )
            db.add(c_obj)

        db.commit()
        db.refresh(branch_sim)
        return branch_sim

    @classmethod
    def create_experiment(
        cls,
        db: Session,
        source_simulation_id: UUID,
        source_tick: int,
        name: str = "Counterfactual Experiment",
        horizon_ticks: int = 12
    ) -> ParallelExperiment:
        """
        Create a parallel experiment by forking baseline (Universe A) and variant (Universe B)
        branches from the exact same historical snapshot tick.
        """
        sim_a = cls.fork_simulation_from_snapshot(
            db, source_simulation_id, source_tick, f"{name} - Universe A (Baseline)"
        )
        sim_b = cls.fork_simulation_from_snapshot(
            db, source_simulation_id, source_tick, f"{name} - Universe B (Experiment)"
        )

        experiment = ParallelExperiment(
            source_simulation_id=source_simulation_id,
            source_tick=source_tick,
            name=name,
            status="CREATED",
            horizon_ticks=horizon_ticks,
            baseline_simulation_id=sim_a.id,
            variant_simulation_id=sim_b.id,
            configuration={}
        )
        db.add(experiment)
        db.commit()
        db.refresh(experiment)
        return experiment

    @classmethod
    def run_experiment(
        cls,
        db: Session,
        experiment_id: UUID,
        horizon_ticks: int = 12,
        variant_policy: Optional[Dict[str, Any]] = None,
        variant_event: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Run both Universe A (Baseline) and Universe B (Variant) for N horizon ticks.
        Applies variant intervention to Universe B while keeping Universe A unchanged.
        Computes empirical counterfactual comparison deltas.
        """
        exp = db.query(ParallelExperiment).filter(ParallelExperiment.id == experiment_id).first()
        if not exp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Experiment '{experiment_id}' not found"
            )

        exp.status = "RUNNING"
        exp.horizon_ticks = horizon_ticks
        exp.configuration = {
            "variant_policy": variant_policy,
            "variant_event": variant_event,
            "horizon_ticks": horizon_ticks
        }
        db.commit()

        # Apply variant policy/event to Universe B if requested
        if variant_policy:
            cls.update_policy(db, exp.variant_simulation_id, PolicyUpdate(**variant_policy))
        if variant_event:
            cls.inject_event(db, exp.variant_simulation_id, EventCreate(**variant_event))

        # Advance Universe A (Baseline) N ticks
        for _ in range(horizon_ticks):
            cls.step_simulation(db, exp.baseline_simulation_id)

        # Advance Universe B (Variant) N ticks
        for _ in range(horizon_ticks):
            cls.step_simulation(db, exp.variant_simulation_id)

        # Compute empirical comparison results
        comparison = cls.compare_experiment_universes(db, exp.id)
        exp.comparison_results = comparison
        exp.status = "COMPLETED"
        db.commit()
        db.refresh(exp)

        return comparison

    @classmethod
    def compare_experiment_universes(cls, db: Session, experiment_id: UUID) -> Dict[str, Any]:
        """
        Compare Universe A (Baseline) vs Universe B (Variant) at their final tick.
        Extracts macro metric deltas and matches top diverging entities using stable logical IDs.
        """
        exp = db.query(ParallelExperiment).filter(ParallelExperiment.id == experiment_id).first()
        if not exp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Experiment '{experiment_id}' not found"
            )

        source_world = cls.get_snapshot_world(db, exp.source_simulation_id, exp.source_tick)
        sim_a = cls.get_simulation_by_id(db, exp.baseline_simulation_id)
        sim_b = cls.get_simulation_by_id(db, exp.variant_simulation_id)

        world_a = cls.get_snapshot_world(db, exp.baseline_simulation_id, sim_a.current_tick)
        world_b = cls.get_snapshot_world(db, exp.variant_simulation_id, sim_b.current_tick)

        metrics_a = world_a.get("metrics", {})
        metrics_b = world_b.get("metrics", {})

        macro_comparison = {
            "employment_rate": {
                "baseline": metrics_a.get("employment_rate", 0),
                "variant": metrics_b.get("employment_rate", 0),
                "delta": metrics_b.get("employment_rate", 0) - metrics_a.get("employment_rate", 0)
            },
            "economic_output": {
                "baseline": metrics_a.get("economic_output", 0),
                "variant": metrics_b.get("economic_output", 0),
                "delta": metrics_b.get("economic_output", 0) - metrics_a.get("economic_output", 0),
                "pct_delta": ((metrics_b.get("economic_output", 0) - metrics_a.get("economic_output", 0)) / max(metrics_a.get("economic_output", 1), 1)) * 100 if metrics_a.get("economic_output", 0) > 0 else 0
            },
            "inequality": {
                "baseline": metrics_a.get("inequality", 0),
                "variant": metrics_b.get("inequality", 0),
                "delta": metrics_b.get("inequality", 0) - metrics_a.get("inequality", 0)
            },
            "public_satisfaction": {
                "baseline": metrics_a.get("public_satisfaction", 0),
                "variant": metrics_b.get("public_satisfaction", 0),
                "delta": metrics_b.get("public_satisfaction", 0) - metrics_a.get("public_satisfaction", 0)
            },
            "business_health": {
                "baseline": metrics_a.get("business_health", 0),
                "variant": metrics_b.get("business_health", 0),
                "delta": metrics_b.get("business_health", 0) - metrics_a.get("business_health", 0)
            }
        }

        # Compare Business entities by stable business UUID (b.id)
        biz_a_map = {str(b["id"]): b for b in world_a.get("businesses", [])}
        biz_b_map = {str(b["id"]): b for b in world_b.get("businesses", [])}

        diverging_businesses = []
        for b_id, b_a in biz_a_map.items():
            b_b = biz_b_map.get(b_id)
            if not b_b:
                continue

            health_diff = b_b["health"] - b_a["health"]
            emp_diff = b_b["employee_count"] - b_a["employee_count"]
            rev_diff = b_b["revenue"] - b_a["revenue"]
            divergence_score = abs(health_diff) + (abs(emp_diff) / max(b_a["employee_count"], 1))

            diverging_businesses.append({
                "id": b_id,
                "name": b_a["name"],
                "industry": b_a["industry"],
                "baseline": {
                    "health": b_a["health"],
                    "employee_count": b_a["employee_count"],
                    "revenue": b_a["revenue"]
                },
                "variant": {
                    "health": b_b["health"],
                    "employee_count": b_b["employee_count"],
                    "revenue": b_b["revenue"]
                },
                "deltas": {
                    "health": health_diff,
                    "employee_count": emp_diff,
                    "revenue": rev_diff
                },
                "divergence_score": divergence_score
            })

        diverging_businesses.sort(key=lambda x: x["divergence_score"], reverse=True)

        # Compare Citizen Groups by occupation ID
        group_a_map = {str(g["id"]): g for g in world_a.get("citizen_groups", [])}
        group_b_map = {str(g["id"]): g for g in world_b.get("citizen_groups", [])}

        diverging_groups = []
        for g_id, g_a in group_a_map.items():
            g_b = group_b_map.get(g_id)
            if not g_b:
                continue

            emp_diff = g_b["employed_count"] - g_a["employed_count"]
            sat_diff = g_b["average_satisfaction"] - g_a["average_satisfaction"]
            inc_diff = g_b["average_income"] - g_a["average_income"]
            divergence_score = abs(sat_diff) + (abs(emp_diff) / max(g_a["count"], 1))

            diverging_groups.append({
                "id": g_id,
                "occupation": g_a["occupation"],
                "count": g_a["count"],
                "baseline": {
                    "employed_count": g_a["employed_count"],
                    "average_satisfaction": g_a["average_satisfaction"],
                    "average_income": g_a["average_income"]
                },
                "variant": {
                    "employed_count": g_b["employed_count"],
                    "average_satisfaction": g_b["average_satisfaction"],
                    "average_income": g_b["average_income"]
                },
                "deltas": {
                    "employed_count": emp_diff,
                    "satisfaction": sat_diff,
                    "income": inc_diff
                },
                "divergence_score": divergence_score
            })

        diverging_groups.sort(key=lambda x: x["divergence_score"], reverse=True)

        return {
            "experiment_id": str(exp.id),
            "source_simulation_id": str(exp.source_simulation_id),
            "source_tick": exp.source_tick,
            "final_tick": sim_a.current_tick,
            "horizon_ticks": exp.horizon_ticks,
            "source_metrics": source_world.get("metrics", {}),
            "baseline_simulation_id": str(exp.baseline_simulation_id),
            "variant_simulation_id": str(exp.variant_simulation_id),
            "macro_comparison": macro_comparison,
            "top_diverging_businesses": diverging_businesses[:5],
            "top_diverging_groups": diverging_groups[:5],
            "world_a": world_a,
            "world_b": world_b
        }

    @classmethod
    def get_experiment_snapshot(cls, db: Session, experiment_id: UUID, relative_tick: int) -> Dict[str, Any]:
        """
        Retrieve synchronized world snapshots for both Universe A and Universe B at a specific tick.
        Allows scrubbing parallel futures side-by-side in COMPARE WORLDS mode.
        """
        exp = db.query(ParallelExperiment).filter(ParallelExperiment.id == experiment_id).first()
        if not exp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Experiment '{experiment_id}' not found"
            )

        target_tick = exp.source_tick + relative_tick
        world_a = cls.get_snapshot_world(db, exp.baseline_simulation_id, target_tick)
        world_b = cls.get_snapshot_world(db, exp.variant_simulation_id, target_tick)

        return {
            "experiment_id": str(exp.id),
            "source_tick": exp.source_tick,
            "target_tick": target_tick,
            "relative_tick": relative_tick,
            "world_a": world_a,
            "world_b": world_b
        }




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

    @classmethod
    def get_agent_decision_history(cls, db: Session, simulation_id: UUID) -> List[Dict[str, Any]]:
        records = db.query(AgentDecisionRecord).filter(
            AgentDecisionRecord.simulation_id == simulation_id
        ).order_by(AgentDecisionRecord.tick.asc()).all()
        return [
            {
                "id": str(r.id),
                "simulation_id": str(r.simulation_id),
                "tick": r.tick,
                "agent_type": r.agent_type,
                "action_type": r.action_type,
                "decision_payload": r.decision_payload,
                "reasoning_summary": r.reasoning_summary,
                "provider": r.provider,
                "created_at": r.created_at.isoformat() if r.created_at else None
            }
            for r in records
        ]

    @classmethod
    def get_agent_decisions_by_tick(cls, db: Session, simulation_id: UUID, tick: int) -> List[Dict[str, Any]]:
        records = db.query(AgentDecisionRecord).filter(
            AgentDecisionRecord.simulation_id == simulation_id,
            AgentDecisionRecord.tick == tick
        ).all()
        return [
            {
                "id": str(r.id),
                "simulation_id": str(r.simulation_id),
                "tick": r.tick,
                "agent_type": r.agent_type,
                "action_type": r.action_type,
                "decision_payload": r.decision_payload,
                "reasoning_summary": r.reasoning_summary,
                "provider": r.provider,
                "created_at": r.created_at.isoformat() if r.created_at else None
            }
            for r in records
        ]

    @classmethod
    def get_tick_explanation(cls, db: Session, simulation_id: UUID, tick: int) -> Dict[str, Any]:
        return TraceBuilder.get_tick_explanation(db, simulation_id, tick)

    @classmethod
    def get_entity_explanation(cls, db: Session, simulation_id: UUID, tick: int, entity_id: str) -> Dict[str, Any]:
        return TraceBuilder.get_entity_explanation(db, simulation_id, tick, entity_id)

    @classmethod
    def get_range_explanation(cls, db: Session, simulation_id: UUID, from_tick: int, to_tick: int) -> Dict[str, Any]:
        return TraceBuilder.get_range_explanation(db, simulation_id, from_tick, to_tick)

