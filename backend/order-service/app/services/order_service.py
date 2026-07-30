import os
from typing import Optional

import requests
from dotenv import load_dotenv
from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.order import Order
from app.schemas.order_schema import (
    OrderCreate,
    OrderStatusUpdate
)


load_dotenv()


# ==========================================================
# SERVICE CONFIGURATION
# ==========================================================

PRODUCT_SERVICE_URL = os.getenv(
    "PRODUCT_SERVICE_URL",
    "http://127.0.0.1:8001"
).rstrip("/")

INTERNAL_SERVICE_KEY = os.getenv(
    "INTERNAL_SERVICE_KEY",
    ""
)

NOTIFICATION_SERVICE_URL = os.getenv(
    "NOTIFICATION_SERVICE_URL",
    "http://127.0.0.1:8003"
).rstrip("/")

NOTIFICATION_SERVICE_TOKEN = os.getenv(
    "NOTIFICATION_SERVICE_TOKEN",
    ""
)


ALLOWED_ORDER_STATUSES = [
    "Pending",
    "Confirmed",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled"
]


# ==========================================================
# SERVICE AUTHORIZATION HEADERS
# ==========================================================

def build_authorization_headers(token: str) -> dict:
    """
    Create an Authorization header for service-to-service requests.
    """

    if not token:
        return {}

    cleaned_token = token.strip()

    if cleaned_token.lower().startswith("bearer "):
        return {
            "Authorization": cleaned_token
        }

    return {
        "Authorization": f"Bearer {cleaned_token}"
    }



def build_service_headers() -> dict:
    """
    Create headers for trusted internal microservice communication.
    """

    if not INTERNAL_SERVICE_KEY:
        raise HTTPException(
            status_code=500,
            detail="INTERNAL_SERVICE_KEY is not configured"
        )

    return {
        "X-Service-Key": INTERNAL_SERVICE_KEY
    }


# ==========================================================
# PRODUCT SERVICE HELPERS
# ==========================================================

def get_product_from_product_service(
    product_id: int
) -> dict:
    """
    Retrieve a product from the Product Service.
    """

    try:
        response = requests.get(
            f"{PRODUCT_SERVICE_URL}/products/{product_id}",
            timeout=10
        )

    except requests.RequestException as error:
        raise HTTPException(
            status_code=503,
            detail=(
                "Product Service is unavailable. "
                f"Reason: {str(error)}"
            )
        )

    if response.status_code == 404:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to retrieve product information from "
                "the Product Service"
            )
        )

    try:
        response_data = response.json()
    except ValueError:
        raise HTTPException(
            status_code=502,
            detail="Product Service returned an invalid response"
        )

    # Supports either:
    # {"id": 1, "name": "..."}
    # or {"product": {"id": 1, "name": "..."}}
    if isinstance(response_data, dict):
        product = response_data.get(
            "product",
            response_data
        )
    else:
        product = response_data

    if not isinstance(product, dict):
        raise HTTPException(
            status_code=502,
            detail="Invalid product information received"
        )

    return product


def extract_product_stock(product: dict) -> int:
    """
    Extract stock using commonly used product field names.
    """

    stock = product.get("stock_quantity")

    if stock is None:
        stock = product.get("stock")

    if stock is None:
        stock = product.get("quantity")

    if stock is None:
        raise HTTPException(
            status_code=502,
            detail="Product stock information is missing"
        )

    try:
        return int(stock)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=502,
            detail="Product stock information is invalid"
        )


def extract_product_price(product: dict) -> float:
    """
    Extract and validate the product price.
    """

    price = product.get("price")

    if price is None:
        raise HTTPException(
            status_code=502,
            detail="Product price information is missing"
        )

    try:
        return float(price)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=502,
            detail="Product price information is invalid"
        )


