from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.product import Product
from app.schemas.product_schema import ProductCreate, ProductUpdate


# ==============================
# CREATE PRODUCT
# ==============================
def create_product(db: Session, product: ProductCreate):

    # Check duplicate product name
    existing_product = (
        db.query(Product)
        .filter(Product.name == product.name)
        .first()
    )

    if existing_product:
        raise HTTPException(
            status_code=400,
            detail="Product name already exists"
        )

    new_product = Product(
        name=product.name,
        description=product.description,
        category=product.category,
        price=product.price,
        stock=product.stock
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return {
        "message": "Product created successfully",
        "product": new_product
    }


# ==============================
# GET ALL PRODUCTS
# ==============================
def get_all_products(db: Session):

    products = db.query(Product).all()

    return products


# ==============================
# GET PRODUCT BY ID
# ==============================
def get_product_by_id(db: Session, product_id: int):

    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return product


# ==============================
# UPDATE PRODUCT
# ==============================
def update_product(
    db: Session,
    product_id: int,
    product_data: ProductUpdate
):

    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    # Prevent duplicate names
    if product_data.name:

        duplicate = (
            db.query(Product)
            .filter(
                Product.name == product_data.name,
                Product.id != product_id
            )
            .first()
        )

        if duplicate:
            raise HTTPException(
                status_code=400,
                detail="Product name already exists"
            )

    update_data = product_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)

    return {
        "message": "Product updated successfully",
        "product": product
    }


# ==============================
# DELETE PRODUCT
# ==============================
def delete_product(
    db: Session,
    product_id: int
):

    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    db.delete(product)
    db.commit()

    return {
        "message": "Product deleted successfully"
    }


# ==============================
# SEARCH PRODUCTS
# ==============================
def search_products(
    db: Session,
    keyword: str
):

    products = (
        db.query(Product)
        .filter(Product.name.ilike(f"%{keyword}%"))
        .all()
    )

    return products


# ==============================
# FILTER BY CATEGORY
# ==============================
def filter_products(
    db: Session,
    category: str
):

    products = (
        db.query(Product)
        .filter(Product.category.ilike(category))
        .all()
    )

    return products


# ==============================
# PAGINATION
# ==============================
def paginate_products(
    db: Session,
    page: int,
    limit: int
):

    if page < 1:
        page = 1

    if limit < 1:
        limit = 10

    offset = (page - 1) * limit

    products = (
        db.query(Product)
        .offset(offset)
        .limit(limit)
        .all()
    )

    total = db.query(Product).count()

    return {
        "page": page,
        "limit": limit,
        "total": total,
        "products": products
    }