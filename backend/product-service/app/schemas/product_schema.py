from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    description: str
    category: str
    price: float = Field(..., gt=0)
    stock: int = Field(..., ge=0)


class ProductResponse(BaseModel):
    id: int
    name: str
    description: str
    category: str
    price: float
    stock: int

    class Config:
        from_attributes = True