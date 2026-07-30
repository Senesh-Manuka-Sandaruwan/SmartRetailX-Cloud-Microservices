import os

from dotenv import load_dotenv
from fastapi import Header, HTTPException, status

load_dotenv()

INTERNAL_SERVICE_KEY = os.getenv("INTERNAL_SERVICE_KEY")


def require_service_key(
    x_service_key: str = Header(..., alias="X-Service-Key")
):
    if not INTERNAL_SERVICE_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal service key is not configured."
        )

    if x_service_key != INTERNAL_SERVICE_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid internal service key."
        )

    return True