def build_product_update_payload(
    product: dict,
    new_stock: int
) -> dict:
    """
    Build the product update body while preserving its existing data.
    """

    payload = {}

    supported_fields = [
        "name",
        "description",
        "price",
        "category",
        "brand",
        "image_url",
        "is_active"
    ]

    for field in supported_fields:
        if field in product:
            payload[field] = product[field]

    if "stock_quantity" in product:
        payload["stock_quantity"] = new_stock
    elif "stock" in product:
        payload["stock"] = new_stock
    elif "quantity" in product:
        payload["quantity"] = new_stock
    else:
        payload["stock_quantity"] = new_stock

    return payload


def update_product_stock(
    product: dict,
    new_stock: int
):
    """
    Update product stock through the Product Service's
    internal service-key-protected endpoint.
    """

    if new_stock < 0:
        raise HTTPException(
            status_code=400,
            detail="Product stock cannot be negative"
        )

    product_id = product.get("id")

    if not product_id:
        raise HTTPException(
            status_code=502,
            detail="Product ID is missing"
        )

    try:
        response = requests.put(
            f"{PRODUCT_SERVICE_URL}/products/internal/{product_id}/stock",
            json={"stock": new_stock},
            headers=build_service_headers(),
            timeout=10
        )

    except requests.RequestException as error:
        raise HTTPException(
            status_code=503,
            detail=(
                "Product Service is unavailable while updating stock. "
                f"Reason: {str(error)}"
            )
        )

    if response.status_code in (401, 403):
        raise HTTPException(
            status_code=502,
            detail=(
                "Order Service is not authorized to update product stock. "
                "Check that INTERNAL_SERVICE_KEY is identical in both services."
            )
        )

    if response.status_code not in (200, 201):
        detail = "Unable to update product stock"

        try:
            error_body = response.json()

            if isinstance(error_body, dict):
                detail = error_body.get("detail", detail)
        except ValueError:
            pass

        raise HTTPException(
            status_code=502,
            detail=detail
        )


# ==========================================================
# NOTIFICATION SERVICE HELPER
# ==========================================================

def send_order_notification(
    customer_email: str,
    order_id: int,
    notification_type: str,
    title: str,
    message: str
) -> bool:
    """
    Send a notification to the Notification Service.

    Notification failure does not cancel a successfully completed
    order operation. The function returns False when delivery fails.
    """

    if not NOTIFICATION_SERVICE_TOKEN:
        print(
            "Notification skipped: "
            "NOTIFICATION_SERVICE_TOKEN is missing"
        )
        return False

    notification_payload = {
        "customer_email": customer_email,
        "order_id": order_id,
        "notification_type": notification_type,
        "title": title,
        "message": message
    }

    headers = build_authorization_headers(
        NOTIFICATION_SERVICE_TOKEN
    )

    try:
        response = requests.post(
            f"{NOTIFICATION_SERVICE_URL}/notifications/",
            json=notification_payload,
            headers=headers,
            timeout=10
        )

    except requests.RequestException as error:
        print(
            "Notification Service request failed: "
            f"{str(error)}"
        )
        return False

    if response.status_code not in (200, 201):
        print(
            "Notification creation failed. "
            f"Status: {response.status_code}, "
            f"Response: {response.text}"
        )
        return False

    return True


# ==========================================================
# CREATE ORDER
# ==========================================================

