import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import {
    Link,
    useNavigate
} from "react-router-dom";

import { notificationAPI } from "../../api/axiosConfig";
import { useAuth } from "../../context/AuthContext";


const NOTIFICATION_TYPES = [
    "All",
    "ORDER_CREATED",
    "ORDER_CONFIRMED",
    "ORDER_PROCESSING",
    "ORDER_SHIPPED",
    "ORDER_DELIVERED",
    "ORDER_CANCELLED"
];


const READ_FILTERS = [
    {
        label: "All notifications",
        value: "all"
    },
    {
        label: "Unread only",
        value: "unread"
    },
    {
        label: "Read only",
        value: "read"
    }
];


const getNotificationIcon = (notificationType) => {
    const icons = {
        ORDER_CREATED: "🛍️",
        ORDER_CONFIRMED: "✓",
        ORDER_PROCESSING: "⚙️",
        ORDER_SHIPPED: "🚚",
        ORDER_DELIVERED: "📦",
        ORDER_CANCELLED: "✕"
    };

    return icons[notificationType] || "🔔";
};


const getNotificationTypeLabel = (notificationType) => {
    const labels = {
        ORDER_CREATED: "Order Created",
        ORDER_CONFIRMED: "Order Confirmed",
        ORDER_PROCESSING: "Order Processing",
        ORDER_SHIPPED: "Order Shipped",
        ORDER_DELIVERED: "Order Delivered",
        ORDER_CANCELLED: "Order Cancelled"
    };

    return labels[notificationType] || notificationType;
};


