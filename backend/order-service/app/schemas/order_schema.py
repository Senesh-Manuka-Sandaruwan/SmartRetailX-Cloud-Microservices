from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional
from datetime import datetime


# ==========================================
# BASE SCHEMA
# ==========================================
class OrderBase(BaseModel):
    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0)


# ==========================================
# CREATE ORDER
# ==========================================
class OrderCreate(OrderBase):
    pass


# ==========================================
# UPDATE ORDER STATUS
# ==========================================
class OrderStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, value):

        allowed_status = [
            "Pending",
            "Confirmed",
            "Processing",
            "Shipped",
            "Delivered",
            "Cancelled"
        ]

        if value not in allowed_status:
            raise ValueError(
                f"Status must be one of {allowed_status}"
            )

        return value


# ==========================================
# ORDER RESPONSE
# ==========================================
class OrderResponse(BaseModel):

    id: int

    customer_email: str

    product_id: int

    product_name: str

    quantity: int

    unit_price: float

    total_price: float

    status: str

    created_at: datetime

    updated_at: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True
    )