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
    orderAPI
} from "../../api/axiosConfig";

import { useAuth } from "../../context/AuthContext";


const ORDER_STATUSES = [
    "Pending",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled"
];


const formatPrice = (value) => {
    return Number(value || 0).toLocaleString(
        "en-LK",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
};


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


const extractOrders = (responseData) => {
    if (Array.isArray(responseData)) {
        return responseData;
    }

    const possibleKeys = [
        "orders",
        "items",
        "data",
        "results"
    ];

    for (const key of possibleKeys) {
        if (Array.isArray(responseData?.[key])) {
            return responseData[key];
        }
    }

    return [];
};



const AdminOrders = () => {
    const navigate = useNavigate();

    const {
        user,
        logout
    } = useAuth();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] =
        useState(false);

    const [searchTerm, setSearchTerm] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState("All");

    const [sortOption, setSortOption] =
        useState("newest");

    const [selectedOrder, setSelectedOrder] =
        useState(null);

    const [updatingOrderId, setUpdatingOrderId] =
        useState(null);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");


    const adminEmail =
        user?.sub ||
        user?.email ||
        "Administrator";


    const loadOrders = useCallback(
        async (showRefreshState = false) => {
            if (showRefreshState) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            try {
                const response =
                    await orderAPI.get(
                        "/admin/all"
                    );

                setOrders(
                    extractOrders(
                        response.data
                    )
                );
            } catch (requestError) {
                setError(
                    getBackendError(
                        requestError,
                        "Unable to load orders."
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
        loadOrders();
    }, [loadOrders]);


    const statistics = useMemo(() => {
        const pending = orders.filter(
            (order) =>
                order.status === "Pending"
        ).length;

        const processing = orders.filter(
            (order) =>
                order.status === "Processing"
        ).length;

        const shipped = orders.filter(
            (order) =>
                order.status === "Shipped"
        ).length;

        const delivered = orders.filter(
            (order) =>
                order.status === "Delivered"
        ).length;

        const cancelled = orders.filter(
            (order) =>
                order.status === "Cancelled"
        ).length;

        const revenue = orders
            .filter(
                (order) =>
                    order.status !== "Cancelled"
            )
            .reduce(
                (total, order) =>
                    total +
                    Number(
                        order.total_price || 0
                    ),
                0
            );

        return {
            total: orders.length,
            pending,
            processing,
            shipped,
            delivered,
            cancelled,
            revenue
        };
    }, [orders]);


    const filteredOrders = useMemo(() => {
        const normalizedSearch =
            searchTerm.trim().toLowerCase();

        const result = orders.filter(
            (order) => {
                const searchableValues = [
                    order.id,
                    order.customer_email,
                    order.user_email,
                    order.email,
                    order.product_name,
                    order.product_id,
                    order.status
                ]
                    .filter(
                        (value) =>
                            value !== undefined &&
                            value !== null
                    )
                    .map(
                        (value) =>
                            String(value).toLowerCase()
                    );

                const matchesSearch =
                    !normalizedSearch ||
                    searchableValues.some(
                        (value) =>
                            value.includes(
                                normalizedSearch
                            )
                    );

                const matchesStatus =
                    statusFilter === "All" ||
                    order.status ===
                        statusFilter;

                return (
                    matchesSearch &&
                    matchesStatus
                );
            }
        );

        return [...result].sort(
            (firstOrder, secondOrder) => {
                if (sortOption === "oldest") {
                    return (
                        new Date(
                            firstOrder.created_at || 0
                        ).getTime() -
                        new Date(
                            secondOrder.created_at || 0
                        ).getTime()
                    );
                }

                if (sortOption === "total-low") {
                    return (
                        Number(firstOrder.total_price || 0) -
                        Number(secondOrder.total_price || 0)
                    );
                }

                if (sortOption === "total-high") {
                    return (
                        Number(secondOrder.total_price || 0) -
                        Number(firstOrder.total_price || 0)
                    );
                }

                return (
                    new Date(
                        secondOrder.created_at || 0
                    ).getTime() -
                    new Date(
                        firstOrder.created_at || 0
                    ).getTime()
                );
            }
        );
    }, [
        orders,
        searchTerm,
        statusFilter,
        sortOption
    ]);


    const clearFilters = () => {
        setSearchTerm("");
        setStatusFilter("All");
        setSortOption("newest");
    };


    const updateOrderStatus = async (
        order,
        nextStatus
    ) => {
        if (
            !nextStatus ||
            nextStatus === order.status
        ) {
            return;
        }

        setUpdatingOrderId(order.id);
        setError("");
        setSuccess("");

        try {
            const response =
                await orderAPI.put(
                    `/admin/${order.id}/status`,
                    {
                        status: nextStatus
                    }
                );

            const updatedOrder =
                response.data?.order ||
                response.data;

            setOrders(
                (currentOrders) =>
                    currentOrders.map(
                        (currentOrder) =>
                            currentOrder.id ===
                            order.id
                                ? {
                                      ...currentOrder,
                                      ...updatedOrder,
                                      status:
                                          updatedOrder?.status ||
                                          nextStatus
                                  }
                                : currentOrder
                    )
            );

            setSelectedOrder(
                (currentOrder) =>
                    currentOrder?.id ===
                    order.id
                        ? {
                              ...currentOrder,
                              ...updatedOrder,
                              status:
                                  updatedOrder?.status ||
                                  nextStatus
                          }
                        : currentOrder
            );

            setSuccess(
                `Order #${order.id} was updated to ${nextStatus}.`
            );
        } catch (requestError) {
            setError(
                getBackendError(
                    requestError,
                    "Unable to update the order status."
                )
            );
        } finally {
            setUpdatingOrderId(null);
        }
    };


    const handleLogout = () => {
        logout();
        navigate("/login");
    };


    return (
        <div className="admin-orders-page">
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
                        className="admin-nav-link active"
                        to="/admin/orders"
                    >
                        <span>📦</span>
                        Orders
                    </Link>

                    <Link
                        className="admin-nav-link"
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

            <main className="admin-orders-main">
                <header className="admin-orders-topbar">
                    <div>
                        <p className="admin-topbar-label">
                            Order administration
                        </p>

                        <h1>
                            Order
                            <span> management</span>
                        </h1>

                        <p>
                            Review customer orders, track fulfilment
                            progress and update order statuses.
                        </p>
                    </div>

                    <button
                        className="admin-refresh-button"
                        type="button"
                        onClick={() => {
                            loadOrders(true);
                        }}
                        disabled={refreshing}
                    >
                        {refreshing
                            ? "Refreshing..."
                            : "Refresh orders"}
                    </button>
                </header>

                {error && (
                    <div
                        className="error-message admin-orders-alert"
                        role="alert"
                    >
                        <span>⚠</span>
                        {error}
                    </div>
                )}

                {success && (
                    <div
                        className="success-message admin-orders-alert"
                        role="status"
                    >
                        <span>✓</span>
                        {success}
                    </div>
                )}

                <section className="admin-orders-hero">
                    <div>
                        <span>
                            Connected Order Service
                        </span>

                        <h2>
                            Manage every order from placement to
                            delivery.
                        </h2>

                        <p>
                            Search orders, inspect customer and product
                            information, and keep fulfilment statuses
                            accurate.
                        </p>
                    </div>

                    <div className="admin-orders-hero-visual">
                        <span>📦</span>

                        <strong>
                            {loading
                                ? "..."
                                : statistics.total}
                        </strong>

                        <small>
                            Total orders
                        </small>
                    </div>
                </section>

                <section className="admin-orders-stat-grid">
                    <article>
                        <span>Total</span>
                        <strong>
                            {loading
                                ? "..."
                                : statistics.total}
                        </strong>
                    </article>

                    <article>
                        <span>Pending</span>
                        <strong>
                            {loading
                                ? "..."
                                : statistics.pending}
                        </strong>
                    </article>

                    <article>
                        <span>Processing</span>
                        <strong>
                            {loading
                                ? "..."
                                : statistics.processing}
                        </strong>
                    </article>

                    <article>
                        <span>Shipped</span>
                        <strong>
                            {loading
                                ? "..."
                                : statistics.shipped}
                        </strong>
                    </article>

                    <article>
                        <span>Delivered</span>
                        <strong>
                            {loading
                                ? "..."
                                : statistics.delivered}
                        </strong>
                    </article>

                    <article>
                        <span>Cancelled</span>
                        <strong>
                            {loading
                                ? "..."
                                : statistics.cancelled}
                        </strong>
                    </article>

                    <article className="admin-orders-revenue-card">
                        <span>Estimated revenue</span>
                        <strong>
                            {loading
                                ? "..."
                                : `LKR ${formatPrice(
                                      statistics.revenue
                                  )}`}
                        </strong>
                    </article>
                </section>

                <section className="admin-orders-filter-panel">
                    <div className="admin-orders-search">
                        <label htmlFor="admin-order-search">
                            Search orders
                        </label>

                        <div>
                            <span>⌕</span>

                            <input
                                id="admin-order-search"
                                type="search"
                                value={searchTerm}
                                onChange={(event) => {
                                    setSearchTerm(
                                        event.target.value
                                    );
                                }}
                                placeholder="Search by order, customer, product or status"
                            />
                        </div>
                    </div>

                    <div className="admin-orders-filter">
                        <label htmlFor="admin-order-status-filter">
                            Status
                        </label>

                        <select
                            id="admin-order-status-filter"
                            value={statusFilter}
                            onChange={(event) => {
                                setStatusFilter(
                                    event.target.value
                                );
                            }}
                        >
                            <option value="All">
                                All statuses
                            </option>

                            {ORDER_STATUSES.map(
                                (status) => (
                                    <option
                                        key={status}
                                        value={status}
                                    >
                                        {status}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    <div className="admin-orders-filter">
                        <label htmlFor="admin-order-sort">
                            Sort
                        </label>

                        <select
                            id="admin-order-sort"
                            value={sortOption}
                            onChange={(event) => {
                                setSortOption(
                                    event.target.value
                                );
                            }}
                        >
                            <option value="newest">
                                Newest first
                            </option>

                            <option value="oldest">
                                Oldest first
                            </option>

                            <option value="total-high">
                                Total: high to low
                            </option>

                            <option value="total-low">
                                Total: low to high
                            </option>
                        </select>
                    </div>

                    <button
                        className="admin-orders-clear-button"
                        type="button"
                        onClick={clearFilters}
                    >
                        Clear filters
                    </button>
                </section>

                <section className="admin-orders-content">
                    <div className="admin-orders-heading">
                        <div>
                            <span>
                                Order records
                            </span>

                            <h2>
                                {loading
                                    ? "Loading orders"
                                    : `${filteredOrders.length} order${
                                          filteredOrders.length === 1
                                              ? ""
                                              : "s"
                                      } found`}
                            </h2>
                        </div>
                    </div>

                    {loading ? (
                        <div className="admin-orders-loading">
                            Loading orders...
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="admin-orders-empty">
                            <div>📦</div>

                            <h3>
                                No matching orders
                            </h3>

                            <p>
                                Change your filters or wait for new
                                customer orders.
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
                        <div className="admin-orders-table-wrapper">
                            <table className="admin-orders-management-table">
                                <thead>
                                    <tr>
                                        <th>Order</th>
                                        <th>Customer</th>
                                        <th>Product</th>
                                        <th>Quantity</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                        <th>Created</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredOrders.map(
                                        (order) => (
                                            <tr key={order.id}>
                                                <td>
                                                    <strong>
                                                        #{order.id}
                                                    </strong>
                                                </td>

                                                <td>
                                                    <span className="admin-order-customer">
                                                        {order.customer_email ||
                                                            order.user_email ||
                                                            order.email ||
                                                            `User #${order.user_id || "N/A"}`}
                                                    </span>
                                                </td>

                                                <td>
                                                    <div className="admin-order-product">
                                                        <strong>
                                                            {order.product_name ||
                                                                `Product #${order.product_id}`}
                                                        </strong>

                                                        <small>
                                                            Product ID:{" "}
                                                            {order.product_id ||
                                                                "N/A"}
                                                        </small>
                                                    </div>
                                                </td>

                                                <td>
                                                    {order.quantity || 1}
                                                </td>

                                                <td>
                                                    <strong>
                                                        LKR{" "}
                                                        {formatPrice(
                                                            order.total_price
                                                        )}
                                                    </strong>
                                                </td>

                                                <td>
                                                    <select
                                                        className={
                                                            `admin-order-status-select ` +
                                                            `status-${String(
                                                                order.status ||
                                                                    "pending"
                                                            ).toLowerCase()}`
                                                        }
                                                        value={
                                                            order.status ||
                                                            "Pending"
                                                        }
                                                        onChange={(event) => {
                                                            updateOrderStatus(
                                                                order,
                                                                event.target.value
                                                            );
                                                        }}
                                                        disabled={
                                                            updatingOrderId ===
                                                            order.id
                                                        }
                                                    >
                                                        {ORDER_STATUSES.map(
                                                            (status) => (
                                                                <option
                                                                    key={status}
                                                                    value={status}
                                                                >
                                                                    {status}
                                                                </option>
                                                            )
                                                        )}
                                                    </select>
                                                </td>

                                                <td>
                                                    {formatDate(
                                                        order.created_at
                                                    )}
                                                </td>

                                                <td>
                                                    <button
                                                        className="admin-order-view-button"
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedOrder(
                                                                order
                                                            );
                                                        }}
                                                    >
                                                        View details
                                                    </button>
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

            {selectedOrder && (
                <div
                    className="admin-order-modal-backdrop"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            setSelectedOrder(null);
                        }
                    }}
                >
                    <section
                        className="admin-order-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="admin-order-modal-title"
                    >
                        <div className="admin-order-modal-heading">
                            <div>
                                <span>
                                    Order information
                                </span>

                                <h2 id="admin-order-modal-title">
                                    Order #{selectedOrder.id}
                                </h2>

                                <p>
                                    Review the complete order record and
                                    update its fulfilment status.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedOrder(null);
                                }}
                                aria-label="Close order details"
                            >
                                ×
                            </button>
                        </div>

                        <div className="admin-order-details-grid">
                            <article>
                                <span>Customer</span>
                                <strong>
                                    {selectedOrder.customer_email ||
                                        selectedOrder.user_email ||
                                        selectedOrder.email ||
                                        `User #${selectedOrder.user_id || "N/A"}`}
                                </strong>
                            </article>

                            <article>
                                <span>Product</span>
                                <strong>
                                    {selectedOrder.product_name ||
                                        `Product #${selectedOrder.product_id}`}
                                </strong>
                            </article>

                            <article>
                                <span>Quantity</span>
                                <strong>
                                    {selectedOrder.quantity || 1}
                                </strong>
                            </article>

                            <article>
                                <span>Total amount</span>
                                <strong>
                                    LKR{" "}
                                    {formatPrice(
                                        selectedOrder.total_price
                                    )}
                                </strong>
                            </article>

                            <article>
                                <span>Current status</span>
                                <strong>
                                    {selectedOrder.status ||
                                        "Pending"}
                                </strong>
                            </article>

                            <article>
                                <span>Created</span>
                                <strong>
                                    {formatDate(
                                        selectedOrder.created_at
                                    )}
                                </strong>
                            </article>
                        </div>

                        <div className="admin-order-modal-status">
                            <label htmlFor="admin-order-modal-status">
                                Update order status
                            </label>

                            <select
                                id="admin-order-modal-status"
                                value={
                                    selectedOrder.status ||
                                    "Pending"
                                }
                                onChange={(event) => {
                                    updateOrderStatus(
                                        selectedOrder,
                                        event.target.value
                                    );
                                }}
                                disabled={
                                    updatingOrderId ===
                                    selectedOrder.id
                                }
                            >
                                {ORDER_STATUSES.map(
                                    (status) => (
                                        <option
                                            key={status}
                                            value={status}
                                        >
                                            {status}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        <div className="admin-order-modal-actions">
                            <button
                                className="secondary-button"
                                type="button"
                                onClick={() => {
                                    setSelectedOrder(null);
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
};


export default AdminOrders;