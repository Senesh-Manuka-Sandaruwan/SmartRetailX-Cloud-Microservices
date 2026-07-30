import os
from typing import Optional

import requests
from fastapi import HTTPException
from requests import Response
from sqlalchemy import or_
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.order import Order
from app.schemas.order_schema import OrderCreate, OrderStatusUpdate


# =========================================================
# PRODUCT SERVICE CONFIGURATION
# =========================================================

PRODUCT_SERVICE_URL = os.getenv(
    "PRODUCT_SERVICE_URL",
    "http://127.0.0.1:8001"
).rstrip("/")

# The Product Service protects PUT /products/{id} with require_admin.
# Therefore, an admin/service JWT can be placed in the Order Service
# .env file as PRODUCT_SERVICE_TOKEN.
PRODUCT_SERVICE_TOKEN = os.getenv(
    "PRODUCT_SERVICE_TOKEN",
    ""
)

REQUEST_TIMEOUT = 10


# =========================================================
# ALLOWED ORDER STATUSES
# =========================================================

ALLOWED_ORDER_STATUSES = [
    "Pending",
    "Confirmed",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled"
]


# =========================================================
# PRODUCT SERVICE REQUEST HELPERS
# =========================================================

def _get_product_service_headers() -> dict:
    """
    Create headers for protected Product Service requests.

    PRODUCT_SERVICE_TOKEN should contain a valid admin/service JWT.
    """

    headers = {
        "Content-Type": "application/json"
    }

    if PRODUCT_SERVICE_TOKEN:
        token = PRODUCT_SERVICE_TOKEN.strip()

        if token.lower().startswith("bearer "):
            headers["Authorization"] = token
        else:
            headers["Authorization"] = f"Bearer {token}"

    return headers


def _extract_error_message(response: Response) -> str:
    """
    Extract a useful error message from a Product Service response.
    """

    try:
        response_data = response.json()

        if isinstance(response_data, dict):
            detail = response_data.get("detail")

            if detail:
                return str(detail)

            message = response_data.get("message")

            if message:
                return str(message)

        return str(response_data)

    except ValueError:
        return response.text or "Unknown Product Service error"


def _get_product_from_service(product_id: int) -> dict:
    """
    Retrieve one product from the Product Service.
    """

    try:
        response = requests.get(
            f"{PRODUCT_SERVICE_URL}/products/{product_id}",
            timeout=REQUEST_TIMEOUT
        )

    except requests.ConnectionError:
        raise HTTPException(
            status_code=503,
            detail=(
                "Product Service is unavailable. "
                "Make sure it is running on "
                f"{PRODUCT_SERVICE_URL}"
            )
        )

    except requests.Timeout:
        raise HTTPException(
            status_code=504,
            detail="Product Service request timed out"
        )

    except requests.RequestException as error:
        raise HTTPException(
            status_code=503,
            detail=f"Could not communicate with Product Service: {error}"
        )

    if response.status_code == 404:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    if response.status_code != 200:
        error_message = _extract_error_message(response)

        raise HTTPException(
            status_code=502,
            detail=f"Product Service error: {error_message}"
        )

    try:
        product_data = response.json()

    except ValueError:
        raise HTTPException(
            status_code=502,
            detail="Product Service returned an invalid response"
        )

    required_fields = [
        "id",
        "name",
        "price",
        "stock"
    ]

    missing_fields = [
        field
        for field in required_fields
        if field not in product_data
    ]

    if missing_fields:
        raise HTTPException(
            status_code=502,
            detail=(
                "Product Service response is missing required fields: "
                f"{', '.join(missing_fields)}"
            )
        )

    return product_data


