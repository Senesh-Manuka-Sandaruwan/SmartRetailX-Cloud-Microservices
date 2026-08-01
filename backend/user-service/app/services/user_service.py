from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    hash_password,
    verify_password
)
from app.core.token import create_access_token
from app.models.user import User
from app.schemas.user_schema import (
    UserCreate,
    UserStatusUpdate
)


def serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "updated_at": user.updated_at
    }


def create_user(
    db: Session,
    user: UserCreate
):
    existing_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    db_user = User(
        full_name=user.full_name,
        email=user.email,
        password=hash_password(
            user.password
        ),
        role="customer",
        is_active=True
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return {
        "message": (
            "User registered successfully"
        ),
        "user": serialize_user(db_user)
    }


def login_user(
    db: Session,
    email: str,
    password: str
):
    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(
        password,
        user.password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "This account has been disabled. "
                "Contact an administrator."
            )
        )

    token = create_access_token(
        {
            "sub": user.email,
            "role": user.role
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }


def get_all_users(
    db: Session
):
    users = (
        db.query(User)
        .order_by(User.created_at.desc())
        .all()
    )

    return [
        serialize_user(user)
        for user in users
    ]


def get_user_by_id(
    db: Session,
    user_id: int
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user


def update_user_status(
    db: Session,
    user_id: int,
    status_data: UserStatusUpdate,
    current_admin_email: str
):
    user = get_user_by_id(
        db,
        user_id
    )

    if (
        user.email == current_admin_email
        and not status_data.is_active
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "You cannot disable your own "
                "administrator account"
            )
        )

    user.is_active = status_data.is_active

    db.commit()
    db.refresh(user)

    return serialize_user(user)


def delete_user(
    db: Session,
    user_id: int,
    current_admin_email: str
):
    user = get_user_by_id(
        db,
        user_id
    )

    if user.email == current_admin_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "You cannot delete your own "
                "administrator account"
            )
        )

    db.delete(user)
    db.commit()

    return {
        "message": (
            f'User "{user.email}" was '
            "deleted successfully"
        )
    }