from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func

from app.database.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(150), nullable=False)

    description = Column(String(500))

    category = Column(String(100), nullable=False)

    price = Column(Float, nullable=False)

    stock = Column(Integer, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())