from pydantic import BaseModel, EmailStr, field_validator
import re


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, password):

        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long")

        if not re.search(r"[A-Z]", password):
            raise ValueError("Password must contain at least one uppercase letter")

        if not re.search(r"[a-z]", password):
            raise ValueError("Password must contain at least one lowercase letter")

        if not re.search(r"\d", password):
            raise ValueError("Password must contain at least one number")

        return password