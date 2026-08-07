from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class CausalNodeSchema(BaseModel):
    id: str
    type: str  # OBSERVATION, AGENT_DECISION, ACTION, DIRECT_EFFECT, SECONDARY_EFFECT, MACRO_OUTCOME
    label: str
    entity_id: Optional[str] = None
    metric: Optional[str] = None
    before_value: Optional[float] = None
    after_value: Optional[float] = None
    delta: Optional[float] = None
    description: str
    confidence: str = "deterministic"  # deterministic, model_assumption, derived


class CausalChainSchema(BaseModel):
    chain_id: str
    headline: str
    steps: List[CausalNodeSchema]
    primary_entity_ids: List[str] = Field(default_factory=list)


class CausalSummarySchema(BaseModel):
    headline: str
    major_changes: List[str] = Field(default_factory=list)
    affected_node_ids: List[str] = Field(default_factory=list)
    active_paths: List[List[str]] = Field(default_factory=list)


class EntityExplainResponse(BaseModel):
    simulation_id: str
    tick: int
    entity_id: str
    entity_name: str
    entity_type: str
    headline: str
    observed_deltas: Dict[str, Any] = Field(default_factory=dict)
    causal_chains: List[CausalChainSchema] = Field(default_factory=list)
    model_assumptions_disclaimer: str = "Simulated causal trace derived from authoritative simulation engine equations and agent decisions."


class TickExplainResponse(BaseModel):
    simulation_id: str
    tick: int
    headline: str
    major_changes: List[str] = Field(default_factory=list)
    agent_decisions: List[Dict[str, Any]] = Field(default_factory=list)
    causal_chains: List[CausalChainSchema] = Field(default_factory=list)
    affected_entities: List[str] = Field(default_factory=list)
    model_assumptions_disclaimer: str = "Simulated causal trace within current model parameters."


class RangeExplainResponse(BaseModel):
    simulation_id: str
    from_tick: int
    to_tick: int
    headline: str
    key_events: List[Dict[str, Any]] = Field(default_factory=list)
    dominant_causal_chains: List[CausalChainSchema] = Field(default_factory=list)
    most_affected_entities: List[Dict[str, Any]] = Field(default_factory=list)
    model_assumptions_disclaimer: str = "Simulated multi-tick causal trace across model state history."
