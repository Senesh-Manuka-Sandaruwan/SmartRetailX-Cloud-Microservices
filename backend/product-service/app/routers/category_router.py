from typing import List

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)
from sqlalchemy.orm import Session

from app.core.roles import require_admin
from app.database.database import get_db
from app.schemas.category_schema import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate
)
from app.services.category_service import (
    CategoryService
)


router = APIRouter(
    prefix="/categories",
    tags=["Categories"]
)


# ==========================================
# GET ALL CATEGORIES
# Public endpoint
# ==========================================
@router.get(
    "/",
    response_model=List[CategoryResponse]
)
def read_categories(
    db: Session = Depends(get_db)
):
    return CategoryService.get_all_categories(
        db
    )


# ==========================================
# GET CATEGORY BY ID
# Public endpoint
# ==========================================
@router.get(
    "/{category_id}",
    response_model=CategoryResponse
)
def read_category(
    category_id: int,
    db: Session = Depends(get_db)
):
    category = (
        CategoryService.get_category_by_id(
            db,
            category_id
        )
    )

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found."
        )

    return category


# ==========================================
# CREATE CATEGORY
# Admin only
# ==========================================
@router.post(
    "/",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED
)
def add_category(
    category: CategoryCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    try:
        return CategoryService.create_category(
            db,
            category
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error)
        ) from error


# ==========================================
# UPDATE CATEGORY
# Admin only
# ==========================================
@router.put(
    "/{category_id}",
    response_model=CategoryResponse
)
def edit_category(
    category_id: int,
    category: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    try:
        updated_category = (
            CategoryService.update_category(
                db,
                category_id,
                category
            )
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error)
        ) from error

    if not updated_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found."
        )

    return updated_category


# ==========================================
# DELETE CATEGORY
# Admin only
# ==========================================
@router.delete(
    "/{category_id}",
    status_code=status.HTTP_200_OK
)
def remove_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    deleted_category = (
        CategoryService.delete_category(
            db,
            category_id
        )
    )

    if not deleted_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found."
        )

    return {
        "message": (
            f'Category "{deleted_category.name}" '
            "was deleted successfully."
        )
    }