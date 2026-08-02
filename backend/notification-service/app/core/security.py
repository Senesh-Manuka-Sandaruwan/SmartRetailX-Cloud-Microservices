import os

from dotenv import load_dotenv
from fastapi import (
    Depends,
    Header,
    HTTPException,
    status
)
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt


load_dotenv()


SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "ReplaceThisWithALongRandomSecretKey"
)

ALGORITHM = os.getenv(
    "ALGORITHM",
    "HS256"
)

INTERNAL_SERVICE_KEY = os.getenv(
    "INTERNAL_SERVICE_KEY",
    ""
)


bearer_scheme = HTTPBearer(
    auto_error=False
)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        bearer_scheme
    )
):
    """
    Decode and validate a user JWT.
    """

    if (
        credentials is None
        or credentials.scheme.lower() != "bearer"
        or not credentials.credentials
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={
                "WWW-Authenticate": "Bearer"
            }
        )

    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={
                "WWW-Authenticate": "Bearer"
            }
        )

    email = (
        payload.get("sub")
        or payload.get("email")
        or payload.get("username")
    )

    role = payload.get("role")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token does not contain a user identity"
        )

    return {
        **payload,
        "sub": email,
        "role": role
    }


def verify_internal_service_key(
    x_service_key: str = Header(
        default="",
        alias="X-Service-Key"
    )
):
    """
    Validate trusted service-to-service requests.
    """

    if not INTERNAL_SERVICE_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="INTERNAL_SERVICE_KEY is not configured"
        )

    if not x_service_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-Service-Key header is required"
        )

    if x_service_key != INTERNAL_SERVICE_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid internal service key"
        )

    return True