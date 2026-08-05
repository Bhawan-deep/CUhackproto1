from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class SimulationBase(BaseModel):
    name: str
    random_seed: int = 42


class SimulationCreate(SimulationBase):
    pass


class SimulationResponse(SimulationBase):
    id: UUID
    status: str
    current_tick: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
