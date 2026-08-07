from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from app.core.config import settings


class Base(DeclarativeBase):
    pass


db_url = settings.normalized_database_url

engine = create_engine(
    db_url,
    pool_pre_ping=True,
    connect_args={"connect_timeout": 5} if db_url.startswith("postgresql") else {}
)



SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Initialize database tables defined in SQLAlchemy models."""
    Base.metadata.create_all(bind=engine)
