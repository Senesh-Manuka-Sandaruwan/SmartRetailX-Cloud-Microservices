import os

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt


load_dotenv()


SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")


if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY is missing from the Notification Service .env file"
    )


security_scheme = HTTPBearer()


def verify_token(token: str) -> dict:
    """
    Decode and validate a JWT created by the User Service.
    """

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        email = (
            payload.get("email")
            or payload.get("sub")
            or payload.get("username")
        )

        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: user identity is missing",
                headers={"WWW-Authenticate": "Bearer"}
            )

        return payload

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"}
        )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        security_scheme
    )
) -> dict:
    """
    Extract the bearer token and return its decoded JWT payload.
    """

    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer authentication is required",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return verify_token(credentials.credentials)