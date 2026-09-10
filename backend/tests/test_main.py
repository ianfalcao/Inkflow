from fastapi.testclient import TestClient

from app.main import create_app


def test_root_and_docs_work_without_database():
    with TestClient(create_app()) as client:
        response = client.get("/")
        assert response.status_code == 200
        assert response.json() == {"message": "InkFlow API funcionando"}
        assert client.get("/docs").status_code == 200
        assert "/api/v1/users" in client.get("/openapi.json").json()["paths"]


def test_registration_without_database_returns_503():
    with TestClient(create_app()) as client:
        response = client.post(
            "/api/v1/users",
            json={"name": "Ana Silva", "email": "ana@example.com", "password": "senha12345"},
        )
        assert response.status_code == 503
        assert response.json() == {"detail": "Banco de dados não configurado."}
