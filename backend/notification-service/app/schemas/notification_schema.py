from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


# ==========================================================
# ALLOWED NOTIFICATION TYPES
# ==========================================================

ALLOWED_NOTIFICATION_TYPES = [
    "ORDER_CREATED",
    "ORDER_CONFIRMED",
    "ORDER_PROCESSING",
    "ORDER_SHIPPED",
    "ORDER_DELIVERED",
    "ORDER_CANCELLED"
]


# ==========================================================
# BASE SCHEMA
# ==========================================================

class NotificationBase(BaseModel):

    customer_email: str = Field(
        ...,
        max_length=150
    )

    order_id: Optional[int] = Field(
        default=None,
        gt=0
    )

    notification_type: str

    title: str = Field(
        ...,
        max_length=150
    )

    message: str

    @field_validator("notification_type")
    @classmethod
    def validate_notification_type(cls, value):

        if value not in ALLOWED_NOTIFICATION_TYPES:

            raise ValueError(
                f"Notification type must be one of {ALLOWED_NOTIFICATION_TYPES}"
            )

        return value


# ==========================================================
# CREATE NOTIFICATION
# ==========================================================

class NotificationCreate(NotificationBase):
    pass


# ==========================================================
# UPDATE READ STATUS
# ==========================================================

class NotificationReadUpdate(BaseModel):

    is_read: bool


# ==========================================================
# RESPONSE MODEL
# ==========================================================

class NotificationResponse(BaseModel):

    id: int

    customer_email: str

    order_id: Optional[int]

    notification_type: str

    title: str

    message: str

    is_read: bool

    created_at: datetime

    updated_at: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True
    )