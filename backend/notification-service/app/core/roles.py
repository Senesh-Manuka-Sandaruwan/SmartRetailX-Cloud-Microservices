from fastapi import Depends, HTTPException, status

from app.core.security import get_current_user


def extract_user_role(current_user: dict) -> str:
    """
    Extract and normalize the user's role from the JWT payload.
    """

    if not isinstance(current_user, dict):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authenticated user information"
        )

    role = (
        current_user.get("role")
        or current_user.get("user_role")
    )

    if not role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User role was not found in the authentication token"
        )

    return str(role).strip().lower()


def require_admin(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Permit access only to users with the admin role.
    """

    role = extract_user_role(current_user)

    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access is required"
        )

    return current_user


def require_customer(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Permit access only to users with the customer role.
    """

    role = extract_user_role(current_user)

    if role != "customer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customer access is required"
        )

    return current_user