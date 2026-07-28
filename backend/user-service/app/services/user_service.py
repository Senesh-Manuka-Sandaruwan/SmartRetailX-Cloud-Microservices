from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user_schema import UserCreate
from app.core.security import hash_password


def create_user(db: Session, user: UserCreate):

    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Create new user
    db_user = User(
        full_name=user.full_name,
        email=user.email,
        password=hash_password(user.password),
        role="customer"
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return {
        "message": "User registered successfully",
        "user": {
            "id": db_user.id,
            "full_name": db_user.full_name,
            "email": db_user.email,
            "role": db_user.role
        }
    }