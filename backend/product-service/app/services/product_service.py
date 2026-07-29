from sqlalchemy.orm import Session
from app.models.product import Product
from app.schemas.product_schema import ProductCreate


def create_product(db: Session, product: ProductCreate):

    db_product = Product(
        name=product.name,
        description=product.description,
        category=product.category,
        price=product.price,
        stock=product.stock
    )

    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    return {
        "message": "Product created successfully",
        "product": db_product
    }