from typing import List, Optional, Any, Dict
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class DecisionLog(BaseModel):
    tick: int
    action: str
    reason: str


class CitizenState(BaseModel):
    id: UUID
    simulation_id: UUID
    name: str
    age: int
    occupation: str
    income: float
    wealth: float
    employed: bool
    employer_id: Optional[UUID] = None
    satisfaction: float = Field(ge=0.0, le=1.0)
    trust: float = Field(default=0.70, ge=0.0, le=1.0)
    tax_compliance: float = Field(default=0.85, ge=0.0, le=1.0)
    current_goal: str
    recent_decisions: List[Dict[str, Any]] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class BusinessState(BaseModel):
    id: UUID
    simulation_id: UUID
    name: str
    industry: str
    employee_count: int
    revenue: float
    expenses: float
    profit: float
    health: float = Field(ge=0.0, le=1.0)
    capital: float = Field(default=50000.0)
    personality: str = Field(default="NEUTRAL")
    rival_business_id: Optional[UUID] = None
    last_game_move: Optional[str] = "COOPERATE"
    current_goal: str
    recent_decisions: List[Dict[str, Any]] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class GovernmentStateSchema(BaseModel):
    id: Optional[UUID] = None
    simulation_id: UUID
    tax_rate: float = Field(default=0.20, ge=0.0, le=0.60)
    infrastructure_spending: float = Field(default=50000.0, ge=0.0)
    healthcare_spending: float = Field(default=30000.0, ge=0.0)
    treasury: float = 1000000.0
    public_satisfaction: float = Field(default=0.70, ge=0.0, le=1.0)
    inflation_rate: float = Field(default=0.02, ge=0.0)

    model_config = ConfigDict(from_attributes=True)


class PolicyState(BaseModel):
    tax_rate: float = Field(default=0.20, ge=0.0, le=0.60)
    infrastructure_spending: float = Field(default=50000.0, ge=0.0)


class PolicyUpdate(BaseModel):
    tax_rate: Optional[float] = Field(None, ge=0.0, le=0.60)
    infrastructure_spending: Optional[float] = Field(None, ge=0.0)


class EventState(BaseModel):
    id: Optional[UUID] = None
    simulation_id: UUID
    tick: int
    event_type: str
    severity: float = Field(ge=0.0, le=1.0)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    duration_remaining: int = 3

    model_config = ConfigDict(from_attributes=True)


class EventCreate(BaseModel):
    type: str
    severity: float = Field(ge=0.0, le=1.0)
    metadata: Optional[Dict[str, Any]] = None


class EconomicMetrics(BaseModel):
    employment_rate: float = Field(ge=0.0, le=1.0)
    economic_output: float = Field(ge=0.0)
    inequality: float = Field(ge=0.0, le=1.0)
    public_satisfaction: float = Field(ge=0.0, le=1.0)
    business_health: float = Field(ge=0.0, le=1.0)


class TickSummary(BaseModel):
    employed_citizens: int
    total_citizens: int
    business_count: int


class TickResult(BaseModel):
    simulation_id: UUID
    tick: int
    metrics: EconomicMetrics
    policy: PolicyState
    active_events: List[EventState]
    summary: TickSummary
