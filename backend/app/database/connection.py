"""Engine criada sob demanda e uma sessão por requisição."""

from collections.abc import Generator
from functools import lru_cache

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session

from app.core.config import get_settings


class DatabaseNotConfiguredError(RuntimeError):
    pass


@lru_cache
def get_engine() -> Engine:
    database_url = get_settings().database_url
    if database_url is None or not database_url.get_secret_value().strip():
        raise DatabaseNotConfiguredError("Defina DATABASE_URL em backend/.env.")
    return create_engine(database_url.get_secret_value(), pool_pre_ping=True)


def get_db() -> Generator[Session, None, None]:
    with Session(get_engine()) as session:
        yield session
