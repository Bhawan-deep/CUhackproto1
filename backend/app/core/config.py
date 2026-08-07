from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Agent Economy Simulator"
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/economy_sim"
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    SIMULATION_TICK_INTERVAL: float = 1.0
    SIMULATION_ENGINE: str = "mock"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property

    def normalized_database_url(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+psycopg://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+psycopg://"):
            url = url.replace("postgresql://", "postgresql+psycopg://", 1)
        return url


settings = Settings()

