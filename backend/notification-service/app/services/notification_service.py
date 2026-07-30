from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.schemas.notification_schema import (
    NotificationCreate,
    NotificationReadUpdate,
    ALLOWED_NOTIFICATION_TYPES
)


# ==========================================================
# CREATE NOTIFICATION
# ==========================================================

def create_notification(
    db: Session,
    notification_data: NotificationCreate
):
    """
    Create and store a new notification.
    """

    new_notification = Notification(
        customer_email=notification_data.customer_email,
        order_id=notification_data.order_id,
        notification_type=notification_data.notification_type,
        title=notification_data.title,
        message=notification_data.message,
        is_read=False
    )

    try:
        db.add(new_notification)
        db.commit()
        db.refresh(new_notification)

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Database error occurred while creating notification"
        )

    return {
        "message": "Notification created successfully",
        "notification": new_notification
    }


# ==========================================================
# GET ALL NOTIFICATIONS
# ==========================================================

def get_all_notifications(db: Session):
    """
    Return all notifications, newest first.
    """

    return (
        db.query(Notification)
        .order_by(Notification.created_at.desc())
        .all()
    )


# ==========================================================
# GET NOTIFICATION BY ID
# ==========================================================

def get_notification_by_id(
    db: Session,
    notification_id: int
):
    """
    Return one notification by ID.
    """

    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id)
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    return notification


# ==========================================================
# GET CUSTOMER NOTIFICATIONS
# ==========================================================

def get_customer_notifications(
    db: Session,
    customer_email: str
):
    """
    Return all notifications belonging to one customer.
    """

    cleaned_email = customer_email.strip()

    if not cleaned_email:
        raise HTTPException(
            status_code=400,
            detail="Customer email is required"
        )

    return (
        db.query(Notification)
        .filter(Notification.customer_email == cleaned_email)
        .order_by(Notification.created_at.desc())
        .all()
    )


# ==========================================================
# GET CUSTOMER NOTIFICATION BY ID
# ==========================================================

def get_customer_notification_by_id(
    db: Session,
    notification_id: int,
    customer_email: str
):
    """
    Return one notification only if it belongs to the customer.
    """

    cleaned_email = customer_email.strip()

    if not cleaned_email:
        raise HTTPException(
            status_code=401,
            detail="Authenticated customer email is required"
        )

    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.customer_email == cleaned_email
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    return notification


# ==========================================================
# MARK NOTIFICATION AS READ OR UNREAD
# ==========================================================

def update_notification_read_status(
    db: Session,
    notification_id: int,
    read_data: NotificationReadUpdate,
    customer_email: str = None,
    is_admin: bool = False
):
    """
    Update a notification's read status.

    Customers may update only their own notifications.
    Administrators may update any notification.
    """

    notification = get_notification_by_id(
        db=db,
        notification_id=notification_id
    )

    if not is_admin:
        if not customer_email:
            raise HTTPException(
                status_code=401,
                detail="Authenticated customer email is required"
            )

        if notification.customer_email != customer_email:
            raise HTTPException(
                status_code=403,
                detail="You are not allowed to update this notification"
            )

    notification.is_read = read_data.is_read

    try:
        db.commit()
        db.refresh(notification)

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Database error occurred while updating notification"
        )

    return {
        "message": "Notification read status updated successfully",
        "notification": notification
    }


# ==========================================================
# MARK ALL CUSTOMER NOTIFICATIONS AS READ
# ==========================================================

def mark_all_customer_notifications_as_read(
    db: Session,
    customer_email: str
):
    """
    Mark all unread notifications belonging to a customer as read.
    """

    cleaned_email = customer_email.strip()

    if not cleaned_email:
        raise HTTPException(
            status_code=401,
            detail="Authenticated customer email is required"
        )

    notifications = (
        db.query(Notification)
        .filter(
            Notification.customer_email == cleaned_email,
            Notification.is_read.is_(False)
        )
        .all()
    )

    if not notifications:
        return {
            "message": "No unread notifications found",
            "updated_count": 0
        }

    try:
        for notification in notifications:
            notification.is_read = True

        db.commit()

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Database error occurred while updating notifications"
        )

    return {
        "message": "All notifications marked as read",
        "updated_count": len(notifications)
    }


# ==========================================================
# DELETE NOTIFICATION
# ==========================================================

def delete_notification(
    db: Session,
    notification_id: int,
    customer_email: str = None,
    is_admin: bool = False
):
    """
    Delete a notification.

    Customers may delete only their own notifications.
    Administrators may delete any notification.
    """

    notification = get_notification_by_id(
        db=db,
        notification_id=notification_id
    )

    if not is_admin:
        if not customer_email:
            raise HTTPException(
                status_code=401,
                detail="Authenticated customer email is required"
            )

        if notification.customer_email != customer_email:
            raise HTTPException(
                status_code=403,
                detail="You are not allowed to delete this notification"
            )

    try:
        db.delete(notification)
        db.commit()

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Database error occurred while deleting notification"
        )

    return {
        "message": "Notification deleted successfully"
    }


# ==========================================================
# DELETE ALL CUSTOMER NOTIFICATIONS
# ==========================================================

