from typing import List

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.core.roles import require_admin
from app.database.database import get_db

from app.schemas.order_schema import (
    OrderCreate,
    OrderStatusUpdate,
    OrderResponse
)

from app.services.order_service import (
    create_order,
    get_all_orders,
    get_customer_orders,
    get_order_by_id,
    get_customer_order_by_id,
    update_order_status,
    cancel_order,
    search_orders,
    filter_orders_by_status,
    filter_orders_by_customer,
    paginate_orders,
    paginate_customer_orders
)


router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)


# =========================================================
# HELPER: GET EMAIL FROM JWT USER DATA
# =========================================================

def extract_user_email(current_user) -> str:
    """
    Extract the authenticated user's email.

    Supports current_user returned as either:
    - a dictionary
    - a SQLAlchemy user object
    """

    if isinstance(current_user, dict):

        email = (
            current_user.get("email")
            or current_user.get("sub")
            or current_user.get("username")
        )

    else:

        email = (
            getattr(current_user, "email", None)
            or getattr(current_user, "sub", None)
            or getattr(current_user, "username", None)
        )

    if not email:
        raise HTTPException(
            status_code=401,
            detail="Authenticated user email was not found in the JWT"
    )

    return email


# =========================================================
# CREATE ORDER
# =========================================================

@router.post(
    "/",
    status_code=201
)
def add_order(
    order: OrderCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Create a new order for the authenticated customer.
    """

    customer_email = extract_user_email(current_user)

    return create_order(
        db=db,
        order_data=order,
        customer_email=customer_email
    )


# =========================================================
# GET AUTHENTICATED CUSTOMER'S ORDERS
# =========================================================

@router.get(
    "/my-orders",
    response_model=List[OrderResponse]
)
def read_my_orders(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Return all orders belonging to the authenticated customer.
    """

    customer_email = extract_user_email(current_user)

    return get_customer_orders(
        db=db,
        customer_email=customer_email
    )


# =========================================================
# PAGINATE AUTHENTICATED CUSTOMER'S ORDERS
# =========================================================

@router.get("/my-orders/page")
def paginate_my_orders(
    page: int = Query(
        default=1,
        ge=1
    ),
    limit: int = Query(
        default=10,
        ge=1,
        le=100
    ),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Return paginated orders belonging to the authenticated customer.
    """

    customer_email = extract_user_email(current_user)

    return paginate_customer_orders(
        db=db,
        customer_email=customer_email,
        page=page,
        limit=limit
    )


# =========================================================
# GET AUTHENTICATED CUSTOMER'S ORDER BY ID
# =========================================================

@router.get(
    "/my-orders/{order_id}",
    response_model=OrderResponse
)
def read_my_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Return one order only when it belongs to the authenticated customer.
    """

    customer_email = extract_user_email(current_user)

    return get_customer_order_by_id(
        db=db,
        order_id=order_id,
        customer_email=customer_email
    )


# =========================================================
# CANCEL AUTHENTICATED CUSTOMER'S ORDER
# =========================================================

@router.put("/{order_id}/cancel")
def cancel_customer_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Allow a customer to cancel only their own eligible order.
    """

    customer_email = extract_user_email(current_user)

    return cancel_order(
        db=db,
        order_id=order_id,
        customer_email=customer_email,
        is_admin=False
    )


# =========================================================
# ADMIN: GET ALL ORDERS
# =========================================================

@router.get(
    "/admin/all",
    response_model=List[OrderResponse]
)
def read_all_orders(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    """
    Return all orders.

    Administrator access is required.
    """

    return get_all_orders(db)


# =========================================================
# ADMIN: SEARCH ORDERS
# =========================================================

@router.get(
    "/admin/search",
    response_model=List[OrderResponse]
)
def search_order_records(
    keyword: str = Query(
        ...,
        min_length=1
    ),
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    """
    Search orders using:

    - customer email
    - product name
    - order status
    """

    return search_orders(
        db=db,
        keyword=keyword
    )


# =========================================================
# ADMIN: FILTER ORDERS BY STATUS
# =========================================================

@router.get(
    "/admin/filter/status",
    response_model=List[OrderResponse]
)
def filter_order_records_by_status(
    status: str = Query(
        ...,
        min_length=1
    ),
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    """
    Filter orders using an order status.
    """

    return filter_orders_by_status(
    db=db,
    order_status=status
)


# =========================================================
# ADMIN: FILTER ORDERS BY CUSTOMER
# =========================================================

@router.get(
    "/admin/filter/customer",
    response_model=List[OrderResponse]
)
def filter_order_records_by_customer(
    customer_email: str = Query(
        ...,
        min_length=3
    ),
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    """
    Filter orders using a customer's email address.
    """

    return filter_orders_by_customer(
        db=db,
        customer_email=customer_email
    )


# =========================================================
# ADMIN: PAGINATE ALL ORDERS
# =========================================================

@router.get("/admin/page")
def paginate_all_orders(
    page: int = Query(
        default=1,
        ge=1
    ),
    limit: int = Query(
        default=10,
        ge=1,
        le=100
    ),
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    """
    Return paginated order records.

    Administrator access is required.
    """

    return paginate_orders(
        db=db,
        page=page,
        limit=limit
    )


# =========================================================
# ADMIN: GET ONE ORDER BY ID
# =========================================================

@router.get(
    "/admin/{order_id}",
    response_model=OrderResponse
)
def read_order_by_id(
    order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    """
    Return one order using its ID.

    Administrator access is required.
    """

    return get_order_by_id(
        db=db,
        order_id=order_id
    )


# =========================================================
# ADMIN: UPDATE ORDER STATUS
# =========================================================

@router.put("/admin/{order_id}/status")
def change_order_status(
    order_id: int,
    status_data: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    """
    Update an order's status.

    Administrator access is required.
    """

    return update_order_status(
        db=db,
        order_id=order_id,
        status_data=status_data
    )


# =========================================================
# ADMIN: CANCEL ANY ELIGIBLE ORDER
# =========================================================

@router.put("/admin/{order_id}/cancel")
def admin_cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    """
    Allow an administrator to cancel any eligible order.
    """

    return cancel_order(
        db=db,
        order_id=order_id,
        is_admin=True
    )