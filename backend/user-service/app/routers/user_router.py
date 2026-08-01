from typing import List

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.roles import require_role
from app.database.database import get_db
from app.schemas.user_schema import (
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
    UserStatusUpdate
)
from app.services.user_service import (
    create_user,
    delete_user,
    get_all_users,
    login_user,
    update_user_status
)


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


def extract_user_email(
    current_user
) -> str:
    if isinstance(current_user, dict):
        email = (
            current_user.get("email")
            or current_user.get("sub")
            or current_user.get("username")
        )
    else:
        email = (
            getattr(
                current_user,
                "email",
                None
            )
            or getattr(
                current_user,
                "sub",
                None
            )
            or getattr(
                current_user,
                "username",
                None
            )
        )

    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=(
                "Authenticated user email "
                "was not found"
            )
        )

    return email


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED
)
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    return create_user(
        db,
        user
    )


@router.post(
    "/login",
    response_model=TokenResponse
)
def login(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    return login_user(
        db,
        user.email,
        user.password
    )


@router.get("/profile")
def get_profile(
    current_user=Depends(
        get_current_user
    )
):
    return {
        "message": "Access Granted",
        "user": current_user
    }


@router.get("/admin")
def admin_dashboard(
    current_user=Depends(
        require_role("admin")
    )
):
    return {
        "message": "Welcome Admin",
        "user": current_user
    }


@router.get(
    "/admin/users",
    response_model=List[UserResponse]
)
def read_all_users(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role("admin")
    )
):
    return get_all_users(db)


@router.put(
    "/admin/users/{user_id}/status",
    response_model=UserResponse
)
def change_user_status(
    user_id: int,
    status_data: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role("admin")
    )
):
    current_admin_email = (
        extract_user_email(
            current_user
        )
    )

    return update_user_status(
        db=db,
        user_id=user_id,
        status_data=status_data,
        current_admin_email=(
            current_admin_email
        )
    )


@router.delete(
    "/admin/users/{user_id}",
    status_code=status.HTTP_200_OK
)
def remove_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role("admin")
    )
):
    current_admin_email = (
        extract_user_email(
            current_user
        )
    )

    return delete_user(
        db=db,
        user_id=user_id,
        current_admin_email=(
            current_admin_email
        )
    )