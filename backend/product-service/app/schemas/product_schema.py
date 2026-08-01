from datetime import datetime
from typing import Optional

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator
)


class ProductBase(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=150
    )

    description: str = Field(
        ...,
        min_length=5,
        max_length=500
    )

    category: str = Field(
        ...,
        min_length=2,
        max_length=100
    )

    image_url: Optional[str] = Field(
        default=None,
        max_length=1000
    )

    price: float = Field(
        ...,
        gt=0
    )

    stock: int = Field(
        ...,
        ge=0
    )

    @field_validator(
        "name",
        "category",
        "description"
    )
    @classmethod
    def validate_required_text(
        cls,
        value: str
    ) -> str:
        cleaned_value = value.strip()

        if not cleaned_value:
            raise ValueError(
                "This field cannot be empty"
            )

        return cleaned_value

    @field_validator("image_url")
    @classmethod
    def validate_image_url(
        cls,
        value: Optional[str]
    ) -> Optional[str]:
        if value is None:
            return None

        cleaned_value = value.strip()

        if not cleaned_value:
            return None

        if not cleaned_value.startswith(
            ("http://", "https://")
        ):
            raise ValueError(
                "Image URL must start with "
                "http:// or https://"
            )

        return cleaned_value


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=150
    )

    description: Optional[str] = Field(
        default=None,
        min_length=5,
        max_length=500
    )

    category: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=100
    )

    image_url: Optional[str] = Field(
        default=None,
        max_length=1000
    )

    price: Optional[float] = Field(
        default=None,
        gt=0
    )

    stock: Optional[int] = Field(
        default=None,
        ge=0
    )

    @field_validator(
        "name",
        "category",
        "description"
    )
    @classmethod
    def validate_optional_text(
        cls,
        value: Optional[str]
    ) -> Optional[str]:
        if value is None:
            return None

        cleaned_value = value.strip()

        if not cleaned_value:
            raise ValueError(
                "This field cannot be empty"
            )

        return cleaned_value

    @field_validator("image_url")
    @classmethod
    def validate_optional_image_url(
        cls,
        value: Optional[str]
    ) -> Optional[str]:
        if value is None:
            return None

        cleaned_value = value.strip()

        if not cleaned_value:
            return None

        if not cleaned_value.startswith(
            ("http://", "https://")
        ):
            raise ValueError(
                "Image URL must start with "
                "http:// or https://"
            )

        return cleaned_value

    model_config = ConfigDict(
        extra="forbid"
    )


class ProductResponse(ProductBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True
    )


class ProductStockUpdate(BaseModel):
    stock: int = Field(
        ...,
        ge=0
    )