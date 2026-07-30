from typing import List

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query
)
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.core.roles import require_admin
from app.database.database import get_db

from app.schemas.notification_schema import (
    NotificationCreate,
    NotificationReadUpdate,
    NotificationResponse
)

from app.services.notification_service import (
    create_notification,
    get_all_notifications,
    get_notification_by_id,
    get_customer_notifications,
    get_customer_notification_by_id,
    update_notification_read_status,
    mark_all_customer_notifications_as_read,
    delete_notification,
    delete_all_customer_notifications,
    search_notifications,
    filter_notifications_by_type,
    filter_customer_notifications_by_type,
    filter_notifications_by_read_status,
    filter_customer_notifications_by_read_status,
    paginate_notifications,
    paginate_customer_notifications,
    count_unread_customer_notifications
)


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


# ==========================================================
# HELPER: EXTRACT USER EMAIL FROM JWT
# ==========================================================

def extract_user_email(current_user) -> str:
    """
    Extract the authenticated user's email from the decoded JWT.
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


# ==========================================================
# CREATE NOTIFICATION
# ==========================================================

@router.post(
    "/",
    status_code=201
)
def add_notification(
    notification: NotificationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    """
    Create a notification.

    Admin access is required.
    Later, the Order Service can call this endpoint.
    """

    return create_notification(
        db=db,
        notification_data=notification
    )


# ==========================================================
# CUSTOMER: GET MY NOTIFICATIONS
# ==========================================================

@router.get(
    "/my-notifications",
    response_model=List[NotificationResponse]
)
def read_my_notifications(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Return all notifications belonging to the authenticated user.
    """

    customer_email = extract_user_email(current_user)

    return get_customer_notifications(
        db=db,
        customer_email=customer_email
    )


# ==========================================================
# CUSTOMER: PAGINATE MY NOTIFICATIONS
# ==========================================================

