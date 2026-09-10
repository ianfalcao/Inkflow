from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.user import UserCreate, UserRead
from app.services.user import EmailAlreadyRegisteredError, create_user

router = APIRouter(prefix="/users", tags=["Usuários"])


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_user(data: UserCreate, db: Annotated[Session, Depends(get_db)]):
    """Cadastra um cliente. Senha e hash nunca fazem parte da resposta."""
    try:
        return create_user(db, data)
    except EmailAlreadyRegisteredError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
