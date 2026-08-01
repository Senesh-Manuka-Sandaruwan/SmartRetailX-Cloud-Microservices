from datetime import datetime
from typing import Optional

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator
)


class CategoryBase(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=100
    )

    description: Optional[str] = Field(
        default=None,
        max_length=500
    )

    @field_validator("name")
    @classmethod
    def validate_name(
        cls,
        value: str
    ) -> str:
        cleaned_value = value.strip()

        if not cleaned_value:
            raise ValueError(
                "Category name cannot be empty"
            )

        return cleaned_value

    @field_validator("description")
    @classmethod
    def validate_description(
        cls,
        value: Optional[str]
    ) -> Optional[str]:
        if value is None:
            return None

        cleaned_value = value.strip()

        return cleaned_value or None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=100
    )

    description: Optional[str] = Field(
        default=None,
        max_length=500
    )

    @field_validator("name")
    @classmethod
    def validate_optional_name(
        cls,
        value: Optional[str]
    ) -> Optional[str]:
        if value is None:
            return None

        cleaned_value = value.strip()

        if not cleaned_value:
            raise ValueError(
                "Category name cannot be empty"
            )

        return cleaned_value

    @field_validator("description")
    @classmethod
    def validate_optional_description(
        cls,
        value: Optional[str]
    ) -> Optional[str]:
        if value is None:
            return None

        cleaned_value = value.strip()

        return cleaned_value or None

    model_config = ConfigDict(
        extra="forbid"
    )


class CategoryResponse(CategoryBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True
    )