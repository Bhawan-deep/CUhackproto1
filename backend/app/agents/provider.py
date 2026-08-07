from typing import Protocol, runtime_checkable
from .contracts import AgentObservation, AgentDecisionBundle


@runtime_checkable
class AgentDecisionProvider(Protocol):
    """
    Abstract Protocol interface for decision providers.
    The simulation engine only calls this interface and does not care
    whether decisions come from deterministic heuristics, an LLM,
    or an external microservice.
    """

    async def decide(
        self,
        observation: AgentObservation
    ) -> AgentDecisionBundle:
        ...
