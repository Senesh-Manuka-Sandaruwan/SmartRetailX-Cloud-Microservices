from fastapi import Depends, HTTPException
from app.core.security import get_current_user


def require_admin(current_user=Depends(get_current_user)):

    if current_user["role"] != "admin":

        raise HTTPException(
            status_code=403,
            detail="Only Admin can perform this action."
        )

    return current_user