from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import User
from app.schemas.user import UserCreate


class EmailAlreadyRegisteredError(ValueError):
    pass


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email.strip().lower()))


def create_user(db: Session, data: UserCreate) -> User:
    if get_user_by_email(db, str(data.email)) is not None:
        raise EmailAlreadyRegisteredError("E-mail já cadastrado.")

    user = User(
        name=data.name,
        email=str(data.email),
        password_hash=hash_password(data.password.get_secret_value()),
        role="client",
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        # A restrição UNIQUE também protege cadastros simultâneos.
        if get_user_by_email(db, str(data.email)) is not None:
            raise EmailAlreadyRegisteredError("E-mail já cadastrado.") from exc
        raise
    db.refresh(user)
    return user
