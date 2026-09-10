"""Criação inicial de tabelas em desenvolvimento: python -m app.database.init_db."""

from app import models  # noqa: F401 — registra os modelos nos metadados
from app.database.base import Base
from app.database.connection import get_engine


def init_db() -> None:
    # Não altera tabelas existentes; mudanças futuras exigirão migrações.
    Base.metadata.create_all(bind=get_engine())


if __name__ == "__main__":
    init_db()
    print("Tabelas iniciais criadas.")