const formatDate = (dateValue) => {
    if (!dateValue) {
        return "Date unavailable";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return date.toLocaleString();
};


const formatBackendError = (
    requestError,
    defaultMessage
) => {
    const detail =
        requestError.response?.data?.detail;

    if (typeof detail === "string") {
        return detail;
    }

    if (Array.isArray(detail)) {
        return detail
            .map((item) => item.msg)
            .filter(Boolean)
            .join(" ");
    }

    return defaultMessage;
};


const Notifications = () => {
    const navigate = useNavigate();

    const {
        user,
        logout
    } = useAuth();


    const [notifications, setNotifications] =
        useState([]);

    const [searchTerm, setSearchTerm] =
        useState("");

    const [selectedType, setSelectedType] =
        useState("All");

    const [readFilter, setReadFilter] =
        useState("all");


    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [
        updatingNotificationId,
        setUpdatingNotificationId
    ] = useState(null);

    const [
        deletingNotificationId,
        setDeletingNotificationId
    ] = useState(null);

    const [markingAllRead, setMarkingAllRead] =
        useState(false);

    const [deletingAll, setDeletingAll] =
        useState(false);


    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");


    const customerEmail =
        user?.sub ||
        user?.email ||
        "Customer";


    const loadNotifications = useCallback(
        async (showRefreshState = false) => {
            if (showRefreshState) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            try {
                const response =
                    await notificationAPI.get(
                        "/my-notifications"
                    );

                setNotifications(
                    Array.isArray(response.data)
                        ? response.data
                        : []
                );
            } catch (requestError) {
                setError(
                    formatBackendError(
                        requestError,
                        "Unable to load your notifications."
                    )
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        []
    );


    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);


    const notificationStatistics = useMemo(
        () => {
            const unread = notifications.filter(
                (notification) =>
                    notification.is_read === false
            ).length;

            const read = notifications.filter(
                (notification) =>
                    notification.is_read === true
            ).length;

            const orderUpdates =
                notifications.filter(
                    (notification) =>
                        [
                            "ORDER_CONFIRMED",
                            "ORDER_PROCESSING",
                            "ORDER_SHIPPED",
                            "ORDER_DELIVERED"
                        ].includes(
                            notification.notification_type
                        )
                ).length;

            return {
                total: notifications.length,
                unread,
                read,
                orderUpdates
            };
        },
        [notifications]
    );


    const filteredNotifications = useMemo(
        () => {
            const normalizedSearch =
                searchTerm.trim().toLowerCase();

            return notifications.filter(
                (notification) => {
                    const matchesSearch =
                        !normalizedSearch ||
                        notification.title
                            ?.toLowerCase()
                            .includes(
                                normalizedSearch
                            ) ||
                        notification.message
                            ?.toLowerCase()
                            .includes(
                                normalizedSearch
                            ) ||
                        notification.notification_type
                            ?.toLowerCase()
                            .includes(
                                normalizedSearch
                            ) ||
                        String(
                            notification.order_id || ""
                        ).includes(
                            normalizedSearch
                        );

                    const matchesType =
                        selectedType === "All" ||
                        notification.notification_type ===
                        selectedType;

                    const matchesReadStatus =
                        readFilter === "all" ||
                        (
                            readFilter === "read" &&
                            notification.is_read === true
                        ) ||
                        (
                            readFilter === "unread" &&
                            notification.is_read === false
                        );

                    return (
                        matchesSearch &&
                        matchesType &&
                        matchesReadStatus
                    );
                }
            );
        },
        [
            notifications,
            searchTerm,
            selectedType,
            readFilter
        ]
    );


    const sortedNotifications = useMemo(
        () => {
            return [...filteredNotifications].sort(
                (firstNotification, secondNotification) => {
                    const firstDate = new Date(
                        firstNotification.created_at || 0
                    ).getTime();

                    const secondDate = new Date(
                        secondNotification.created_at || 0
                    ).getTime();

                    return secondDate - firstDate;
                }
            );
        },
        [filteredNotifications]
    );


    const handleLogout = () => {
        logout();
        navigate("/login");
    };


    const clearMessages = () => {
        setError("");
        setSuccess("");
    };


    const clearFilters = () => {
        setSearchTerm("");
        setSelectedType("All");
        setReadFilter("all");
    };


    const handleRefresh = async () => {
        clearMessages();

        await loadNotifications(true);
    };


    const handleReadStatusChange = async (
        notification
    ) => {
        setUpdatingNotificationId(
            notification.id
        );

        clearMessages();

        const newReadStatus =
            !notification.is_read;

        try {
            const response =
                await notificationAPI.put(
                    `/my-notifications/` +
                    `${notification.id}/read-status`,
                    {
                        is_read: newReadStatus
                    }
                );

            setNotifications(
                (currentNotifications) =>
                    currentNotifications.map(
                        (currentNotification) => {
                            if (
                                currentNotification.id !==
                                notification.id
                            ) {
                                return currentNotification;
                            }

                            return {
                                ...currentNotification,
                                is_read: newReadStatus,
                                updated_at:
                                    response.data
                                        ?.notification
                                        ?.updated_at ||
                                    currentNotification.updated_at
                            };
                        }
                    )
            );

            setSuccess(
                newReadStatus
                    ? "Notification marked as read."
                    : "Notification marked as unread."
            );
        } catch (requestError) {
            setError(
                formatBackendError(
                    requestError,
                    "Unable to update notification status."
                )
            );
        } finally {
            setUpdatingNotificationId(null);
        }
    };


    const handleMarkAllRead = async () => {
        if (
            notificationStatistics.unread === 0
        ) {
            setSuccess(
                "You have no unread notifications."
            );

            return;
        }

        setMarkingAllRead(true);
        clearMessages();

        try {
            const response =
                await notificationAPI.put(
                    "/my-notifications/mark-all-read"
                );

            setNotifications(
                (currentNotifications) =>
                    currentNotifications.map(
                        (notification) => ({
                            ...notification,
                            is_read: true
                        })
                    )
            );

            setSuccess(
                response.data?.message ||
                "All notifications marked as read."
            );
        } catch (requestError) {
            setError(
                formatBackendError(
                    requestError,
                    "Unable to mark all notifications as read."
                )
            );
        } finally {
            setMarkingAllRead(false);
        }
    };


    const handleDeleteNotification = async (
        notification
    ) => {
        const confirmed = window.confirm(
            `Delete notification "${notification.title}"?`
        );

        if (!confirmed) {
            return;
        }

        setDeletingNotificationId(
            notification.id
        );

        clearMessages();

        try {
            const response =
                await notificationAPI.delete(
                    `/my-notifications/` +
                    `${notification.id}`
                );

            setNotifications(
                (currentNotifications) =>
                    currentNotifications.filter(
                        (currentNotification) =>
                            currentNotification.id !==
                            notification.id
                    )
            );

            setSuccess(
                response.data?.message ||
                "Notification deleted successfully."
            );
        } catch (requestError) {
            setError(
                formatBackendError(
                    requestError,
                    "Unable to delete this notification."
                )
            );
        } finally {
            setDeletingNotificationId(null);
        }
    };


    const handleDeleteAll = async () => {
        if (notifications.length === 0) {
            setSuccess(
                "You have no notifications to delete."
            );

            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to delete all notifications? " +
            "This action cannot be undone."
        );

        if (!confirmed) {
            return;
        }

        setDeletingAll(true);
        clearMessages();

        try {
            const response =
                await notificationAPI.delete(
                    "/my-notifications/delete-all"
                );

            setNotifications([]);

            setSuccess(
                response.data?.message ||
                "All notifications deleted successfully."
            );
        } catch (requestError) {
            setError(
                formatBackendError(
                    requestError,
                    "Unable to delete all notifications."
                )
            );
        } finally {
            setDeletingAll(false);
        }
    };

    return (
        <div className="notifications-page">
            <aside className="customer-sidebar notifications-sidebar">
                <div className="customer-sidebar-brand">
                    <div className="customer-brand-icon">
                        ✦
                    </div>

                    <div>
                        <h2>SmartRetailX</h2>
                        <p>Customer Portal</p>
                    </div>
                </div>

                <nav className="customer-sidebar-nav">
                    <Link
                        className="customer-nav-link"
                        to="/customer"
                    >
                        <span>⌂</span>
                        Dashboard
                    </Link>

                    <Link
                        className="customer-nav-link"
                        to="/customer/products"
                    >
                        <span>🛍</span>
                        Products
                    </Link>

                    <Link
                        className="customer-nav-link"
                        to="/customer/orders"
                    >
                        <span>📦</span>
                        My Orders
                    </Link>

                    <Link
                        className="customer-nav-link active"
                        to="/customer/notifications"
                    >
                        <span>🔔</span>
                        Notifications

                        {notificationStatistics.unread > 0 && (
                            <b className="customer-nav-badge">
                                {notificationStatistics.unread}
                            </b>
                        )}
                    </Link>
                </nav>

                <div className="customer-sidebar-footer">
                    <div className="customer-mini-profile">
                        <div className="customer-avatar">
                            {customerEmail
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <div>
                            <strong>
                                {customerEmail}
                            </strong>

                            <span>
                                Customer
                            </span>
                        </div>
                    </div>

                    <button
                        className="customer-logout-button"
                        type="button"
                        onClick={handleLogout}
                    >
                        Sign out
                    </button>
                </div>
            </aside>

            <main className="notifications-main">
                <header className="notifications-header">
                    <div>
                        <p className="customer-topbar-label">
                            Notification centre
                        </p>

                        <h1>
                            Stay informed with
                            <span> every update</span>
                        </h1>

                        <p>
                            Review order activity, track important changes
                            and manage your notification history.
                        </p>
                    </div>

                    <div className="notifications-header-actions">
                        <button
                            className="secondary-button"
                            type="button"
                            onClick={handleRefresh}
                            disabled={refreshing}
                        >
                            {refreshing
                                ? "Refreshing..."
                                : "Refresh"}
                        </button>

                        <button
                            className="primary-button"
                            type="button"
                            onClick={handleMarkAllRead}
                            disabled={
                                markingAllRead ||
                                notificationStatistics.unread === 0
                            }
                        >
                            {markingAllRead
                                ? "Updating..."
                                : "Mark all as read"}
                        </button>
                    </div>
                </header>

                <section className="notifications-hero">
                    <div>
                        <span className="customer-hero-chip">
                            Connected order communication
                        </span>

                        <h2>
                            Every order event arrives directly in your
                            notification centre.
                        </h2>

                        <p>
                            SmartRetailX keeps you informed when an order is
                            created, confirmed, processed, shipped, delivered
                            or cancelled.
                        </p>
                    </div>

                    <div className="notifications-hero-visual">
                        <div className="notifications-bell">
                            🔔
                        </div>

                        <strong>
                            {loading
                                ? "..."
                                : notificationStatistics.unread}
                        </strong>

                        <small>
                            Unread notifications
                        </small>
                    </div>
                </section>

                <section className="notifications-stat-grid">
                    <article className="notifications-stat-card">
                        <div className="notifications-stat-icon total">
                            🔔
                        </div>

                        <div>
                            <span>
                                Total notifications
                            </span>

                            <strong>
                                {loading
                                    ? "..."
                                    : notificationStatistics.total}
                            </strong>
                        </div>
                    </article>

                    <article className="notifications-stat-card">
                        <div className="notifications-stat-icon unread">
                            ●
                        </div>

                        <div>
                            <span>
                                Unread
                            </span>

                            <strong>
                                {loading
                                    ? "..."
                                    : notificationStatistics.unread}
                            </strong>
                        </div>
                    </article>

                    <article className="notifications-stat-card">
                        <div className="notifications-stat-icon read">
                            ✓
                        </div>

                        <div>
                            <span>
                                Read
                            </span>

                            <strong>
                                {loading
                                    ? "..."
                                    : notificationStatistics.read}
                            </strong>
                        </div>
                    </article>

                    <article className="notifications-stat-card">
                        <div className="notifications-stat-icon updates">
                            ⚡
                        </div>

                        <div>
                            <span>
                                Order updates
                            </span>

                            <strong>
                                {loading
                                    ? "..."
                                    : notificationStatistics.orderUpdates}
                            </strong>
                        </div>
                    </article>
                </section>

                {error && (
                    <div
                        className="error-message notifications-alert"
                        role="alert"
                    >
                        <span>⚠</span>
                        {error}
                    </div>
                )}

                {success && (
                    <div
                        className="success-message notifications-alert"
                        role="status"
                    >
                        <span>✓</span>
                        {success}
                    </div>
                )}

                <section className="notifications-filter-panel">
                    <div className="notifications-search-group">
                        <label htmlFor="notification-search">
                            Search notifications
                        </label>

                        <div className="notifications-search-wrapper">
                            <span>⌕</span>

                            <input
                                id="notification-search"
                                type="search"
                                value={searchTerm}
                                onChange={(event) => {
                                    setSearchTerm(
                                        event.target.value
                                    );
                                }}
                                placeholder="Search by title, message, order ID or type"
                            />
                        </div>
                    </div>

                    <div className="notifications-filter-group">
                        <label htmlFor="notification-type">
                            Notification type
                        </label>

                        <select
                            id="notification-type"
                            value={selectedType}
                            onChange={(event) => {
                                setSelectedType(
                                    event.target.value
                                );
                            }}
                        >
                            {NOTIFICATION_TYPES.map((type) => (
                                <option
                                    value={type}
                                    key={type}
                                >
                                    {type === "All"
                                        ? "All types"
                                        : getNotificationTypeLabel(type)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="notifications-filter-group">
                        <label htmlFor="read-filter">
                            Read status
                        </label>

                        <select
                            id="read-filter"
                            value={readFilter}
                            onChange={(event) => {
                                setReadFilter(
                                    event.target.value
                                );
                            }}
                        >
                            {READ_FILTERS.map((filter) => (
                                <option
                                    value={filter.value}
                                    key={filter.value}
                                >
                                    {filter.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        className="products-clear-button"
                        type="button"
                        onClick={clearFilters}
                    >
                        Clear filters
                    </button>
                </section>

                <section className="notifications-content">
                    <div className="notifications-section-heading">
                        <div>
                            <span>
                                Notification history
                            </span>

                            <h2>
                                {loading
                                    ? "Loading notifications"
                                    : `${sortedNotifications.length} notification${sortedNotifications.length === 1
                                        ? ""
                                        : "s"
                                    } found`}
                            </h2>
                        </div>

                        <button
                            className="notifications-delete-all-button"
                            type="button"
                            onClick={handleDeleteAll}
                            disabled={
                                deletingAll ||
                                notifications.length === 0
                            }
                        >
                            {deletingAll
                                ? "Deleting..."
                                : "Delete all"}
                        </button>
                    </div>

                    {loading ? (
                        <div className="notifications-loading-list">
                            {[1, 2, 3, 4].map((item) => (
                                <div
                                    className="notifications-skeleton"
                                    key={item}
                                />
                            ))}
                        </div>
                    ) : sortedNotifications.length === 0 ? (
                        <div className="notifications-empty-state">
                            <div>🔕</div>

                            <h3>
                                No notifications found
                            </h3>

                            <p>
                                New order updates will appear here
                                automatically.
                            </p>

                            <button
                                className="secondary-button"
                                type="button"
                                onClick={clearFilters}
                            >
                                Reset filters
                            </button>
                        </div>
                    ) : (
                        <div className="notifications-list">
                            {sortedNotifications.map(
                                (notification) => (
                                    <article
                                        className={
                                            notification.is_read
                                                ? "notification-card"
                                                : "notification-card unread"
                                        }
                                        key={notification.id}
                                    >
                                        <div className="notification-icon-wrap">
                                            <div
                                                className={
                                                    `notification-type-icon ` +
                                                    `type-${notification.notification_type
                                                        ?.toLowerCase()
                                                        .replaceAll(
                                                            "_",
                                                            "-"
                                                        )}`
                                                }
                                            >
                                                {getNotificationIcon(
                                                    notification.notification_type
                                                )}
                                            </div>

                                            {!notification.is_read && (
                                                <span className="notification-unread-dot" />
                                            )}
                                        </div>

                                        <div className="notification-card-content">
                                            <div className="notification-card-header">
                                                <div>
                                                    <span className="notification-type-label">
                                                        {getNotificationTypeLabel(
                                                            notification.notification_type
                                                        )}
                                                    </span>

                                                    <h3>
                                                        {notification.title}
                                                    </h3>
                                                </div>

                                                <span
                                                    className={
                                                        notification.is_read
                                                            ? "notification-read-badge read"
                                                            : "notification-read-badge unread"
                                                    }
                                                >
                                                    {notification.is_read
                                                        ? "Read"
                                                        : "Unread"}
                                                </span>
                                            </div>

                                            <p className="notification-message">
                                                {notification.message}
                                            </p>

                                            <div className="notification-meta-grid">
                                                <div>
                                                    <span>
                                                        Order reference
                                                    </span>

                                                    <strong>
                                                        {notification.order_id
                                                            ? `#${notification.order_id}`
                                                            : "Not linked"}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>
                                                        Created
                                                    </span>

                                                    <strong>
                                                        {formatDate(
                                                            notification.created_at
                                                        )}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>
                                                        Last updated
                                                    </span>

                                                    <strong>
                                                        {formatDate(
                                                            notification.updated_at
                                                        )}
                                                    </strong>
                                                </div>
                                            </div>

                                            <div className="notification-card-actions">
                                                {notification.order_id && (
                                                    <Link
                                                        className="notification-order-link"
                                                        to="/customer/orders"
                                                    >
                                                        View order
                                                    </Link>
                                                )}

                                                <button
                                                    className="notification-read-button"
                                                    type="button"
                                                    onClick={() => {
                                                        handleReadStatusChange(
                                                            notification
                                                        );
                                                    }}
                                                    disabled={
                                                        updatingNotificationId ===
                                                        notification.id
                                                    }
                                                >
                                                    {updatingNotificationId ===
                                                        notification.id
                                                        ? "Updating..."
                                                        : notification.is_read
                                                            ? "Mark as unread"
                                                            : "Mark as read"}
                                                </button>

                                                <button
                                                    className="notification-delete-button"
                                                    type="button"
                                                    onClick={() => {
                                                        handleDeleteNotification(
                                                            notification
                                                        );
                                                    }}
                                                    disabled={
                                                        deletingNotificationId ===
                                                        notification.id
                                                    }
                                                >
                                                    {deletingNotificationId ===
                                                        notification.id
                                                        ? "Deleting..."
                                                        : "Delete"}
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                )
                            )}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};


export default Notifications;