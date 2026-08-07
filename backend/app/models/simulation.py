import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime,
    Enum as SQLEnum, Uuid, ForeignKey, JSON, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.db.database import Base


class SimulationStatus(str, enum.Enum):
    CREATED = "created"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"


class Simulation(Base):
    __tablename__ = "simulations"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    status = Column(
        SQLEnum(SimulationStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=SimulationStatus.CREATED
    )
    current_tick = Column(Integer, nullable=False, default=0)
    random_seed = Column(Integer, nullable=False, default=42)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )


class Citizen(Base):
    __tablename__ = "citizens"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    simulation_id = Column(Uuid(as_uuid=True), ForeignKey("simulations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    age = Column(Integer, nullable=False)
    occupation = Column(String(100), nullable=False)
    income = Column(Float, nullable=False, default=0.0)
    wealth = Column(Float, nullable=False, default=0.0)
    employed = Column(Boolean, nullable=False, default=False)
    employer_id = Column(Uuid(as_uuid=True), nullable=True)
    satisfaction = Column(Float, nullable=False, default=0.7)
    current_goal = Column(String(255), nullable=False)
    recent_decisions = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class Business(Base):
    __tablename__ = "businesses"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    simulation_id = Column(Uuid(as_uuid=True), ForeignKey("simulations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    industry = Column(String(100), nullable=False)
    employee_count = Column(Integer, nullable=False, default=0)
    revenue = Column(Float, nullable=False, default=0.0)
    expenses = Column(Float, nullable=False, default=0.0)
    profit = Column(Float, nullable=False, default=0.0)
    health = Column(Float, nullable=False, default=1.0)
    current_goal = Column(String(255), nullable=False)
    recent_decisions = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class GovernmentState(Base):
    __tablename__ = "government_states"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    simulation_id = Column(Uuid(as_uuid=True), ForeignKey("simulations.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    tax_rate = Column(Float, nullable=False, default=0.20)
    infrastructure_spending = Column(Float, nullable=False, default=50000.0)
    treasury = Column(Float, nullable=False, default=1000000.0)
    public_satisfaction = Column(Float, nullable=False, default=0.70)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class Policy(Base):
    __tablename__ = "policies"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    simulation_id = Column(Uuid(as_uuid=True), ForeignKey("simulations.id", ondelete="CASCADE"), nullable=False, index=True)
    tick = Column(Integer, nullable=False)
    tax_rate = Column(Float, nullable=False)
    infrastructure_spending = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))


class SimulationEvent(Base):
    __tablename__ = "simulation_events"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    simulation_id = Column(Uuid(as_uuid=True), ForeignKey("simulations.id", ondelete="CASCADE"), nullable=False, index=True)
    tick = Column(Integer, nullable=False)
    event_type = Column(String(100), nullable=False)
    severity = Column(Float, nullable=False, default=0.5)
    event_metadata = Column("metadata", JSON, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    simulation_id = Column(Uuid(as_uuid=True), ForeignKey("simulations.id", ondelete="CASCADE"), nullable=False, index=True)
    tick = Column(Integer, nullable=False)
    from_agent_id = Column(Uuid(as_uuid=True), nullable=True)
    to_agent_id = Column(Uuid(as_uuid=True), nullable=True)
    transaction_type = Column(String(100), nullable=False)
    amount = Column(Float, nullable=False)
    tx_metadata = Column("metadata", JSON, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))



class Snapshot(Base):
    __tablename__ = "snapshots"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    simulation_id = Column(Uuid(as_uuid=True), ForeignKey("simulations.id", ondelete="CASCADE"), nullable=False, index=True)
    tick = Column(Integer, nullable=False)
    state = Column(JSON, nullable=False)
    metrics = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("simulation_id", "tick", name="uq_snapshot_sim_tick"),
    )


class ParallelExperiment(Base):
    __tablename__ = "parallel_experiments"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_simulation_id = Column(Uuid(as_uuid=True), ForeignKey("simulations.id", ondelete="CASCADE"), nullable=False, index=True)
    source_tick = Column(Integer, nullable=False)
    name = Column(String(255), nullable=False, default="Counterfactual Experiment")
    status = Column(String(50), nullable=False, default="CREATED")
    horizon_ticks = Column(Integer, nullable=False, default=12)
    baseline_simulation_id = Column(Uuid(as_uuid=True), ForeignKey("simulations.id", ondelete="CASCADE"), nullable=False)
    variant_simulation_id = Column(Uuid(as_uuid=True), ForeignKey("simulations.id", ondelete="CASCADE"), nullable=False)
    configuration = Column(JSON, nullable=False, default=dict)
    comparison_results = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

