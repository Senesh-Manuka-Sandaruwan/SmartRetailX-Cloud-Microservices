from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.core.security import get_current_user
from app.core.roles import require_admin

from app.database.database import get_db
from app.schemas.product_schema import (
    ProductCreate,
    ProductUpdate,
    ProductResponse
)

from app.services.product_service import (
    create_product,
    get_all_products,
    get_product_by_id,
    update_product,
    delete_product,
    search_products,
    filter_products,
    paginate_products
)

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)

# ==========================================
# CREATE PRODUCT
# ==========================================
@router.post("/", status_code=201)
def add_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    return create_product(db, product)



# ==========================================
# GET ALL PRODUCTS
# ==========================================
@router.get("/", response_model=List[ProductResponse])
def read_products(
    db: Session = Depends(get_db)
):
    return get_all_products(db)


# ==========================================
# GET PRODUCT BY ID
# ==========================================
@router.get("/{product_id}", response_model=ProductResponse)
def read_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    return get_product_by_id(db, product_id)


# ==========================================
# UPDATE PRODUCT
# ==========================================
@router.put("/{product_id}")
def edit_product(
    product_id: int,
    product: ProductUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    return update_product(db, product_id, product)


# ==========================================
# DELETE PRODUCT
# ==========================================
@router.delete("/{product_id}")
def remove_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    return delete_product(db, product_id)


# ==========================================
# SEARCH PRODUCTS
# ==========================================
@router.get("/search/")
def search(
    keyword: str,
    db: Session = Depends(get_db)
):
    return search_products(db, keyword)


# ==========================================
# FILTER PRODUCTS
# ==========================================
@router.get("/filter/")
def filter_by_category(
    category: str,
    db: Session = Depends(get_db)
):
    return filter_products(db, category)


# ==========================================
# PAGINATION
# ==========================================
@router.get("/page/")
def paginate(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    return paginate_products(db, page, limit)