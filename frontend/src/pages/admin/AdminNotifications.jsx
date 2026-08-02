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

import {
    notificationAPI
} from "../../api/axiosConfig";

import {
    useAuth
} from "../../context/AuthContext";


const EMPTY_NOTIFICATION_FORM = {
    recipient_email: "",
    title: "",
    message: "",
    type: "General",
    broadcast: false
};


const NOTIFICATION_TYPES = [
    "General",
    "Order",
    "Promotion",
    "System",
    "Warning"
];


const formatDate = (value) => {
    if (!value) {
        return "Not available";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not available";
    }

    return date.toLocaleString();
};


const getBackendError = (
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


const extractNotifications = (
    responseData
) => {
    if (Array.isArray(responseData)) {
        return responseData;
    }

    const possibleKeys = [
        "notifications",
        "items",
        "data",
        "results"
    ];

    for (const key of possibleKeys) {
        if (
            Array.isArray(
                responseData?.[key]
            )
        ) {
            return responseData[key];
        }
    }

    return [];
};


const getRecipient = (notification) => {
    return (
        notification.recipient_email ||
        notification.customer_email ||
        notification.user_email ||
        notification.email ||
        (
            notification.broadcast
                ? "All customers"
                : "Unknown recipient"
        )
    );
};


const getNotificationType = (
    notification
) => {
    return (
        notification.type ||
        notification.notification_type ||
        "General"
    );
};


const getReadStatus = (notification) => {
    return Boolean(
        notification.is_read ??
        notification.read ??
        false
    );
};


const AdminNotifications = () => {
    const navigate = useNavigate();

    const {
        user,
        logout
    } = useAuth();

    const [
        notifications,
        setNotifications
    ] = useState([]);

    const [
        loading,
        setLoading
    ] = useState(true);

    const [
        refreshing,
        setRefreshing
    ] = useState(false);

    const [
        searchTerm,
        setSearchTerm
    ] = useState("");

    const [
        typeFilter,
        setTypeFilter
    ] = useState("All");

    const [
        readFilter,
        setReadFilter
    ] = useState("All");

    const [
        sortOption,
        setSortOption
    ] = useState("newest");

    const [
        selectedNotification,
        setSelectedNotification
    ] = useState(null);

    const [
        showCreateModal,
        setShowCreateModal
    ] = useState(false);

    const [
        formData,
        setFormData
    ] = useState(
        EMPTY_NOTIFICATION_FORM
    );

    const [
        saving,
        setSaving
    ] = useState(false);

    const [
        deletingNotificationId,
        setDeletingNotificationId
    ] = useState(null);

    const [
        error,
        setError
    ] = useState("");

    const [
        success,
        setSuccess
    ] = useState("");


    const adminEmail =
        user?.sub ||
        user?.email ||
        "Administrator";


    const loadNotifications = useCallback(
        async (
            showRefreshState = false
        ) => {
            if (showRefreshState) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            try {
                const response =
                    await notificationAPI.get(
                        "/admin/all"
                    );

                setNotifications(
                    extractNotifications(
                        response.data
                    )
                );
            } catch (requestError) {
                setError(
                    getBackendError(
                        requestError,
                        "Unable to load notifications. Confirm that the Notification Service provides GET /notifications/admin/all."
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


    const statistics = useMemo(() => {
        const total =
            notifications.length;

        const read =
            notifications.filter(
                getReadStatus
            ).length;

        const unread =
            total - read;

        const broadcasts =
            notifications.filter(
                (notification) =>
                    Boolean(
                        notification.broadcast
                    ) ||
                    getRecipient(
                        notification
                    ) === "All customers"
            ).length;

        return {
            total,
            read,
            unread,
            broadcasts
        };
    }, [notifications]);


    const availableTypes = useMemo(() => {
        const values = new Set(
            NOTIFICATION_TYPES
        );

        notifications.forEach(
            (notification) => {
                values.add(
                    getNotificationType(
                        notification
                    )
                );
            }
        );

        return Array.from(
            values
        ).sort();
    }, [notifications]);


    const filteredNotifications =
        useMemo(() => {
            const normalizedSearch =
                searchTerm
                    .trim()
                    .toLowerCase();

            const result =
                notifications.filter(
                    (notification) => {
                        const searchableValues = [
                            notification.id,
                            notification.title,
                            notification.message,
                            getRecipient(
                                notification
                            ),
                            getNotificationType(
                                notification
                            )
                        ]
                            .filter(
                                (value) =>
                                    value !==
                                        undefined &&
                                    value !== null
                            )
                            .map(
                                (value) =>
                                    String(
                                        value
                                    ).toLowerCase()
                            );

                        const matchesSearch =
                            !normalizedSearch ||
                            searchableValues.some(
                                (value) =>
                                    value.includes(
                                        normalizedSearch
                                    )
                            );

                        const type =
                            getNotificationType(
                                notification
                            );

                        const matchesType =
                            typeFilter === "All" ||
                            type === typeFilter;

                        const isRead =
                            getReadStatus(
                                notification
                            );

                        const matchesRead =
                            readFilter === "All" ||
                            (
                                readFilter ===
                                    "Read" &&
                                isRead
                            ) ||
                            (
                                readFilter ===
                                    "Unread" &&
                                !isRead
                            );

                        return (
                            matchesSearch &&
                            matchesType &&
                            matchesRead
                        );
                    }
                );

            return [...result].sort(
                (
                    firstNotification,
                    secondNotification
                ) => {
                    const firstDate =
                        new Date(
                            firstNotification.created_at ||
                            0
                        ).getTime();

                    const secondDate =
                        new Date(
                            secondNotification.created_at ||
                            0
                        ).getTime();

                    if (
                        sortOption === "oldest"
                    ) {
                        return (
                            firstDate -
                            secondDate
                        );
                    }

                    if (
                        sortOption === "title-asc"
                    ) {
                        return String(
                            firstNotification.title ||
                            ""
                        ).localeCompare(
                            String(
                                secondNotification.title ||
                                ""
                            )
                        );
                    }

                    if (
                        sortOption === "title-desc"
                    ) {
                        return String(
                            secondNotification.title ||
                            ""
                        ).localeCompare(
                            String(
                                firstNotification.title ||
                                ""
                            )
                        );
                    }

                    return (
                        secondDate -
                        firstDate
                    );
                }
            );
        }, [
            notifications,
            searchTerm,
            typeFilter,
            readFilter,
            sortOption
        ]);


    const clearMessages = () => {
        setError("");
        setSuccess("");
    };


    const clearFilters = () => {
        setSearchTerm("");
        setTypeFilter("All");
        setReadFilter("All");
        setSortOption("newest");
    };


    const openCreateModal = () => {
        clearMessages();

        setFormData(
            EMPTY_NOTIFICATION_FORM
        );

        setShowCreateModal(true);
    };


    const closeCreateModal = () => {
        if (saving) {
            return;
        }

        setShowCreateModal(false);

        setFormData(
            EMPTY_NOTIFICATION_FORM
        );
    };


    const handleFormChange = (
        event
    ) => {
        const {
            name,
            value,
            type,
            checked
        } = event.target;

        setFormData(
            (currentData) => ({
                ...currentData,
                [name]:
                    type === "checkbox"
                        ? checked
                        : value
            })
        );

        if (error) {
            setError("");
        }
    };


    const validateForm = () => {
        if (
            !formData.broadcast &&
            !formData.recipient_email.trim()
        ) {
            return (
                "Recipient email is required."
            );
        }

        if (!formData.title.trim()) {
            return (
                "Notification title is required."
            );
        }

        if (!formData.message.trim()) {
            return (
                "Notification message is required."
            );
        }

        return "";
    };


    const createNotification = async (
        event
    ) => {
        event.preventDefault();

        clearMessages();

        const validationError =
            validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        setSaving(true);

        try {
            const payload = {
                recipient_email:
                    formData.broadcast
                        ? null
                        : formData
                              .recipient_email
                              .trim(),

                title:
                    formData.title.trim(),

                message:
                    formData.message.trim(),

                type:
                    formData.type,

                broadcast:
                    formData.broadcast
            };

            const endpoint =
                formData.broadcast
                    ? "/admin/broadcast"
                    : "/admin/send";

            await notificationAPI.post(
                endpoint,
                payload
            );

            setSuccess(
                formData.broadcast
                    ? "Broadcast notification was sent successfully."
                    : "Notification was sent successfully."
            );

            setShowCreateModal(false);

            setFormData(
                EMPTY_NOTIFICATION_FORM
            );

            await loadNotifications(true);
        } catch (requestError) {
            setError(
                getBackendError(
                    requestError,
                    formData.broadcast
                        ? "Unable to send the broadcast notification."
                        : "Unable to send this notification."
                )
            );
        } finally {
            setSaving(false);
        }
    };


    const deleteNotification = async (
        notification
    ) => {
        const confirmed =
            window.confirm(
                `Delete notification #${notification.id}?`
            );

        if (!confirmed) {
            return;
        }

        setDeletingNotificationId(
            notification.id
        );

        clearMessages();

        try {
            await notificationAPI.delete(
                `/admin/${notification.id}`
            );

            setNotifications(
                (currentNotifications) =>
                    currentNotifications.filter(
                        (
                            currentNotification
                        ) =>
                            currentNotification.id !==
                            notification.id
                    )
            );

            setSelectedNotification(
                (currentNotification) =>
                    currentNotification?.id ===
                    notification.id
                        ? null
                        : currentNotification
            );

            setSuccess(
                `Notification #${notification.id} was deleted successfully.`
            );
        } catch (requestError) {
            setError(
                getBackendError(
                    requestError,
                    "Unable to delete this notification."
                )
            );
        } finally {
            setDeletingNotificationId(
                null
            );
        }
    };


    const handleLogout = () => {
        logout();
        navigate("/login");
    };


    return (
        <div className="admin-notifications-page">
            <aside className="admin-sidebar">
                <div className="admin-sidebar-brand">
                    <div className="admin-brand-icon">
                        ✦
                    </div>

                    <div>
                        <h2>SmartRetailX</h2>
                        <p>Administration</p>
                    </div>
                </div>

                <nav className="admin-sidebar-nav">
                    <Link
                        className="customer-nav-link"
                        to="/"
                    >
                        <span>🏠</span>
                        Store Home
                    </Link>                   

                    <Link
                        className="admin-nav-link"
                        to="/admin"
                    >
                        <span>⌂</span>
                        Dashboard
                    </Link>

                    <Link
                        className="admin-nav-link"
                        to="/admin/products"
                    >
                        <span>🛍️</span>
                        Products
                    </Link>

                    <Link
                        className="admin-nav-link"
                        to="/admin/orders"
                    >
                        <span>📦</span>
                        Orders
                    </Link>

                    <Link
                        className="admin-nav-link active"
                        to="/admin/notifications"
                    >
                        <span>🔔</span>
                        Notifications
                    </Link>

                    <Link
                        className="admin-nav-link"
                        to="/admin/users"
                    >
                        <span>👥</span>
                        Users
                    </Link>
                </nav>

                <div className="admin-sidebar-footer">
                    <div className="admin-mini-profile">
                        <div className="admin-avatar">
                            {adminEmail
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <div>
                            <strong>
                                {adminEmail}
                            </strong>

                            <span>
                                Administrator
                            </span>
                        </div>
                    </div>

                    <button
                        className="admin-logout-button"
                        type="button"
                        onClick={handleLogout}
                    >
                        Sign out
                    </button>
                </div>
            </aside>

            <main className="admin-notifications-main">
                <header className="admin-notifications-topbar">
                    <div>
                        <p className="admin-topbar-label">
                            Communication administration
                        </p>

                        <h1>
                            Notification
                            <span> management</span>
                        </h1>

                        <p>
                            Review notification history, send direct
                            messages and broadcast updates to customers.
                        </p>
                    </div>

                    <div className="admin-notifications-topbar-actions">
                        <button
                            className="admin-refresh-button"
                            type="button"
                            onClick={() => {
                                loadNotifications(
                                    true
                                );
                            }}
                            disabled={refreshing}
                        >
                            {refreshing
                                ? "Refreshing..."
                                : "Refresh"}
                        </button>

                        <button
                            className="primary-button"
                            type="button"
                            onClick={
                                openCreateModal
                            }
                        >
                            Send notification
                            <span>＋</span>
                        </button>
                    </div>
                </header>

                {error &&
                    !showCreateModal && (
                        <div
                            className="error-message admin-notifications-alert"
                            role="alert"
                        >
                            <span>⚠</span>
                            {error}
                        </div>
                    )}

                {success &&
                    !showCreateModal && (
                        <div
                            className="success-message admin-notifications-alert"
                            role="status"
                        >
                            <span>✓</span>
                            {success}
                        </div>
                    )}

                <section className="admin-notifications-hero">
                    <div>
                        <span>
                            Connected Notification Service
                        </span>

                        <h2>
                            Keep customers informed at every stage.
                        </h2>

                        <p>
                            Send order updates, promotional messages
                            and important platform announcements.
                        </p>
                    </div>

                    <div className="admin-notifications-hero-visual">
                        <span>🔔</span>

                        <strong>
                            {loading
                                ? "..."
                                : statistics.total}
                        </strong>

                        <small>
                            Notifications
                        </small>
                    </div>
                </section>

                <section className="admin-notifications-stat-grid">
                    <article>
                        <span>Total</span>

                        <strong>
                            {loading
                                ? "..."
                                : statistics.total}
                        </strong>
                    </article>

                    <article>
                        <span>Read</span>

                        <strong>
                            {loading
                                ? "..."
                                : statistics.read}
                        </strong>
                    </article>

                    <article>
                        <span>Unread</span>

                        <strong>
                            {loading
                                ? "..."
                                : statistics.unread}
                        </strong>
                    </article>

                    <article>
                        <span>Broadcasts</span>

                        <strong>
                            {loading
                                ? "..."
                                : statistics.broadcasts}
                        </strong>
                    </article>
                </section>

                <section className="admin-notifications-filter-panel">
                    <div className="admin-notifications-search">
                        <label htmlFor="admin-notification-search">
                            Search notifications
                        </label>

                        <div>
                            <span>⌕</span>

                            <input
                                id="admin-notification-search"
                                type="search"
                                value={searchTerm}
                                onChange={(event) => {
                                    setSearchTerm(
                                        event.target
                                            .value
                                    );
                                }}
                                placeholder="Search title, message, recipient or type"
                            />
                        </div>
                    </div>

                    <div className="admin-notifications-filter">
                        <label htmlFor="admin-notification-type-filter">
                            Type
                        </label>

                        <select
                            id="admin-notification-type-filter"
                            value={typeFilter}
                            onChange={(event) => {
                                setTypeFilter(
                                    event.target
                                        .value
                                );
                            }}
                        >
                            <option value="All">
                                All types
                            </option>

                            {availableTypes.map(
                                (type) => (
                                    <option
                                        key={type}
                                        value={type}
                                    >
                                        {type}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    <div className="admin-notifications-filter">
                        <label htmlFor="admin-notification-read-filter">
                            Read status
                        </label>

                        <select
                            id="admin-notification-read-filter"
                            value={readFilter}
                            onChange={(event) => {
                                setReadFilter(
                                    event.target
                                        .value
                                );
                            }}
                        >
                            <option value="All">
                                All notifications
                            </option>

                            <option value="Read">
                                Read
                            </option>

                            <option value="Unread">
                                Unread
                            </option>
                        </select>
                    </div>

                    <div className="admin-notifications-filter">
                        <label htmlFor="admin-notification-sort">
                            Sort
                        </label>

                        <select
                            id="admin-notification-sort"
                            value={sortOption}
                            onChange={(event) => {
                                setSortOption(
                                    event.target
                                        .value
                                );
                            }}
                        >
                            <option value="newest">
                                Newest first
                            </option>

                            <option value="oldest">
                                Oldest first
                            </option>

                            <option value="title-asc">
                                Title: A to Z
                            </option>

                            <option value="title-desc">
                                Title: Z to A
                            </option>
                        </select>
                    </div>

                    <button
                        className="admin-notifications-clear-button"
                        type="button"
                        onClick={clearFilters}
                    >
                        Clear filters
                    </button>
                </section>

                <section className="admin-notifications-content">
                    <div className="admin-notifications-heading">
                        <div>
                            <span>
                                Notification records
                            </span>

                            <h2>
                                {loading
                                    ? "Loading notifications"
                                    : `${filteredNotifications.length} notification${
                                          filteredNotifications.length ===
                                          1
                                              ? ""
                                              : "s"
                                      } found`}
                            </h2>
                        </div>
                    </div>

                    {loading ? (
                        <div className="admin-notifications-loading">
                            Loading notifications...
                        </div>
                    ) : filteredNotifications.length ===
                      0 ? (
                        <div className="admin-notifications-empty">
                            <div>🔔</div>

                            <h3>
                                No matching notifications
                            </h3>

                            <p>
                                Change the filters or send a new
                                notification.
                            </p>

                            <button
                                className="primary-button"
                                type="button"
                                onClick={
                                    openCreateModal
                                }
                            >
                                Send notification
                            </button>
                        </div>
                    ) : (
                        <div className="admin-notifications-table-wrapper">
                            <table className="admin-notifications-table">
                                <thead>
                                    <tr>
                                        <th>Notification</th>
                                        <th>Recipient</th>
                                        <th>Type</th>
                                        <th>Status</th>
                                        <th>Created</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredNotifications.map(
                                        (
                                            notification
                                        ) => (
                                            <tr
                                                key={
                                                    notification.id
                                                }
                                            >
                                                <td>
                                                    <div className="admin-notification-summary">
                                                        <div>
                                                            🔔
                                                        </div>

                                                        <span>
                                                            <strong>
                                                                {notification.title ||
                                                                    "Untitled notification"}
                                                            </strong>

                                                            <small>
                                                                Notification #
                                                                {
                                                                    notification.id
                                                                }
                                                            </small>

                                                            <p>
                                                                {notification.message ||
                                                                    "No message available."}
                                                            </p>
                                                        </span>
                                                    </div>
                                                </td>

                                                <td>
                                                    {getRecipient(
                                                        notification
                                                    )}
                                                </td>

                                                <td>
                                                    <span className="admin-notification-type-badge">
                                                        {getNotificationType(
                                                            notification
                                                        )}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span
                                                        className={
                                                            getReadStatus(
                                                                notification
                                                            )
                                                                ? "admin-notification-read-badge read"
                                                                : "admin-notification-read-badge unread"
                                                        }
                                                    >
                                                        {getReadStatus(
                                                            notification
                                                        )
                                                            ? "Read"
                                                            : "Unread"}
                                                    </span>
                                                </td>

                                                <td>
                                                    {formatDate(
                                                        notification.created_at
                                                    )}
                                                </td>

                                                <td>
                                                    <div className="admin-notification-actions">
                                                        <button
                                                            className="admin-notification-view-button"
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedNotification(
                                                                    notification
                                                                );
                                                            }}
                                                        >
                                                            View
                                                        </button>

                                                        <button
                                                            className="admin-notification-delete-button"
                                                            type="button"
                                                            onClick={() => {
                                                                deleteNotification(
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
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>

            {showCreateModal && (
                <div
                    className="admin-notification-modal-backdrop"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeCreateModal();
                        }
                    }}
                >
                    <section
                        className="admin-notification-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="admin-notification-create-title"
                    >
                        <div className="admin-notification-modal-heading">
                            <div>
                                <span>
                                    Notification delivery
                                </span>

                                <h2 id="admin-notification-create-title">
                                    Send notification
                                </h2>

                                <p>
                                    Send a direct message or broadcast
                                    an update to all customers.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeCreateModal
                                }
                                disabled={saving}
                                aria-label="Close notification form"
                            >
                                ×
                            </button>
                        </div>

                        {error && (
                            <div
                                className="error-message admin-notification-modal-alert"
                                role="alert"
                            >
                                <span>⚠</span>
                                {error}
                            </div>
                        )}

                        <form
                            className="admin-notification-form"
                            onSubmit={
                                createNotification
                            }
                        >
                            <label className="admin-notification-broadcast-option">
                                <input
                                    type="checkbox"
                                    name="broadcast"
                                    checked={
                                        formData.broadcast
                                    }
                                    onChange={
                                        handleFormChange
                                    }
                                />

                                <span>
                                    Broadcast to all customers
                                </span>
                            </label>

                            {!formData.broadcast && (
                                <div className="form-group admin-notification-form-full">
                                    <label
                                        className="form-label"
                                        htmlFor="admin-notification-recipient"
                                    >
                                        Recipient email
                                    </label>

                                    <input
                                        id="admin-notification-recipient"
                                        className="form-control"
                                        type="email"
                                        name="recipient_email"
                                        value={
                                            formData.recipient_email
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        placeholder="customer@example.com"
                                        required
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label
                                    className="form-label"
                                    htmlFor="admin-notification-title"
                                >
                                    Title
                                </label>

                                <input
                                    id="admin-notification-title"
                                    className="form-control"
                                    type="text"
                                    name="title"
                                    value={
                                        formData.title
                                    }
                                    onChange={
                                        handleFormChange
                                    }
                                    placeholder="Enter notification title"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label
                                    className="form-label"
                                    htmlFor="admin-notification-type"
                                >
                                    Type
                                </label>

                                <select
                                    id="admin-notification-type"
                                    className="form-control"
                                    name="type"
                                    value={
                                        formData.type
                                    }
                                    onChange={
                                        handleFormChange
                                    }
                                >
                                    {NOTIFICATION_TYPES.map(
                                        (type) => (
                                            <option
                                                key={
                                                    type
                                                }
                                                value={
                                                    type
                                                }
                                            >
                                                {
                                                    type
                                                }
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            <div className="form-group admin-notification-form-full">
                                <label
                                    className="form-label"
                                    htmlFor="admin-notification-message"
                                >
                                    Message
                                </label>

                                <textarea
                                    id="admin-notification-message"
                                    className="form-control admin-notification-message-input"
                                    name="message"
                                    value={
                                        formData.message
                                    }
                                    onChange={
                                        handleFormChange
                                    }
                                    placeholder="Write the notification message"
                                    rows="6"
                                    required
                                />
                            </div>

                            <div className="admin-notification-form-actions">
                                <button
                                    className="secondary-button"
                                    type="button"
                                    onClick={
                                        closeCreateModal
                                    }
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    className="primary-button"
                                    type="submit"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Sending..."
                                        : formData.broadcast
                                          ? "Send broadcast"
                                          : "Send notification"}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}

            {selectedNotification && (
                <div
                    className="admin-notification-modal-backdrop"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            setSelectedNotification(
                                null
                            );
                        }
                    }}
                >
                    <section
                        className="admin-notification-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="admin-notification-details-title"
                    >
                        <div className="admin-notification-modal-heading">
                            <div>
                                <span>
                                    Notification details
                                </span>

                                <h2 id="admin-notification-details-title">
                                    {selectedNotification.title ||
                                        "Notification"}
                                </h2>

                                <p>
                                    Notification #
                                    {
                                        selectedNotification.id
                                    }
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedNotification(
                                        null
                                    );
                                }}
                                aria-label="Close notification details"
                            >
                                ×
                            </button>
                        </div>

                        <div className="admin-notification-details-grid">
                            <article>
                                <span>Recipient</span>

                                <strong>
                                    {getRecipient(
                                        selectedNotification
                                    )}
                                </strong>
                            </article>

                            <article>
                                <span>Type</span>

                                <strong>
                                    {getNotificationType(
                                        selectedNotification
                                    )}
                                </strong>
                            </article>

                            <article>
                                <span>Read status</span>

                                <strong>
                                    {getReadStatus(
                                        selectedNotification
                                    )
                                        ? "Read"
                                        : "Unread"}
                                </strong>
                            </article>

                            <article>
                                <span>Created</span>

                                <strong>
                                    {formatDate(
                                        selectedNotification.created_at
                                    )}
                                </strong>
                            </article>
                        </div>

                        <div className="admin-notification-message-card">
                            <span>Message</span>

                            <p>
                                {selectedNotification.message ||
                                    "No message available."}
                            </p>
                        </div>

                        <div className="admin-notification-form-actions">
                            <button
                                className="secondary-button"
                                type="button"
                                onClick={() => {
                                    setSelectedNotification(
                                        null
                                    );
                                }}
                            >
                                Close
                            </button>

                            <button
                                className="admin-notification-delete-button"
                                type="button"
                                onClick={() => {
                                    deleteNotification(
                                        selectedNotification
                                    );
                                }}
                                disabled={
                                    deletingNotificationId ===
                                    selectedNotification.id
                                }
                            >
                                {deletingNotificationId ===
                                selectedNotification.id
                                    ? "Deleting..."
                                    : "Delete notification"}
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
};


export default AdminNotifications;