def _update_product_stock(
    product_id: int,
    new_stock: int
) -> dict:
    """
    Update product stock through the Product Service.

    Your Product Service protects PUT /products/{product_id}
    with require_admin. PRODUCT_SERVICE_TOKEN must therefore contain
    a valid admin or service JWT.
    """

    if new_stock < 0:
        raise HTTPException(
            status_code=400,
            detail="Product stock cannot be negative"
        )

    if not PRODUCT_SERVICE_TOKEN:
        raise HTTPException(
            status_code=500,
            detail=(
                "PRODUCT_SERVICE_TOKEN is not configured. "
                "Add a valid admin/service JWT to the Order Service .env file "
                "so it can update product stock."
            )
        )

    try:
        response = requests.put(
            f"{PRODUCT_SERVICE_URL}/products/{product_id}",
            json={
                "stock": new_stock
            },
            headers=_get_product_service_headers(),
            timeout=REQUEST_TIMEOUT
        )

    except requests.ConnectionError:
        raise HTTPException(
            status_code=503,
            detail="Product Service is unavailable"
        )

    except requests.Timeout:
        raise HTTPException(
            status_code=504,
            detail="Product Service stock update timed out"
        )

    except requests.RequestException as error:
        raise HTTPException(
            status_code=503,
            detail=f"Could not update product stock: {error}"
        )

    if response.status_code in (401, 403):
        raise HTTPException(
            status_code=502,
            detail=(
                "Product Service rejected the stock update. "
                "Check that PRODUCT_SERVICE_TOKEN contains a valid "
                "admin/service JWT."
            )
        )

    if response.status_code == 404:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    if response.status_code not in (200, 201):
        error_message = _extract_error_message(response)

        raise HTTPException(
            status_code=502,
            detail=f"Could not update product stock: {error_message}"
        )

    try:
        return response.json()

    except ValueError:
        return {
            "message": "Product stock updated successfully"
        }


# =========================================================
# CREATE ORDER
# =========================================================

def create_order(
    db: Session,
    order_data: OrderCreate,
    customer_email: str
):
    """
    Create an order.

    Steps:
    1. Validate the customer email.
    2. Retrieve the product from Product Service.
    3. Check available stock.
    4. Calculate the total price.
    5. Reduce product stock.
    6. Save the order in the Order Service database.
    """

    if not customer_email:
        raise HTTPException(
            status_code=401,
            detail="Authenticated customer email is required"
        )

    product = _get_product_from_service(
        order_data.product_id
    )

    try:
        product_stock = int(product["stock"])
        product_price = float(product["price"])

    except (TypeError, ValueError):
        raise HTTPException(
            status_code=502,
            detail="Product Service returned invalid price or stock data"
        )

    if product_stock < order_data.quantity:
        raise HTTPException(
            status_code=400,
            detail=(
                "Insufficient product stock. "
                f"Available stock: {product_stock}"
            )
        )

    new_stock = product_stock - order_data.quantity

    unit_price = round(product_price, 2)

    total_price = round(
        unit_price * order_data.quantity,
        2
    )

    new_order = Order(
        customer_email=customer_email,
        product_id=product["id"],
        product_name=product["name"],
        quantity=order_data.quantity,
        unit_price=unit_price,
        total_price=total_price,
        status="Pending"
    )

    stock_reduced = False

    try:
        # Reserve/reduce stock in the Product Service.
        _update_product_stock(
            product_id=product["id"],
            new_stock=new_stock
        )

        stock_reduced = True

        db.add(new_order)
        db.commit()
        db.refresh(new_order)

        return {
            "message": "Order created successfully",
            "order": new_order
        }

    except HTTPException:
        db.rollback()
        raise

    except SQLAlchemyError:
        db.rollback()

        # Compensating action: restore stock when database saving fails.
        if stock_reduced:
            try:
                _update_product_stock(
                    product_id=product["id"],
                    new_stock=product_stock
                )
            except HTTPException:
                pass

        raise HTTPException(
            status_code=500,
            detail="Database error occurred while creating the order"
        )

    except Exception as error:
        db.rollback()

        if stock_reduced:
            try:
                _update_product_stock(
                    product_id=product["id"],
                    new_stock=product_stock
                )
            except HTTPException:
                pass

        raise HTTPException(
            status_code=500,
            detail=f"Could not create order: {error}"
        )


