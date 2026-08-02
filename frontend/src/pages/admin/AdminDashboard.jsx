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
    notificationAPI,
    orderAPI,
    productAPI
} from "../../api/axiosConfig";

import { useAuth } from "../../context/AuthContext";


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


const getErrorMessage = (
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


const extractArray = (responseData) => {
    if (Array.isArray(responseData)) {
        return responseData;
    }

    const possibleKeys = [
        "items",
        "products",
        "orders",
        "notifications",
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


const AdminDashboard = () => {
    const navigate = useNavigate();

    const {
        user,
        logout
    } = useAuth();

    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [notifications, setNotifications] =
        useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] = useState("");
    const [serviceWarnings, setServiceWarnings] =
        useState([]);


    const adminEmail =
        user?.sub ||
        user?.email ||
        "Administrator";


    const loadDashboardData = useCallback(
        async (refresh = false) => {
            if (refresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");
            setServiceWarnings([]);

            const results = await Promise.allSettled([
                productAPI.get("/"),
                orderAPI.get("/admin/all"),
                notificationAPI.get("/admin/all")
            ]);

            const warnings = [];

            if (results[0].status === "fulfilled") {
                setProducts(
                    extractArray(
                        results[0].value.data
                    )
                );
            } else {
                setProducts([]);

                warnings.push(
                    "Product statistics could not be loaded."
                );
            }

            if (results[1].status === "fulfilled") {
                setOrders(
                    extractArray(
                        results[1].value.data
                    )
                );
            } else {
                setOrders([]);

                warnings.push(
                    getErrorMessage(
                        results[1].reason,
                        "Unable to load orders."
                    )
                );
            }

            if (results[2].status === "fulfilled") {
                setNotifications(
                    extractArray(
                        results[2].value.data
                    )
                );
            } else {
                setNotifications([]);

                warnings.push(
                    getErrorMessage(
                        results[2].reason,
                        "Unable to load notifications."
                    )
                );
            }

            setServiceWarnings(warnings);

            if (results.every(
                (result) =>
                    result.status === "rejected"
            )) {
                setError(
                    "The dashboard could not connect to the backend services."
                );
            }

            setLoading(false);
            setRefreshing(false);
        },
        []
    );


    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);


    const statistics = useMemo(() => {
        const totalStock = products.reduce(
            (total, product) =>
                total +
                Number(product.stock || 0),
            0
        );

        const lowStockProducts = products.filter(
            (product) =>
                Number(product.stock || 0) > 0 &&
                Number(product.stock || 0) <= 5
        ).length;

        const outOfStockProducts = products.filter(
            (product) =>
                Number(product.stock || 0) <= 0
        ).length;

        const pendingOrders = orders.filter(
            (order) =>
                [
                    "Pending",
                    "Confirmed",
                    "Processing"
                ].includes(order.status)
        ).length;

        const shippedOrders = orders.filter(
            (order) =>
                order.status === "Shipped"
        ).length;

        const deliveredOrders = orders.filter(
            (order) =>
                order.status === "Delivered"
        ).length;

        const cancelledOrders = orders.filter(
            (order) =>
                order.status === "Cancelled"
        ).length;

        const unreadNotifications =
            notifications.filter(
                (notification) =>
                    notification.is_read === false
            ).length;

        const totalRevenue = orders
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
            products: products.length,
            totalStock,
            lowStockProducts,
            outOfStockProducts,
            orders: orders.length,
            pendingOrders,
            shippedOrders,
            deliveredOrders,
            cancelledOrders,
            notifications:
                notifications.length,
            unreadNotifications,
            totalRevenue
        };
    }, [
        products,
        orders,
        notifications
    ]);


    const recentOrders = useMemo(() => {
        return [...orders]
            .sort(
                (firstOrder, secondOrder) =>
                    new Date(
                        secondOrder.created_at || 0
                    ).getTime() -
                    new Date(
                        firstOrder.created_at || 0
                    ).getTime()
            )
            .slice(0, 6);
    }, [orders]);


    const lowStockItems = useMemo(() => {
        return products
            .filter(
                (product) =>
                    Number(product.stock || 0) <= 5
            )
            .sort(
                (firstProduct, secondProduct) =>
                    Number(firstProduct.stock || 0) -
                    Number(secondProduct.stock || 0)
            )
            .slice(0, 6);
    }, [products]);


    const recentNotifications = useMemo(() => {
        return [...notifications]
            .sort(
                (
                    firstNotification,
                    secondNotification
                ) =>
                    new Date(
                        secondNotification.created_at || 0
                    ).getTime() -
                    new Date(
                        firstNotification.created_at || 0
                    ).getTime()
            )
            .slice(0, 5);
    }, [notifications]);


    const handleLogout = () => {
        logout();
        navigate("/login");
    };


    return (
        <div className="admin-dashboard-page">
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
                        to="/"
                    >
                        <span>🏠</span>
                        Store Home
                    </Link>

                    <Link
                        className="admin-nav-link active"
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

            <main className="admin-dashboard-main">
                <header className="admin-topbar">
                    <div>
                        <p className="admin-topbar-label">
                            Administration overview
                        </p>

                        <h1>
                            Welcome back,
                            <span> Administrator</span>
                        </h1>

                        <p>
                            Monitor products, orders and notification
                            activity across SmartRetailX.
                        </p>
                    </div>

                    <div className="admin-topbar-actions">
                        <button
                            className="admin-refresh-button"
                            type="button"
                            onClick={() => {
                                loadDashboardData(true);
                            }}
                            disabled={refreshing}
                        >
                            {refreshing
                                ? "Refreshing..."
                                : "Refresh data"}
                        </button>

                        <Link
                            className="primary-button"
                            to="/admin/products"
                        >
                            Manage products
                            <span>→</span>
                        </Link>
                    </div>
                </header>

                {error && (
                    <div
                        className="error-message admin-dashboard-alert"
                        role="alert"
                    >
                        <span>⚠</span>
                        {error}
                    </div>
                )}

                {serviceWarnings.length > 0 && (
                    <div className="admin-service-warning">
                        <strong>
                            Some dashboard sections are unavailable:
                        </strong>

                        <ul>
                            {serviceWarnings.map(
                                (warning) => (
                                    <li key={warning}>
                                        {warning}
                                    </li>
                                )
                            )}
                        </ul>
                    </div>
                )}

                <section className="admin-dashboard-hero">
                    <div className="admin-dashboard-hero-content">
                        <span>
                            Connected microservice administration
                        </span>

                        <h2>
                            One dashboard for your complete retail
                            operation.
                        </h2>

                        <p>
                            View live product inventory, order progress,
                            revenue estimates and notification activity.
                        </p>

                        <div className="admin-dashboard-hero-actions">
                            <Link to="/admin/orders">
                                Review orders
                            </Link>

                            <Link to="/admin/notifications">
                                Open notifications
                            </Link>
                        </div>
                    </div>

                    <div className="admin-dashboard-hero-visual">
                        <div>
                            ⚙️
                        </div>

                        <strong>
                            {loading
                                ? "..."
                                : statistics.orders}
                        </strong>

                        <span>
                            Total orders
                        </span>
                    </div>
                </section>

                <section className="admin-stat-grid">
                    <article className="admin-stat-card products">
                        <div className="admin-stat-icon">
                            🛍️
                        </div>

                        <div>
                            <span>
                                Products
                            </span>

                            <strong>
                                {loading
                                    ? "..."
                                    : statistics.products}
                            </strong>

                            <small>
                                {statistics.totalStock} units in stock
                            </small>
                        </div>
                    </article>

                    <article className="admin-stat-card orders">
                        <div className="admin-stat-icon">
                            📦
                        </div>

                        <div>
                            <span>
                                Total orders
                            </span>

                            <strong>
                                {loading
                                    ? "..."
                                    : statistics.orders}
                            </strong>

                            <small>
                                {statistics.pendingOrders} active
                            </small>
                        </div>
                    </article>

                    <article className="admin-stat-card revenue">
                        <div className="admin-stat-icon">
                            💰
                        </div>

                        <div>
                            <span>
                                Estimated revenue
                            </span>

                            <strong>
                                {loading
                                    ? "..."
                                    : `LKR ${formatPrice(
                                        statistics.totalRevenue
                                    )}`}
                            </strong>

                            <small>
                                Excluding cancelled orders
                            </small>
                        </div>
                    </article>

                    <article className="admin-stat-card notifications">
                        <div className="admin-stat-icon">
                            🔔
                        </div>

                        <div>
                            <span>
                                Notifications
                            </span>

                            <strong>
                                {loading
                                    ? "..."
                                    : statistics.notifications}
                            </strong>

                            <small>
                                {statistics.unreadNotifications} unread
                            </small>
                        </div>
                    </article>
                </section>

                <section className="admin-secondary-stat-grid">
                    <article>
                        <span>Pending</span>
                        <strong>
                            {loading
                                ? "..."
                                : statistics.pendingOrders}
                        </strong>
                    </article>

                    <article>
                        <span>Shipped</span>
                        <strong>
                            {loading
                                ? "..."
                                : statistics.shippedOrders}
                        </strong>
                    </article>

                    <article>
                        <span>Delivered</span>
                        <strong>
                            {loading
                                ? "..."
                                : statistics.deliveredOrders}
                        </strong>
                    </article>

                    <article>
                        <span>Cancelled</span>
                        <strong>
                            {loading
                                ? "..."
                                : statistics.cancelledOrders}
                        </strong>
                    </article>

                    <article>
                        <span>Low stock</span>
                        <strong>
                            {loading
                                ? "..."
                                : statistics.lowStockProducts}
                        </strong>
                    </article>

                    <article>
                        <span>Out of stock</span>
                        <strong>
                            {loading
                                ? "..."
                                : statistics.outOfStockProducts}
                        </strong>
                    </article>
                </section>

                <section className="admin-dashboard-content-grid">
                    <div className="admin-dashboard-panel admin-recent-orders-panel">
                        <div className="admin-panel-heading">
                            <div>
                                <span>
                                    Latest activity
                                </span>

                                <h2>
                                    Recent orders
                                </h2>
                            </div>

                            <Link to="/admin/orders">
                                View all →
                            </Link>
                        </div>

                        {loading ? (
                            <div className="admin-panel-loading">
                                Loading recent orders...
                            </div>
                        ) : recentOrders.length === 0 ? (
                            <div className="admin-panel-empty">
                                <div>📦</div>
                                <h3>No orders available</h3>
                                <p>
                                    New customer orders will appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="admin-orders-table-wrapper">
                                <table className="admin-orders-table">
                                    <thead>
                                        <tr>
                                            <th>Order</th>
                                            <th>Customer</th>
                                            <th>Product</th>
                                            <th>Total</th>
                                            <th>Status</th>
                                            <th>Created</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {recentOrders.map(
                                            (order) => (
                                                <tr key={order.id}>
                                                    <td>
                                                        #{order.id}
                                                    </td>

                                                    <td>
                                                        {order.customer_email ||
                                                            order.user_email ||
                                                            order.email ||
                                                            "Customer"}
                                                    </td>

                                                    <td>
                                                        <strong>
                                                            {order.product_name ||
                                                                `Product #${order.product_id}`}
                                                        </strong>
                                                    </td>

                                                    <td>
                                                        LKR{" "}
                                                        {formatPrice(
                                                            order.total_price
                                                        )}
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={
                                                                `order-status-badge ` +
                                                                `status-${String(
                                                                    order.status ||
                                                                    "pending"
                                                                ).toLowerCase()}`
                                                            }
                                                        >
                                                            {order.status ||
                                                                "Pending"}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        {formatDate(
                                                            order.created_at
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="admin-dashboard-side-column">
                        <section className="admin-dashboard-panel">
                            <div className="admin-panel-heading">
                                <div>
                                    <span>
                                        Inventory warning
                                    </span>

                                    <h2>
                                        Low-stock products
                                    </h2>
                                </div>

                                <Link to="/admin/products">
                                    Manage →
                                </Link>
                            </div>

                            {loading ? (
                                <div className="admin-panel-loading">
                                    Loading inventory...
                                </div>
                            ) : lowStockItems.length === 0 ? (
                                <div className="admin-panel-empty compact">
                                    <div>✓</div>
                                    <h3>Stock levels are healthy</h3>
                                </div>
                            ) : (
                                <div className="admin-low-stock-list">
                                    {lowStockItems.map(
                                        (product) => (
                                            <article key={product.id}>
                                                <div>
                                                    {product.category
                                                        ?.charAt(0)
                                                        .toUpperCase() ||
                                                        "P"}
                                                </div>

                                                <span>
                                                    <strong>
                                                        {product.name}
                                                    </strong>

                                                    <small>
                                                        {product.category}
                                                    </small>
                                                </span>

                                                <b
                                                    className={
                                                        Number(
                                                            product.stock
                                                        ) <= 0
                                                            ? "out"
                                                            : "low"
                                                    }
                                                >
                                                    {product.stock}
                                                </b>
                                            </article>
                                        )
                                    )}
                                </div>
                            )}
                        </section>

                        <section className="admin-dashboard-panel">
                            <div className="admin-panel-heading">
                                <div>
                                    <span>
                                        Communication
                                    </span>

                                    <h2>
                                        Recent notifications
                                    </h2>
                                </div>

                                <Link to="/admin/notifications">
                                    View →
                                </Link>
                            </div>

                            {loading ? (
                                <div className="admin-panel-loading">
                                    Loading notifications...
                                </div>
                            ) : recentNotifications.length === 0 ? (
                                <div className="admin-panel-empty compact">
                                    <div>🔔</div>
                                    <h3>No notifications available</h3>
                                </div>
                            ) : (
                                <div className="admin-notification-list">
                                    {recentNotifications.map(
                                        (notification) => (
                                            <article
                                                key={notification.id}
                                            >
                                                <div>
                                                    🔔
                                                </div>

                                                <span>
                                                    <strong>
                                                        {notification.title ||
                                                            "Notification"}
                                                    </strong>

                                                    <p>
                                                        {notification.message ||
                                                            "No message available."}
                                                    </p>

                                                    <small>
                                                        {formatDate(
                                                            notification.created_at
                                                        )}
                                                    </small>
                                                </span>
                                            </article>
                                        )
                                    )}
                                </div>
                            )}
                        </section>
                    </div>
                </section>

                <section className="admin-quick-actions">
                    <div className="admin-panel-heading">
                        <div>
                            <span>
                                Administration shortcuts
                            </span>

                            <h2>
                                Quick actions
                            </h2>
                        </div>
                    </div>

                    <div className="admin-quick-action-grid">
                        <Link to="/admin/products">
                            <div>＋</div>
                            <strong>Manage products</strong>
                            <span>
                                Create, update and remove catalogue items.
                            </span>
                        </Link>

                        <Link to="/admin/orders">
                            <div>📦</div>
                            <strong>Process orders</strong>
                            <span>
                                Review orders and update their status.
                            </span>
                        </Link>

                        <Link to="/admin/notifications">
                            <div>🔔</div>
                            <strong>Manage notifications</strong>
                            <span>
                                Review communication activity.
                            </span>
                        </Link>

                        <Link to="/admin/users">
                            <div>👥</div>
                            <strong>Review users</strong>
                            <span>
                                View customer and administrator accounts.
                            </span>
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    );
};


export default AdminDashboard;