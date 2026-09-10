from app.core.config import Settings


def test_environment_overrides_dotenv(tmp_path, monkeypatch):
    dotenv = tmp_path / ".env"
    dotenv.write_text('APP_NAME="Nome do arquivo"\n', encoding="utf-8")
    monkeypatch.setenv("APP_NAME", "Nome do ambiente")
    monkeypatch.setenv("CORS_ORIGINS", '["http://localhost:5500"]')
    settings = Settings(_env_file=dotenv)
    assert settings.app_name == "Nome do ambiente"
    assert settings.cors_origins == ["http://localhost:5500"]
