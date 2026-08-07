from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from uuid import UUID


class GovernmentObservation(BaseModel):
    treasury: float
    tax_rate: float
    infrastructure_spending: float
    healthcare_spending: float
    public_satisfaction: float
    unemployment_rate: float
    inflation_rate: float
    recent_events: List[str] = Field(default_factory=list)


class BankObservation(BaseModel):
    interest_rate: float
    reserves: float
    default_rate: float
    active_loans: int
    pending_loan_requests: int


class BusinessObservation(BaseModel):
    id: str
    name: str
    industry: str
    capital: float
    revenue: float
    profit: float
    employee_count: int
    health: float
    personality: str
    rival_id: Optional[str] = None
    last_rival_move: Optional[str] = None


class CitizensSummaryObservation(BaseModel):
    population: int
    employed_count: int
    unemployment_rate: float
    average_income: float
    average_wealth: float
    average_satisfaction: float
    average_trust: float
    tax_compliance_rate: float
    enforcement_strength: float
    average_tax_burden: float


class MacroMetricsObservation(BaseModel):
    economic_output: float
    inequality_gini: float
    business_health: float


class AgentObservation(BaseModel):
    simulation_id: str
    tick: int
    government: GovernmentObservation
    bank: BankObservation
    businesses: List[BusinessObservation]
    citizens_summary: CitizensSummaryObservation
    macro_metrics: MacroMetricsObservation


# --- Agent Decision Contracts ---

class SpendingAllocation(BaseModel):
    healthcare: float = 0.35
    infrastructure: float = 0.40
    reserve: float = 0.25


class FinanceDecision(BaseModel):
    tax_rate_delta: float = 0.0
    spending_allocation: SpendingAllocation = Field(default_factory=SpendingAllocation)
    reasoning_summary: str = "Standard fiscal policy alignment."


class HealthDecision(BaseModel):
    spending_delta: float = 0.0
    reasoning_summary: str = "Healthcare allocation maintained."


class InfrastructureDecision(BaseModel):
    spending_delta: float = 0.0
    reasoning_summary: str = "Infrastructure maintenance stable."


class BankDecision(BaseModel):
    interest_rate_delta: float = 0.0
    loan_decisions: Dict[str, bool] = Field(default_factory=dict)
    reasoning_summary: str = "Central bank rate unchanged."


class BusinessMove(BaseModel):
    move: str = "COOPERATE"  # "COOPERATE" | "DEFECT"
    rival_id: Optional[str] = None
    reasoning_summary: str = "Cooperative strategic posture."


class CitizenBehavior(BaseModel):
    compliance_rate: float = 0.85


class StrategicAnchor(BaseModel):
    finance_stance: Optional[str] = "BALANCED"
    health_stance: Optional[str] = "STABLE"
    infrastructure_stance: Optional[str] = "GROWTH"
    bank_stance: Optional[str] = "NEUTRAL"
    valid_until_tick: Optional[int] = None


class StrategicState(BaseModel):
    policy_anchor_active: bool = False
    policy_anchor: Optional[StrategicAnchor] = None


class AgentDecisionBundle(BaseModel):
    finance: FinanceDecision = Field(default_factory=FinanceDecision)
    health: HealthDecision = Field(default_factory=HealthDecision)
    infrastructure: InfrastructureDecision = Field(default_factory=InfrastructureDecision)
    bank: BankDecision = Field(default_factory=BankDecision)
    business_decisions: Dict[str, BusinessMove] = Field(default_factory=dict)
    citizen_behavior: CitizenBehavior = Field(default_factory=CitizenBehavior)
    strategic_state: StrategicState = Field(default_factory=StrategicState)
    provider: str = "mock"
