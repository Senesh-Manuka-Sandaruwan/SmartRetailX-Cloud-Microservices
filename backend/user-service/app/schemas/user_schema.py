import re
from datetime import datetime
from typing import Optional

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator
)


class UserCreate(BaseModel):
    full_name: str = Field(
        ...,
        min_length=2,
        max_length=150
    )

    email: EmailStr

    password: str = Field(
        ...,
        min_length=8,
        max_length=128
    )

    @field_validator("full_name")
    @classmethod
    def validate_full_name(
        cls,
        value: str
    ) -> str:
        cleaned_value = value.strip()

        if not cleaned_value:
            raise ValueError(
                "Full name cannot be empty"
            )

        return cleaned_value

    @field_validator("password")
    @classmethod
    def validate_password(
        cls,
        password: str
    ) -> str:
        if len(password) < 8:
            raise ValueError(
                "Password must be at least 8 characters long"
            )

        if not re.search(
            r"[A-Z]",
            password
        ):
            raise ValueError(
                "Password must contain at least one uppercase letter"
            )

        if not re.search(
            r"[a-z]",
            password
        ):
            raise ValueError(
                "Password must contain at least one lowercase letter"
            )

        if not re.search(
            r"\d",
            password
        ):
            raise ValueError(
                "Password must contain at least one number"
            )

        return password


class UserLogin(BaseModel):
    email: EmailStr

    password: str = Field(
        ...,
        min_length=1,
        max_length=128
    )


class UserStatusUpdate(BaseModel):
    is_active: bool


class UserRoleUpdate(BaseModel):
    role: str = Field(
        ...,
        min_length=4,
        max_length=20
    )

    @field_validator("role")
    @classmethod
    def validate_role(
        cls,
        value: str
    ) -> str:
        cleaned_role = value.strip().lower()

        allowed_roles = {
            "customer",
            "admin"
        }

        if cleaned_role not in allowed_roles:
            raise ValueError(
                "Role must be either customer or admin"
            )

        return cleaned_role


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str

    is_active: bool = True

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True
    )


class TokenResponse(BaseModel):
    access_token: str
    token_type: str