def create_order(
    db: Session,
    order_data: OrderCreate,
    customer_email: str
):
    """
    Create an order, calculate its total price,
    reduce product stock, and create a notification.
    """

    cleaned_email = customer_email.strip()

    if not cleaned_email:
        raise HTTPException(
            status_code=401,
            detail="Authenticated customer email is required"
        )

    product = get_product_from_product_service(
        order_data.product_id
    )

    available_stock = extract_product_stock(product)
    unit_price = extract_product_price(product)

    product_name = (
        product.get("name")
        or product.get("product_name")
        or f"Product {order_data.product_id}"
    )

    if order_data.quantity > available_stock:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Insufficient stock. "
                f"Available quantity: {available_stock}"
            )
        )

    new_stock = available_stock - order_data.quantity
    total_price = unit_price * order_data.quantity

    new_order = Order(
        customer_email=cleaned_email,
        product_id=order_data.product_id,
        product_name=product_name,
        quantity=order_data.quantity,
        unit_price=unit_price,
        total_price=total_price,
        status="Pending"
    )

    # Reduce product stock before storing the order.
    update_product_stock(
        product=product,
        new_stock=new_stock
    )

    try:
        db.add(new_order)
        db.commit()
        db.refresh(new_order)

    except SQLAlchemyError:
        db.rollback()

        # Restore stock if saving the order fails.
        try:
            update_product_stock(
                product=product,
                new_stock=available_stock
            )
        except HTTPException:
            print(
                "Critical warning: order creation failed and "
                "product stock could not be restored automatically"
            )

        raise HTTPException(
            status_code=500,
            detail="Database error occurred while creating the order"
        )

    notification_created = send_order_notification(
        customer_email=new_order.customer_email,
        order_id=new_order.id,
        notification_type="ORDER_CREATED",
        title="Order Created",
        message=(
            f"Your order number {new_order.id} for "
            f"{new_order.product_name} has been created successfully."
        )
    )

    return {
        "message": "Order created successfully",
        "notification_created": notification_created,
        "order": new_order
    }


# ==========================================================
# GET ALL ORDERS
# ==========================================================

def get_all_orders(db: Session):
    """
    Return all orders, newest first.
    """

    return (
        db.query(Order)
        .order_by(Order.created_at.desc())
        .all()
    )


# ==========================================================
# GET CUSTOMER ORDERS
# ==========================================================

def get_customer_orders(
    db: Session,
    customer_email: str
):
    """
    Return all orders belonging to one customer.
    """

    cleaned_email = customer_email.strip()

    if not cleaned_email:
        raise HTTPException(
            status_code=401,
            detail="Authenticated customer email is required"
        )

    return (
        db.query(Order)
        .filter(Order.customer_email == cleaned_email)
        .order_by(Order.created_at.desc())
        .all()
    )


# ==========================================================
# GET ORDER BY ID
# ==========================================================

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


# ==========================================================
# GET CUSTOMER ORDER BY ID
# ==========================================================