# =========================================================
# GET ALL ORDERS
# =========================================================

def get_all_orders(db: Session):
    """
    Return all orders, with the newest orders first.
    """

    return (
        db.query(Order)
        .order_by(Order.created_at.desc())
        .all()
    )


# =========================================================
# GET CURRENT CUSTOMER'S ORDERS
# =========================================================

def get_customer_orders(
    db: Session,
    customer_email: str
):
    """
    Return orders belonging to the authenticated customer.
    """

    if not customer_email:
        raise HTTPException(
            status_code=401,
            detail="Authenticated customer email is required"
        )

    return (
        db.query(Order)
        .filter(Order.customer_email == customer_email)
        .order_by(Order.created_at.desc())
        .all()
    )


# =========================================================
# GET ORDER BY ID
# =========================================================

def get_order_by_id(
    db: Session,
    order_id: int
):
    """
    Return one order using its ID.
    """

    order = (
        db.query(Order)
        .filter(Order.id == order_id)
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    return order


# =========================================================
# GET CUSTOMER ORDER BY ID
# =========================================================

def get_customer_order_by_id(
    db: Session,
    order_id: int,
    customer_email: str
):
    """
    Return one order only when it belongs to the authenticated customer.
    """

    if not customer_email:
        raise HTTPException(
            status_code=401,
            detail="Authenticated customer email is required"
        )

    order = (
        db.query(Order)
        .filter(
            Order.id == order_id,
            Order.customer_email == customer_email
        )
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    return order


# =========================================================
# UPDATE ORDER STATUS
# =========================================================

def update_order_status(
    db: Session,
    order_id: int,
    status_data: OrderStatusUpdate
):
    """
    Update the status of an order.

    This function should normally be restricted to administrators.
    """

    order = get_order_by_id(
        db,
        order_id
    )

    new_status = status_data.status

    if new_status not in ALLOWED_ORDER_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid order status. Allowed statuses are: "
                f"{', '.join(ALLOWED_ORDER_STATUSES)}"
            )
        )

    if order.status == "Cancelled":
        raise HTTPException(
            status_code=400,
            detail="A cancelled order cannot be updated"
        )

    if order.status == "Delivered":
        raise HTTPException(
            status_code=400,
            detail="A delivered order cannot be updated"
        )

    if new_status == "Cancelled":
        return _cancel_order_and_restore_stock(
            db=db,
            order=order
        )

    order.status = new_status

    try:
        db.commit()
        db.refresh(order)

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Database error occurred while updating order status"
        )

    return {
        "message": "Order status updated successfully",
        "order": order
    }


# =========================================================
# INTERNAL CANCELLATION FUNCTION
# =========================================================

def _cancel_order_and_restore_stock(
    db: Session,
    order: Order
):
    """
    Cancel an order and return its quantity to Product Service stock.
    """

    if order.status == "Cancelled":
        raise HTTPException(
            status_code=400,
            detail="Order is already cancelled"
        )

    if order.status in ("Shipped", "Delivered"):
        raise HTTPException(
            status_code=400,
            detail=(
                f"An order with status '{order.status}' "
                "cannot be cancelled"
            )
        )

    product = _get_product_from_service(
        order.product_id
    )

    try:
        current_stock = int(product["stock"])

    except (TypeError, ValueError):
        raise HTTPException(
            status_code=502,
            detail="Product Service returned invalid stock data"
        )

    restored_stock = current_stock + order.quantity

    _update_product_stock(
        product_id=order.product_id,
        new_stock=restored_stock
    )

    previous_status = order.status
    order.status = "Cancelled"

    try:
        db.commit()
        db.refresh(order)

    except SQLAlchemyError:
        db.rollback()

        # Compensating action: remove the stock that was restored.
        try:
            _update_product_stock(
                product_id=order.product_id,
                new_stock=current_stock
            )
        except HTTPException:
            pass

        order.status = previous_status

        raise HTTPException(
            status_code=500,
            detail="Database error occurred while cancelling the order"
        )

    return {
        "message": "Order cancelled successfully",
        "order": order
    }