@router.get("/my-notifications/page")
def paginate_my_notifications(
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
    Return authenticated customer's notifications using pagination.
    """

    customer_email = extract_user_email(current_user)

    return paginate_customer_notifications(
        db=db,
        customer_email=customer_email,
        page=page,
        limit=limit
    )


# ==========================================================
# CUSTOMER: FILTER MY NOTIFICATIONS BY TYPE
# ==========================================================

@router.get(
    "/my-notifications/filter/type",
    response_model=List[NotificationResponse]
)
def filter_my_notifications_by_type(
    notification_type: str = Query(
        ...,
        min_length=1
    ),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Filter authenticated customer's notifications by type.
    """

    customer_email = extract_user_email(current_user)

    return filter_customer_notifications_by_type(
        db=db,
        customer_email=customer_email,
        notification_type=notification_type
    )


# ==========================================================
# CUSTOMER: FILTER MY NOTIFICATIONS BY READ STATUS
# ==========================================================

@router.get(
    "/my-notifications/filter/read-status",
    response_model=List[NotificationResponse]
)
def filter_my_notifications_by_read_status(
    is_read: bool,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Filter authenticated customer's notifications by read status.
    """

    customer_email = extract_user_email(current_user)

    return filter_customer_notifications_by_read_status(
        db=db,
        customer_email=customer_email,
        is_read=is_read
    )


# ==========================================================
# CUSTOMER: COUNT MY UNREAD NOTIFICATIONS
# ==========================================================

@router.get("/my-notifications/unread-count")
def get_my_unread_notification_count(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Count unread notifications for the authenticated customer.
    """

    customer_email = extract_user_email(current_user)

    return count_unread_customer_notifications(
        db=db,
        customer_email=customer_email
    )


# ==========================================================
# CUSTOMER: MARK ALL MY NOTIFICATIONS AS READ
# ==========================================================

@router.put("/my-notifications/mark-all-read")
def mark_all_my_notifications_as_read(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Mark every unread notification belonging to the customer as read.
    """

    customer_email = extract_user_email(current_user)

    return mark_all_customer_notifications_as_read(
        db=db,
        customer_email=customer_email
    )


# ==========================================================
# CUSTOMER: DELETE ALL MY NOTIFICATIONS
# ==========================================================

@router.delete("/my-notifications/delete-all")
def delete_all_my_notifications(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Delete all notifications belonging to the authenticated customer.
    """

    customer_email = extract_user_email(current_user)

    return delete_all_customer_notifications(
        db=db,
        customer_email=customer_email
    )


# ==========================================================
# CUSTOMER: GET ONE OF MY NOTIFICATIONS
# ==========================================================

@router.get(
    "/my-notifications/{notification_id}",
    response_model=NotificationResponse
)
def read_my_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Return one notification only if it belongs to the customer.
    """

    customer_email = extract_user_email(current_user)

    return get_customer_notification_by_id(
        db=db,
        notification_id=notification_id,
        customer_email=customer_email
    )


# ==========================================================
# CUSTOMER: UPDATE READ STATUS
# ==========================================================

@router.put("/my-notifications/{notification_id}/read-status")
def change_my_notification_read_status(
    notification_id: int,
    read_data: NotificationReadUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Mark one customer notification as read or unread.
    """

    customer_email = extract_user_email(current_user)

    return update_notification_read_status(
        db=db,
        notification_id=notification_id,
        read_data=read_data,
        customer_email=customer_email,
        is_admin=False
    )


# ==========================================================
# CUSTOMER: DELETE ONE NOTIFICATION
# ==========================================================

@router.delete("/my-notifications/{notification_id}")
def delete_my_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Delete one notification belonging to the customer.
    """

    customer_email = extract_user_email(current_user)

    return delete_notification(
        db=db,
        notification_id=notification_id,
        customer_email=customer_email,
        is_admin=False
    )


# ==========================================================
# ADMIN: GET ALL NOTIFICATIONS
# ==========================================================

@router.get(
    "/admin/all",
    response_model=List[NotificationResponse]
)
def read_all_notifications(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    """
    Return all notifications.

    Admin access is required.
    """

    return get_all_notifications(db)


# ==========================================================
# ADMIN: SEARCH NOTIFICATIONS
# ==========================================================

@router.get(
    "/admin/search",
    response_model=List[NotificationResponse]
)
def search_notification_records(
    keyword: str = Query(
        ...,
        min_length=1
    ),
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    """
    Search notifications using customer email, title,
    message or notification type.
    """

    return search_notifications(
        db=db,
        keyword=keyword
    )


# ==========================================================
# ADMIN: FILTER BY NOTIFICATION TYPE
# ==========================================================

@router.get(
    "/admin/filter/type",
    response_model=List[NotificationResponse]
)
def filter_notification_records_by_type(
    notification_type: str = Query(
        ...,
        min_length=1
    ),
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    """
    Filter all notifications by type.
    """

    return filter_notifications_by_type(
        db=db,
        notification_type=notification_type
    )


# ==========================================================
# ADMIN: FILTER BY READ STATUS
# ==========================================================

@router.get(
    "/admin/filter/read-status",
    response_model=List[NotificationResponse]
)
def filter_notification_records_by_read_status(
    is_read: bool,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    """
    Filter all notifications by read status.
    """

    return filter_notifications_by_read_status(
        db=db,
        is_read=is_read
    )


# ==========================================================
# ADMIN: PAGINATE NOTIFICATIONS
# ==========================================================

@router.get("/admin/page")
def paginate_all_notifications(
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
    Return all notifications using pagination.
    """

    return paginate_notifications(
        db=db,
        page=page,
        limit=limit
    )


# ==========================================================
# ADMIN: GET NOTIFICATION BY ID
# ==========================================================

@router.get(
    "/admin/{notification_id}",
    response_model=NotificationResponse
)
def read_notification_by_id(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    """
    Return one notification using its ID.
    """

    return get_notification_by_id(
        db=db,
        notification_id=notification_id
    )


# ==========================================================
# ADMIN: UPDATE READ STATUS
# ==========================================================

@router.put("/admin/{notification_id}/read-status")
def change_notification_read_status(
    notification_id: int,
    read_data: NotificationReadUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    """
    Update the read status of any notification.
    """

    return update_notification_read_status(
        db=db,
        notification_id=notification_id,
        read_data=read_data,
        is_admin=True
    )


# ==========================================================
# ADMIN: DELETE NOTIFICATION
# ==========================================================

@router.delete("/admin/{notification_id}")
def remove_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    """
    Delete any notification.
    """

    return delete_notification(
        db=db,
        notification_id=notification_id,
        is_admin=True
    )