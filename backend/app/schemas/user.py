from datetime import UTC, datetime
from typing import Annotated, Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    SecretStr,
    StringConstraints,
    field_validator,
)


class UserCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: Annotated[
        str, StringConstraints(strip_whitespace=True, min_length=2, max_length=100)
    ]
    email: EmailStr = Field(max_length=254)
    password: SecretStr = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.lower()


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: EmailStr
    role: Literal["client", "artist", "admin"]
    created_at: datetime

    @field_validator("created_at")
    @classmethod
    def attach_utc(cls, value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value.astimezone(UTC)
