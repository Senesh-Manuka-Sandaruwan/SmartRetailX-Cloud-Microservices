from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.product_schema import ProductCreate
from app.services.product_service import create_product

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)


@router.post("/")
def add_product(
    product: ProductCreate,
    db: Session = Depends(get_db)
):
    return create_product(db, product)