import pytest
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import verify_password
from app.models.user import User


def user_payload(**overrides):
    return {
        "name": "  Ana Silva  ",
        "email": "Ana@Example.com",
        "password": "senha-de-teste-123",
        **overrides,
    }


def test_register_client_persists_hash_and_returns_public_fields(client, db_engine):
    response = client.post("/api/v1/users", json=user_payload())
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Ana Silva"
    assert body["email"] == "ana@example.com"
    assert body["role"] == "client"
    assert body["created_at"].endswith("Z")
    assert set(body) == {"id", "name", "email", "role", "created_at"}

    with Session(db_engine) as db:
        user = db.get(User, body["id"])
        assert user.password_hash != user_payload()["password"]
        assert verify_password(user_payload()["password"], user.password_hash)


def test_duplicate_email_is_case_insensitive(client, db_engine):
    assert client.post("/api/v1/users", json=user_payload()).status_code == 201
    response = client.post("/api/v1/users", json=user_payload(email="ana@example.com"))
    assert response.status_code == 409
    with Session(db_engine) as db:
        assert db.scalar(select(func.count()).select_from(User)) == 1


@pytest.mark.parametrize(
    "overrides",
    [
        {"name": "   "},
        {"email": "invalido"},
        {"password": "curta"},
        {"password": "a" * 129},
        {"role": "admin"},
        {"password_hash": "hash-injetado"},
    ],
)
def test_invalid_registration_does_not_persist(client, db_engine, overrides):
    response = client.post("/api/v1/users", json=user_payload(**overrides))
    assert response.status_code == 422
    with Session(db_engine) as db:
        assert db.scalar(select(func.count()).select_from(User)) == 0