# =========================================================
# CANCEL CUSTOMER ORDER
# =========================================================

def cancel_order(
    db: Session,
    order_id: int,
    customer_email: Optional[str] = None,
    is_admin: bool = False
):
    """
    Cancel an order.

    Customers may cancel only their own orders.
    Administrators may cancel any eligible order.
    """

    order = get_order_by_id(
        db,
        order_id
    )

    if not is_admin:
        if not customer_email:
            raise HTTPException(
                status_code=401,
                detail="Authenticated customer email is required"
            )

        if order.customer_email != customer_email:
            raise HTTPException(
                status_code=403,
                detail="You are not allowed to cancel this order"
            )

    return _cancel_order_and_restore_stock(
        db=db,
        order=order
    )


# =========================================================
# SEARCH ORDERS
# =========================================================

def search_orders(
    db: Session,
    keyword: str
):
    """
    Search orders using customer email, product name or status.
    """

    cleaned_keyword = keyword.strip()

    if not cleaned_keyword:
        return []

    return (
        db.query(Order)
        .filter(
            or_(
                Order.customer_email.ilike(
                    f"%{cleaned_keyword}%"
                ),
                Order.product_name.ilike(
                    f"%{cleaned_keyword}%"
                ),
                Order.status.ilike(
                    f"%{cleaned_keyword}%"
                )
            )
        )
        .order_by(Order.created_at.desc())
        .all()
    )


# =========================================================
# FILTER ORDERS BY STATUS
# =========================================================

def filter_orders_by_status(
    db: Session,
    status: str
):
    """
    Filter orders using an order status.
    """

    normalized_status = status.strip().title()

    if normalized_status not in ALLOWED_ORDER_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid order status. Allowed statuses are: "
                f"{', '.join(ALLOWED_ORDER_STATUSES)}"
            )
        )

    return (
        db.query(Order)
        .filter(Order.status == normalized_status)
        .order_by(Order.created_at.desc())
        .all()
    )


# =========================================================
# FILTER ORDERS BY CUSTOMER
# =========================================================

def filter_orders_by_customer(
    db: Session,
    customer_email: str
):
    """
    Filter orders using a customer's email address.
    """

    cleaned_email = customer_email.strip()

    if not cleaned_email:
        raise HTTPException(
            status_code=400,
            detail="Customer email is required"
        )

    return (
        db.query(Order)
        .filter(
            Order.customer_email.ilike(
                f"%{cleaned_email}%"
            )
        )
        .order_by(Order.created_at.desc())
        .all()
    )


# =========================================================
# PAGINATE ORDERS
# =========================================================

def paginate_orders(
    db: Session,
    page: int,
    limit: int
):
    """
    Return paginated order records.
    """

    if page < 1:
        page = 1

    if limit < 1:
        limit = 10

    if limit > 100:
        limit = 100

    offset = (page - 1) * limit

    total = db.query(Order).count()

    orders = (
        db.query(Order)
        .order_by(Order.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    total_pages = (
        (total + limit - 1) // limit
        if total > 0
        else 0
    )

    return {
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": total_pages,
        "orders": orders
    }


# =========================================================
# PAGINATE CURRENT CUSTOMER'S ORDERS
# =========================================================

def paginate_customer_orders(
    db: Session,
    customer_email: str,
    page: int,
    limit: int
):
    """
    Return paginated orders belonging to one customer.
    """

    if not customer_email:
        raise HTTPException(
            status_code=401,
            detail="Authenticated customer email is required"
        )

    if page < 1:
        page = 1

    if limit < 1:
        limit = 10

    if limit > 100:
        limit = 100

    offset = (page - 1) * limit

    query = (
        db.query(Order)
        .filter(Order.customer_email == customer_email)
    )

    total = query.count()

    orders = (
        query
        .order_by(Order.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    total_pages = (
        (total + limit - 1) // limit
        if total > 0
        else 0
    )

    return {
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": total_pages,
        "orders": orders
    }