def delete_all_customer_notifications(
    db: Session,
    customer_email: str
):
    """
    Delete all notifications belonging to one customer.
    """

    cleaned_email = customer_email.strip()

    if not cleaned_email:
        raise HTTPException(
            status_code=401,
            detail="Authenticated customer email is required"
        )

    notifications = (
        db.query(Notification)
        .filter(Notification.customer_email == cleaned_email)
        .all()
    )

    if not notifications:
        return {
            "message": "No notifications found",
            "deleted_count": 0
        }

    try:
        deleted_count = len(notifications)

        for notification in notifications:
            db.delete(notification)

        db.commit()

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Database error occurred while deleting notifications"
        )

    return {
        "message": "All customer notifications deleted successfully",
        "deleted_count": deleted_count
    }


# ==========================================================
# SEARCH NOTIFICATIONS
# ==========================================================

def search_notifications(
    db: Session,
    keyword: str
):
    """
    Search notifications using:

    - customer email
    - title
    - message
    - notification type
    """

    cleaned_keyword = keyword.strip()

    if not cleaned_keyword:
        return []

    return (
        db.query(Notification)
        .filter(
            or_(
                Notification.customer_email.ilike(
                    f"%{cleaned_keyword}%"
                ),
                Notification.title.ilike(
                    f"%{cleaned_keyword}%"
                ),
                Notification.message.ilike(
                    f"%{cleaned_keyword}%"
                ),
                Notification.notification_type.ilike(
                    f"%{cleaned_keyword}%"
                )
            )
        )
        .order_by(Notification.created_at.desc())
        .all()
    )


# ==========================================================
# FILTER NOTIFICATIONS BY TYPE
# ==========================================================

def filter_notifications_by_type(
    db: Session,
    notification_type: str
):
    """
    Filter notifications using the notification type.
    """

    normalized_type = notification_type.strip().upper()

    if normalized_type not in ALLOWED_NOTIFICATION_TYPES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid notification type. Allowed types are: "
                f"{', '.join(ALLOWED_NOTIFICATION_TYPES)}"
            )
        )

    return (
        db.query(Notification)
        .filter(
            Notification.notification_type == normalized_type
        )
        .order_by(Notification.created_at.desc())
        .all()
    )


# ==========================================================
# FILTER CUSTOMER NOTIFICATIONS BY TYPE
# ==========================================================

def filter_customer_notifications_by_type(
    db: Session,
    customer_email: str,
    notification_type: str
):
    """
    Filter one customer's notifications by notification type.
    """

    cleaned_email = customer_email.strip()
    normalized_type = notification_type.strip().upper()

    if not cleaned_email:
        raise HTTPException(
            status_code=401,
            detail="Authenticated customer email is required"
        )

    if normalized_type not in ALLOWED_NOTIFICATION_TYPES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid notification type. Allowed types are: "
                f"{', '.join(ALLOWED_NOTIFICATION_TYPES)}"
            )
        )

    return (
        db.query(Notification)
        .filter(
            Notification.customer_email == cleaned_email,
            Notification.notification_type == normalized_type
        )
        .order_by(Notification.created_at.desc())
        .all()
    )


# ==========================================================
# FILTER BY READ STATUS
# ==========================================================

def filter_notifications_by_read_status(
    db: Session,
    is_read: bool
):
    """
    Filter all notifications by read status.
    """

    return (
        db.query(Notification)
        .filter(Notification.is_read == is_read)
        .order_by(Notification.created_at.desc())
        .all()
    )


# ==========================================================
# FILTER CUSTOMER NOTIFICATIONS BY READ STATUS
# ==========================================================

def filter_customer_notifications_by_read_status(
    db: Session,
    customer_email: str,
    is_read: bool
):
    """
    Filter a customer's notifications by read status.
    """

    cleaned_email = customer_email.strip()

    if not cleaned_email:
        raise HTTPException(
            status_code=401,
            detail="Authenticated customer email is required"
        )

    return (
        db.query(Notification)
        .filter(
            Notification.customer_email == cleaned_email,
            Notification.is_read == is_read
        )
        .order_by(Notification.created_at.desc())
        .all()
    )


# ==========================================================
# PAGINATE ALL NOTIFICATIONS
# ==========================================================

def paginate_notifications(
    db: Session,
    page: int,
    limit: int
):
    """
    Return all notifications using pagination.
    """

    if page < 1:
        page = 1

    if limit < 1:
        limit = 10

    if limit > 100:
        limit = 100

    offset = (page - 1) * limit

    total = db.query(Notification).count()

    notifications = (
        db.query(Notification)
        .order_by(Notification.created_at.desc())
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
        "notifications": notifications
    }


# ==========================================================
# PAGINATE CUSTOMER NOTIFICATIONS
# ==========================================================

def paginate_customer_notifications(
    db: Session,
    customer_email: str,
    page: int,
    limit: int
):
    """
    Return one customer's notifications using pagination.
    """

    cleaned_email = customer_email.strip()

    if not cleaned_email:
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
        db.query(Notification)
        .filter(Notification.customer_email == cleaned_email)
    )

    total = query.count()

    notifications = (
        query
        .order_by(Notification.created_at.desc())
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
        "notifications": notifications
    }


# ==========================================================
# COUNT UNREAD CUSTOMER NOTIFICATIONS
# ==========================================================

def count_unread_customer_notifications(
    db: Session,
    customer_email: str
):
    """
    Count unread notifications for one customer.
    """

    cleaned_email = customer_email.strip()

    if not cleaned_email:
        raise HTTPException(
            status_code=401,
            detail="Authenticated customer email is required"
        )

    unread_count = (
        db.query(Notification)
        .filter(
            Notification.customer_email == cleaned_email,
            Notification.is_read.is_(False)
        )
        .count()
    )

    return {
        "customer_email": cleaned_email,
        "unread_count": unread_count
    }