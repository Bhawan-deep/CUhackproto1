from abc import ABC, abstractmethod
from typing import List, Tuple, Dict, Any, Optional
from uuid import UUID

from app.schemas.state import (
    CitizenState,
    BusinessState,
    GovernmentStateSchema,
    PolicyState,
    EventState,
    EconomicMetrics,
    TickResult,
)


class SimulationEngine(ABC):
    """
    Abstract Base Class for Simulation Engines.
    
    Backend services depend solely on this contract, allowing MockSimulationEngine
    or an external teammate ML engine adapter to be plugged in seamlessly.
    """

    @abstractmethod
    def initialize(
        self,
        simulation_id: UUID,
        seed: int,
        initial_policy: Optional[Dict[str, Any]] = None
    ) -> None:
        """Initialize simulation state with deterministic seed and baseline agents."""
        pass

    @abstractmethod
    def step(self) -> TickResult:
        """Execute exactly one simulation tick step and return TickResult."""

        pass

    @abstractmethod
    def get_state(self) -> Dict[str, Any]:
        """Return full simulation state dictionary."""
        pass

    @abstractmethod
    def get_metrics(self) -> EconomicMetrics:
        """Calculate and return current economic metrics."""
        pass

    @abstractmethod
    def get_agents(self) -> Tuple[List[CitizenState], List[BusinessState]]:
        """Return current citizens and businesses state lists."""
        pass

    @abstractmethod
    def get_government(self) -> GovernmentStateSchema:
        """Return current government state."""
        pass

    @abstractmethod
    def update_policy(self, policy_data: Dict[str, Any]) -> PolicyState:
        """Update active government policy parameters."""
        pass

    @abstractmethod
    def inject_event(
        self,
        event_type: str,
        severity: float,
        metadata: Optional[Dict[str, Any]] = None
    ) -> EventState:
        """Inject a dynamic economic event into active simulation state."""
        pass

    @abstractmethod
    def export_state(self) -> Dict[str, Any]:
        """Export full engine state including RNG state in a JSON-safe format."""
        pass

    @abstractmethod
    def import_state(self, state_dict: Dict[str, Any]) -> None:
        """Import engine state from a JSON-compatible state dictionary."""
        pass
