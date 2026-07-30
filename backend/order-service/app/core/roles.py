from fastapi import Depends, HTTPException, status

from app.core.security import get_current_user


# =========================================================
# EXTRACT ROLE
# =========================================================

def extract_user_role(current_user: dict) -> str:
    """
    Extract the role from the decoded JWT payload.
    """

    role = current_user.get("role")

    if not role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User role was not found in the authentication token"
        )

    return str(role).lower()


# =========================================================
# REQUIRE ADMIN
# =========================================================

def require_admin(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Allow access only to administrators.
    """

    role = extract_user_role(current_user)

    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return current_user


# =========================================================
# REQUIRE CUSTOMER
# =========================================================

def require_customer(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Allow access only to customers.
    """

    role = extract_user_role(current_user)

    if role != "customer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customer access required"
        )

    return current_user