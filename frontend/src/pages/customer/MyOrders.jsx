import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { orderAPI, productAPI } from "../../api/axiosConfig";
import { useAuth } from "../../context/AuthContext";


const STATUS_OPTIONS = [
    "All",
    "Pending",
    "Confirmed",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled"
];


const MyOrders = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [orders, setOrders] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");

    const [loading, setLoading] = useState(true);
    const [cancellingOrderId, setCancellingOrderId] =
        useState(null);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");


    const customerEmail =
        user?.sub ||
        user?.email ||
        "Customer";


    const loadOrders = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await orderAPI.get(
                "/my-orders"
            );

            const orderRecords =
                Array.isArray(response.data)
                    ? response.data
                    : [];

            const productIds = [
                ...new Set(
                    orderRecords
                        .map((order) => order.product_id)
                        .filter(Boolean)
                )
            ];

            const productResults =
                await Promise.allSettled(
                    productIds.map((productId) =>
                        productAPI.get(`/${productId}`)
                    )
                );

            const productImageMap = new Map();

            productResults.forEach((result) => {
                if (
                    result.status === "fulfilled" &&
                    result.value?.data?.id
                ) {
                    productImageMap.set(
                        result.value.data.id,
                        result.value.data.image_url || ""
                    );
                }
            });

            setOrders(
                orderRecords.map((order) => ({
                    ...order,
                    image_url:
                        order.image_url ||
                        productImageMap.get(order.product_id) ||
                        ""
                }))
            );
        } catch (requestError) {
            const detail =
                requestError.response?.data?.detail;

            setError(
                typeof detail === "string"
                    ? detail
                    : "Unable to load your orders."
            );
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        loadOrders();
    }, []);


    const filteredOrders = useMemo(() => {
        const normalizedSearch =
            searchTerm.trim().toLowerCase();

        return orders.filter((order) => {
            const matchesStatus =
                selectedStatus === "All" ||
                order.status === selectedStatus;

            const matchesSearch =
                !normalizedSearch ||
                String(order.id).includes(
                    normalizedSearch
                ) ||
                order.product_name
                    ?.toLowerCase()
                    .includes(normalizedSearch) ||
                order.status
                    ?.toLowerCase()
                    .includes(normalizedSearch);

            return matchesStatus && matchesSearch;
        });
    }, [
        orders,
        selectedStatus,
        searchTerm
    ]);


    const orderStatistics = useMemo(() => {
        return {
            total: orders.length,

            active: orders.filter((order) =>
                [
                    "Pending",
                    "Confirmed",
                    "Processing",
                    "Shipped"
                ].includes(order.status)
            ).length,

            delivered: orders.filter(
                (order) =>
                    order.status === "Delivered"
            ).length,

            cancelled: orders.filter(
                (order) =>
                    order.status === "Cancelled"
            ).length
        };
    }, [orders]);


    const handleLogout = () => {
        logout();
        navigate("/login");
    };


    const handleCancelOrder = async (order) => {
        const canCancel = ![
            "Cancelled",
            "Delivered"
        ].includes(order.status);

        if (!canCancel) {
            setError(
                `A ${order.status.toLowerCase()} order cannot be cancelled.`
            );
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to cancel order #${order.id}?`
        );

        if (!confirmed) {
            return;
        }

        setCancellingOrderId(order.id);
        setError("");
        setSuccess("");

        try {
            const response = await orderAPI.put(
                `/${order.id}/cancel`
            );

            setSuccess(
                response.data?.message ||
                `Order #${order.id} was cancelled successfully.`
            );

            await loadOrders();
        } catch (requestError) {
            const detail =
                requestError.response?.data?.detail;

            setError(
                typeof detail === "string"
                    ? detail
                    : "Unable to cancel this order."
            );
        } finally {
            setCancellingOrderId(null);
        }
    };


    const clearFilters = () => {
        setSearchTerm("");
        setSelectedStatus("All");
    };


    const getStatusClass = (status) => {
        return `order-status-badge status-${status
            ?.toLowerCase()
            .replaceAll(" ", "-")}`;
    };


    const formatDate = (dateValue) => {
        if (!dateValue) {
            return "Not available";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "Not available";
        }

        return date.toLocaleString();
    };


    return (
        <div className="my-orders-page">
            <aside className="customer-sidebar my-orders-sidebar">
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
                        to="/"
                    >
                        <span>🏠</span>
                        Store Home
                    </Link>

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
                        className="customer-nav-link active"
                        to="/customer/orders"
                    >
                        <span>📦</span>
                        My Orders
                    </Link>

                    <Link
                        className="customer-nav-link"
                        to="/customer/notifications"
                    >
                        <span>🔔</span>
                        Notifications
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

            <main className="my-orders-main">
                <header className="my-orders-header">
                    <div>
                        <p className="customer-topbar-label">
                            Order management
                        </p>

                        <h1>
                            Track your
                            <span> orders</span>
                        </h1>

                        <p>
                            Review order details, monitor progress
                            and cancel eligible orders.
                        </p>
                    </div>

                    <Link
                        className="primary-button"
                        to="/customer/products"
                    >
                        Shop products
                        <span>→</span>
                    </Link>
                </header>

                <section className="my-orders-hero">
                    <div>
                        <span className="customer-hero-chip">
                            Connected order tracking
                        </span>

                        <h2>
                            Every purchase, status update and
                            notification in one place.
                        </h2>

                        <p>
                            SmartRetailX connects the Order,
                            Product and Notification services to
                            keep your shopping activity updated.
                        </p>
                    </div>

                    <div className="my-orders-hero-visual">
                        <span>📦</span>

                        <strong>
                            {loading
                                ? "..."
                                : orderStatistics.total}
                        </strong>

                        <small>
                            Total orders
                        </small>
                    </div>
                </section>

                <section className="my-orders-stat-grid">
                    <article className="my-orders-stat-card">
                        <div className="my-orders-stat-icon total">
                            📋
                        </div>

                        <div>
                            <span>
                                Total orders
                            </span>

                            <strong>
                                {loading
                                    ? "..."
                                    : orderStatistics.total}
                            </strong>
                        </div>
                    </article>

                    <article className="my-orders-stat-card">
                        <div className="my-orders-stat-icon active">
                            ⏳
                        </div>

                        <div>
                            <span>
                                Active orders
                            </span>

                            <strong>
                                {loading
                                    ? "..."
                                    : orderStatistics.active}
                            </strong>
                        </div>
                    </article>

                    <article className="my-orders-stat-card">
                        <div className="my-orders-stat-icon delivered">
                            ✓
                        </div>

                        <div>
                            <span>
                                Delivered
                            </span>

                            <strong>
                                {loading
                                    ? "..."
                                    : orderStatistics.delivered}
                            </strong>
                        </div>
                    </article>

                    <article className="my-orders-stat-card">
                        <div className="my-orders-stat-icon cancelled">
                            ×
                        </div>

                        <div>
                            <span>
                                Cancelled
                            </span>

                            <strong>
                                {loading
                                    ? "..."
                                    : orderStatistics.cancelled}
                            </strong>
                        </div>
                    </article>
                </section>

                {error && (
                    <div
                        className="error-message my-orders-alert"
                        role="alert"
                    >
                        <span>⚠</span>
                        {error}
                    </div>
                )}

                {success && (
                    <div
                        className="success-message my-orders-alert"
                        role="status"
                    >
                        <span>✓</span>
                        {success}
                    </div>
                )}

                <section className="my-orders-filter-panel">
                    <div className="my-orders-search-group">
                        <label htmlFor="order-search">
                            Search orders
                        </label>

                        <div className="my-orders-search-wrapper">
                            <span>⌕</span>

                            <input
                                id="order-search"
                                type="search"
                                value={searchTerm}
                                onChange={(event) => {
                                    setSearchTerm(
                                        event.target.value
                                    );
                                }}
                                placeholder="Search by order ID, product or status"
                            />
                        </div>
                    </div>

                    <div className="my-orders-status-filter">
                        <label htmlFor="order-status">
                            Order status
                        </label>

                        <select
                            id="order-status"
                            value={selectedStatus}
                            onChange={(event) => {
                                setSelectedStatus(
                                    event.target.value
                                );
                            }}
                        >
                            {STATUS_OPTIONS.map((status) => (
                                <option
                                    value={status}
                                    key={status}
                                >
                                    {status}
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

                    <button
                        className="my-orders-refresh-button"
                        type="button"
                        onClick={loadOrders}
                        disabled={loading}
                    >
                        {loading
                            ? "Refreshing..."
                            : "Refresh orders"}
                    </button>
                </section>

                <section className="my-orders-content">
                    <div className="my-orders-section-heading">
                        <div>
                            <span>
                                Purchase history
                            </span>

                            <h2>
                                {loading
                                    ? "Loading orders"
                                    : `${filteredOrders.length} order${filteredOrders.length === 1
                                        ? ""
                                        : "s"
                                    } found`}
                            </h2>
                        </div>

                        <p>
                            Orders are displayed with the most recent
                            activity available from your account.
                        </p>
                    </div>

                    {loading ? (
                        <div className="my-orders-loading-list">
                            {[1, 2, 3].map((item) => (
                                <div
                                    className="my-orders-skeleton"
                                    key={item}
                                />
                            ))}
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="my-orders-empty-state">
                            <div>📦</div>

                            <h3>
                                No matching orders
                            </h3>

                            <p>
                                Place a new order or change your
                                current search and status filters.
                            </p>

                            <Link
                                className="primary-button"
                                to="/customer/products"
                            >
                                Browse products
                            </Link>
                        </div>
                    ) : (
                        <div className="my-orders-list">
                            {filteredOrders.map((order) => {
                                const canCancel = ![
                                    "Cancelled",
                                    "Delivered"
                                ].includes(order.status);

                                return (
                                    <article
                                        className="my-order-card"
                                        key={order.id}
                                    >
                                        <div className="my-order-card-header">
                                            <div className="my-order-reference">
                                                <div>
                                                    📦
                                                </div>

                                                <span>
                                                    <small>
                                                        Order reference
                                                    </small>

                                                    <strong>
                                                        #{order.id}
                                                    </strong>
                                                </span>
                                            </div>

                                            <span
                                                className={getStatusClass(
                                                    order.status
                                                )}
                                            >
                                                {order.status}
                                            </span>
                                        </div>

                                        <div className="my-order-product">
                                            <div className="my-order-product-icon">
                                                {order.image_url ? (
                                                    <>
                                                        <img
                                                            className="my-order-product-image"
                                                            src={order.image_url}
                                                            alt={order.product_name}
                                                            loading="lazy"
                                                            onError={(event) => {
                                                                event.currentTarget.style.display =
                                                                    "none";

                                                                const fallback =
                                                                    event.currentTarget
                                                                        .nextElementSibling;

                                                                if (fallback) {
                                                                    fallback.style.display =
                                                                        "grid";
                                                                }
                                                            }}
                                                        />

                                                        <span
                                                            className="my-order-product-image-fallback"
                                                            style={{ display: "none" }}
                                                        >
                                                            {order.product_name
                                                                ?.charAt(0)
                                                                .toUpperCase() || "P"}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="my-order-product-image-fallback">
                                                        {order.product_name
                                                            ?.charAt(0)
                                                            .toUpperCase() || "P"}
                                                    </span>
                                                )}
                                            </div>

                                            <div>
                                                <span>
                                                    Product
                                                </span>

                                                <h3>
                                                    {order.product_name}
                                                </h3>

                                                <p>
                                                    Product ID:{" "}
                                                    {order.product_id}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="my-order-details-grid">
                                            <div>
                                                <span>
                                                    Quantity
                                                </span>

                                                <strong>
                                                    {order.quantity}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Unit price
                                                </span>

                                                <strong>
                                                    LKR{" "}
                                                    {Number(
                                                        order.unit_price
                                                    ).toLocaleString()}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Total price
                                                </span>

                                                <strong>
                                                    LKR{" "}
                                                    {Number(
                                                        order.total_price
                                                    ).toLocaleString()}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Created
                                                </span>

                                                <strong>
                                                    {formatDate(
                                                        order.created_at
                                                    )}
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="my-order-progress">
                                            <div className="my-order-progress-line">
                                                {[
                                                    "Pending",
                                                    "Confirmed",
                                                    "Processing",
                                                    "Shipped",
                                                    "Delivered"
                                                ].map(
                                                    (
                                                        status,
                                                        index
                                                    ) => {
                                                        const statusOrder = [
                                                            "Pending",
                                                            "Confirmed",
                                                            "Processing",
                                                            "Shipped",
                                                            "Delivered"
                                                        ];

                                                        const currentIndex =
                                                            statusOrder.indexOf(
                                                                order.status
                                                            );

                                                        const completed =
                                                            order.status !==
                                                            "Cancelled" &&
                                                            index <=
                                                            currentIndex;

                                                        return (
                                                            <div
                                                                className={
                                                                    completed
                                                                        ? "my-order-progress-step completed"
                                                                        : "my-order-progress-step"
                                                                }
                                                                key={status}
                                                            >
                                                                <span>
                                                                    {completed
                                                                        ? "✓"
                                                                        : index +
                                                                        1}
                                                                </span>

                                                                <small>
                                                                    {status}
                                                                </small>
                                                            </div>
                                                        );
                                                    }
                                                )}
                                            </div>

                                            {order.status ===
                                                "Cancelled" && (
                                                    <p className="my-order-cancelled-note">
                                                        This order has been
                                                        cancelled.
                                                    </p>
                                                )}
                                        </div>

                                        <div className="my-order-card-footer">
                                            <Link
                                                className="my-order-shop-link"
                                                to={
                                                    `/customer/products/` +
                                                    `${order.product_id}`
                                                }
                                            >
                                                View product
                                            </Link>

                                            <button
                                                className={
                                                    canCancel
                                                        ? "my-order-cancel-button"
                                                        : "my-order-cancel-button disabled"
                                                }
                                                type="button"
                                                onClick={() => {
                                                    handleCancelOrder(
                                                        order
                                                    );
                                                }}
                                                disabled={
                                                    !canCancel ||
                                                    cancellingOrderId ===
                                                    order.id
                                                }
                                            >
                                                {cancellingOrderId ===
                                                    order.id
                                                    ? "Cancelling..."
                                                    : canCancel
                                                        ? "Cancel order"
                                                        : order.status ===
                                                            "Delivered"
                                                            ? "Delivered"
                                                            : "Cancelled"}
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};


export default MyOrders;