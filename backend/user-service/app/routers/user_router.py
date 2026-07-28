from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.user_schema import UserCreate
from app.services.user_service import create_user

from app.schemas.user_schema import UserLogin
from app.services.user_service import login_user

from app.core.auth import get_current_user

from app.core.roles import require_role

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    return create_user(db, user)


@router.post("/login")
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
def get_profile(current_user=Depends(get_current_user)):

    return {
        "message": "Access Granted",
        "user": current_user
    }

@router.get("/admin")
def admin_dashboard(
    current_user=Depends(require_role("admin"))
):

    return {
        "message": "Welcome Admin",
        "user": current_user
    }