def get_customer_order_by_id(
    db: Session,
    order_id: int,
    customer_email: str
):
    """
    Return an order only when it belongs to the customer.
    """

    cleaned_email = customer_email.strip()

    if not cleaned_email:
        raise HTTPException(
            status_code=401,
            detail="Authenticated customer email is required"
        )

    order = (
        db.query(Order)
        .filter(
            Order.id == order_id,
            Order.customer_email == cleaned_email
        )
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    return order


# ==========================================================
# UPDATE ORDER STATUS
# ==========================================================

def update_order_status(
    db: Session,
    order_id: int,
    status_data: OrderStatusUpdate
):
    """
    Update an order's status and create a notification.
    """

    order = get_order_by_id(
        db=db,
        order_id=order_id
    )

    new_status = status_data.status.strip().title()

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
        return cancel_order(
            db=db,
            order_id=order_id,
            is_admin=True
        )

    if order.status == new_status:
        return {
            "message": f"Order is already {new_status}",
            "notification_created": False,
            "order": order
        }

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

    notification_type_map = {
        "Confirmed": "ORDER_CONFIRMED",
        "Processing": "ORDER_PROCESSING",
        "Shipped": "ORDER_SHIPPED",
        "Delivered": "ORDER_DELIVERED"
    }

    title_map = {
        "Confirmed": "Order Confirmed",
        "Processing": "Order Processing",
        "Shipped": "Order Shipped",
        "Delivered": "Order Delivered"
    }

    notification_created = False

    notification_type = notification_type_map.get(
        new_status
    )

    if notification_type:
        notification_created = send_order_notification(
            customer_email=order.customer_email,
            order_id=order.id,
            notification_type=notification_type,
            title=title_map[new_status],
            message=(
                f"Your order number {order.id} is now "
                f"{new_status.lower()}."
            )
        )

    return {
        "message": "Order status updated successfully",
        "notification_created": notification_created,
        "order": order
    }


# ==========================================================
# CANCEL ORDER
# ==========================================================

def cancel_order(
    db: Session,
    order_id: int,
    customer_email: Optional[str] = None,
    is_admin: bool = False
):
    """
    Cancel an order and restore the product stock.

    Customers may cancel only their own orders.
    Administrators may cancel any order.
    """

    order = get_order_by_id(
        db=db,
        order_id=order_id
    )

    if not is_admin:
        if not customer_email:
            raise HTTPException(
                status_code=401,
                detail="Authenticated customer email is required"
            )

        if order.customer_email != customer_email.strip():
            raise HTTPException(
                status_code=403,
                detail="You are not allowed to cancel this order"
            )

    if order.status == "Cancelled":
        raise HTTPException(
            status_code=400,
            detail="Order is already cancelled"
        )

    if order.status == "Delivered":
        raise HTTPException(
            status_code=400,
            detail="A delivered order cannot be cancelled"
        )

    product = get_product_from_product_service(
        order.product_id
    )

    current_stock = extract_product_stock(product)
    restored_stock = current_stock + order.quantity

    update_product_stock(
        product=product,
        new_stock=restored_stock
    )

    previous_status = order.status
    order.status = "Cancelled"

    try:
        db.commit()
        db.refresh(order)

    except SQLAlchemyError:
        db.rollback()

        # Compensation: revert the restored stock.
        try:
            update_product_stock(
                product=product,
                new_stock=current_stock
            )
        except HTTPException:
            print(
                "Critical warning: cancellation failed and "
                "product stock could not be reverted automatically"
            )

        order.status = previous_status

        raise HTTPException(
            status_code=500,
            detail="Database error occurred while cancelling the order"
        )

    notification_created = send_order_notification(
        customer_email=order.customer_email,
        order_id=order.id,
        notification_type="ORDER_CANCELLED",
        title="Order Cancelled",
        message=(
            f"Your order number {order.id} has been cancelled. "
            f"The quantity of {order.product_name} has been "
            "returned to stock."
        )
    )

    return {
        "message": "Order cancelled successfully",
        "notification_created": notification_created,
        "order": order
    }


# ==========================================================
# SEARCH ORDERS
# ==========================================================

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


# ==========================================================
# FILTER ORDERS BY STATUS
# ==========================================================

def filter_orders_by_status(
    db: Session,
    order_status: str
):
    """
    Filter orders using their status.
    """

    normalized_status = order_status.strip().title()

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


# ==========================================================
# FILTER ORDERS BY CUSTOMER
# ==========================================================

def filter_orders_by_customer(
    db: Session,
    customer_email: str
):
    """
    Filter all orders by customer email.
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


# ==========================================================
# PAGINATE ALL ORDERS
# ==========================================================

def paginate_orders(
    db: Session,
    page: int,
    limit: int
):
    """
    Return all orders using pagination.
    """

    page = max(page, 1)
    limit = min(max(limit, 1), 100)

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


# ==========================================================
# PAGINATE CUSTOMER ORDERS
# ==========================================================

def paginate_customer_orders(
    db: Session,
    customer_email: str,
    page: int,
    limit: int
):
    """
    Return one customer's orders using pagination.
    """

    cleaned_email = customer_email.strip()

    if not cleaned_email:
        raise HTTPException(
            status_code=401,
            detail="Authenticated customer email is required"
        )

    page = max(page, 1)
    limit = min(max(limit, 1), 100)

    offset = (page - 1) * limit

    query = (
        db.query(Order)
        .filter(Order.customer_email == cleaned_email)
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