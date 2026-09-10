import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.core.config import get_settings
from app.database.base import Base
from app.database.connection import get_db, get_engine
from app.main import create_app


@pytest.fixture(autouse=True)
def isolated_settings(monkeypatch):
    # Impede que .env ou variáveis locais direcionem testes ao banco real.
    monkeypatch.setenv("DATABASE_URL", "")
    monkeypatch.setenv("APP_NAME", "InkFlow API")
    monkeypatch.setenv("CORS_ORIGINS", "[]")
    get_settings.cache_clear()
    get_engine.cache_clear()
    yield
    get_settings.cache_clear()
    get_engine.cache_clear()


@pytest.fixture
def db_engine():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture
def client(db_engine):
    application = create_app()

    def override_get_db():
        with Session(db_engine) as session:
            yield session

    application.dependency_overrides[get_db] = override_get_db
    with TestClient(application) as test_client:
        yield test_client
