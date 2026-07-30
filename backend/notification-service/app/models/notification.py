from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Integer,
    String,
    Text
)
from sqlalchemy.sql import func

from app.database.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    customer_email = Column(
        String(150),
        nullable=False,
        index=True
    )

    order_id = Column(
        Integer,
        nullable=True,
        index=True
    )

    notification_type = Column(
        String(50),
        nullable=False,
        index=True
    )

    title = Column(
        String(150),
        nullable=False
    )

    message = Column(
        Text,
        nullable=False
    )

    is_read = Column(
        Boolean,
        nullable=False,
        default=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )