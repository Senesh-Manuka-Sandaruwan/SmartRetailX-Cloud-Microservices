from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime
)
from sqlalchemy.sql import func

from app.database.database import Base


class Order(Base):
    __tablename__ = "orders"

    # ==============================
    # Primary Key
    # ==============================
    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # ==============================
    # Customer Information
    # ==============================
    customer_email = Column(
        String(150),
        nullable=False,
        index=True
    )

    # ==============================
    # Product Information
    # ==============================
    product_id = Column(
        Integer,
        nullable=False,
        index=True
    )

    product_name = Column(
        String(150),
        nullable=False
    )

    quantity = Column(
        Integer,
        nullable=False
    )

    unit_price = Column(
        Float,
        nullable=False
    )

    total_price = Column(
        Float,
        nullable=False
    )

    # ==============================
    # Order Status
    # ==============================
    status = Column(
        String(30),
        nullable=False,
        default="Pending"
    )

    # ==============================
    # Timestamps
    # ==============================
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )