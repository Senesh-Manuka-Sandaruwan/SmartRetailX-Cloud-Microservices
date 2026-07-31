import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import {
    notificationAPI,
    orderAPI,
    productAPI
} from "../../api/axiosConfig";


const CustomerDashboard = () => {
    const navigate = useNavigate();

    const {
        user,
        logout
    } = useAuth();

    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    const customerEmail = useMemo(
        () => user?.sub || user?.email || "Customer",
        [user]
    );


    useEffect(() => {
        const loadDashboardData = async () => {
            setLoading(true);
            setError("");

            try {
                const [
                    productResponse,
                    orderResponse,
                    notificationResponse
                ] = await Promise.all([
                    productAPI.get("/"),
                    orderAPI.get("/my-orders"),
                    notificationAPI.get(
                        "/my-notifications/unread-count"
                    )
                ]);

                setProducts(
                    Array.isArray(productResponse.data)
                        ? productResponse.data
                        : []
                );

                setOrders(
                    Array.isArray(orderResponse.data)
                        ? orderResponse.data
                        : []
                );

                setUnreadCount(
                    notificationResponse.data?.unread_count ?? 0
                );
            } catch (requestError) {
                const detail =
                    requestError.response?.data?.detail;

                setError(
                    typeof detail === "string"
                        ? detail
                        : "Unable to load dashboard information."
                );
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, []);


    const handleLogout = () => {
        logout();
        navigate("/login");
    };


    const recentOrders = orders.slice(0, 4);
    const featuredProducts = products.slice(0, 4);


    const pendingOrders = orders.filter(
        (order) =>
            order.status === "Pending" ||
            order.status === "Processing" ||
            order.status === "Confirmed"
    ).length;


    return (
        <div className="customer-dashboard-page">
            <aside className="customer-sidebar">
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
                        className="customer-nav-link active"
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
                        className="customer-nav-link"
                        to="/customer/notifications"
                    >
                        <span>🔔</span>
                        Notifications

                        {unreadCount > 0 && (
                            <b className="customer-nav-badge">
                                {unreadCount}
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
                            <strong>{customerEmail}</strong>
                            <span>Customer</span>
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

            <main className="customer-dashboard-main">
                <header className="customer-topbar">
                    <div>
                        <p className="customer-topbar-label">
                            Customer dashboard
                        </p>

                        <h1>
                            Welcome back,{" "}
                            <span>
                                {customerEmail.split("@")[0]}
                            </span>
                        </h1>
                    </div>

                    <div className="customer-topbar-actions">
                        <Link
                            className="customer-icon-button"
                            to="/customer/notifications"
                        >
                            🔔

                            {unreadCount > 0 && (
                                <span>
                                    {unreadCount}
                                </span>
                            )}
                        </Link>

                        <Link
                            className="primary-button customer-shop-button"
                            to="/customer/products"
                        >
                            Browse products
                            <span>→</span>
                        </Link>
                    </div>
                </header>

                {error && (
                    <div className="error-message dashboard-error">
                        <span>⚠</span>
                        {error}
                    </div>
                )}

                <section className="customer-hero">
                    <div className="customer-hero-content">
                        <span className="customer-hero-chip">
                            Smart shopping starts here
                        </span>

                        <h2>
                            Discover products and manage every order
                            effortlessly.
                        </h2>

                        <p>
                            Browse the latest products, place secure orders
                            and receive real-time order notifications from
                            one connected dashboard.
                        </p>

                        <div className="customer-hero-actions">
                            <Link
                                className="customer-hero-primary"
                                to="/customer/products"
                            >
                                Start shopping
                                <span>→</span>
                            </Link>

                            <Link
                                className="customer-hero-secondary"
                                to="/customer/orders"
                            >
                                Track my orders
                            </Link>
                        </div>
                    </div>

                    <div className="customer-hero-visual">
                        <div className="customer-hero-ring ring-one" />
                        <div className="customer-hero-ring ring-two" />

                        <div className="customer-hero-box">
                            <span>🛍️</span>
                            <strong>SmartRetailX</strong>
                            <small>Connected retail experience</small>
                        </div>
                    </div>
                </section>

                <section className="customer-stat-grid">
                    <article className="customer-stat-card stat-products">
                        <div className="customer-stat-icon">
                            🛍️
                        </div>

                        <div>
                            <span>Available products</span>
                            <strong>
                                {loading ? "..." : products.length}
                            </strong>
                        </div>

                        <Link to="/customer/products">
                            View all
                        </Link>
                    </article>

                    <article className="customer-stat-card stat-orders">
                        <div className="customer-stat-icon">
                            📦
                        </div>

                        <div>
                            <span>Total orders</span>
                            <strong>
                                {loading ? "..." : orders.length}
                            </strong>
                        </div>

                        <Link to="/customer/orders">
                            View orders
                        </Link>
                    </article>

                    <article className="customer-stat-card stat-pending">
                        <div className="customer-stat-icon">
                            ⏳
                        </div>

                        <div>
                            <span>Active orders</span>
                            <strong>
                                {loading ? "..." : pendingOrders}
                            </strong>
                        </div>

                        <Link to="/customer/orders">
                            Track status
                        </Link>
                    </article>

                    <article className="customer-stat-card stat-alerts">
                        <div className="customer-stat-icon">
                            🔔
                        </div>

                        <div>
                            <span>Unread alerts</span>
                            <strong>
                                {loading ? "..." : unreadCount}
                            </strong>
                        </div>

                        <Link to="/customer/notifications">
                            Open alerts
                        </Link>
                    </article>
                </section>

                <section className="customer-dashboard-section">
                    <div className="customer-section-heading">
                        <div>
                            <span>Recommended for you</span>
                            <h2>Featured products</h2>
                        </div>

                        <Link to="/customer/products">
                            Browse catalogue →
                        </Link>
                    </div>

                    {loading ? (
                        <div className="customer-loading-grid">
                            {[1, 2, 3, 4].map((item) => (
                                <div
                                    className="customer-skeleton-card"
                                    key={item}
                                />
                            ))}
                        </div>
                    ) : featuredProducts.length === 0 ? (
                        <div className="customer-empty-state">
                            <div>🛍️</div>
                            <h3>No products available</h3>
                            <p>
                                Products will appear here when they are added.
                            </p>
                        </div>
                    ) : (
                        <div className="customer-product-grid">
                            {featuredProducts.map((product) => (
                                <article
                                    className="customer-product-card"
                                    key={product.id}
                                >
                                    <div className="customer-product-visual">
                                        <span>
                                            {product.category
                                                ?.charAt(0)
                                                .toUpperCase() || "P"}
                                        </span>

                                        <div className="customer-stock-badge">
                                            {product.stock > 0
                                                ? `${product.stock} in stock`
                                                : "Out of stock"}
                                        </div>
                                    </div>

                                    <div className="customer-product-body">
                                        <span className="customer-product-category">
                                            {product.category}
                                        </span>

                                        <h3>{product.name}</h3>

                                        <p>
                                            {product.description}
                                        </p>

                                        <div className="customer-product-footer">
                                            <strong>
                                                LKR{" "}
                                                {Number(
                                                    product.price
                                                ).toLocaleString()}
                                            </strong>

                                            <Link
                                                to={
                                                    `/customer/products/` +
                                                    `${product.id}`
                                                }
                                            >
                                                View
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                <section className="customer-dashboard-section">
                    <div className="customer-section-heading">
                        <div>
                            <span>Latest activity</span>
                            <h2>Recent orders</h2>
                        </div>

                        <Link to="/customer/orders">
                            View all orders →
                        </Link>
                    </div>

                    {loading ? (
                        <div className="customer-orders-loading">
                            Loading recent orders...
                        </div>
                    ) : recentOrders.length === 0 ? (
                        <div className="customer-empty-state">
                            <div>📦</div>
                            <h3>No orders yet</h3>
                            <p>
                                Your recent orders will be displayed here.
                            </p>
                        </div>
                    ) : (
                        <div className="customer-order-table-wrapper">
                            <table className="customer-order-table">
                                <thead>
                                    <tr>
                                        <th>Order</th>
                                        <th>Product</th>
                                        <th>Quantity</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {recentOrders.map((order) => (
                                        <tr key={order.id}>
                                            <td>#{order.id}</td>

                                            <td>
                                                <strong>
                                                    {order.product_name}
                                                </strong>
                                            </td>

                                            <td>{order.quantity}</td>

                                            <td>
                                                LKR{" "}
                                                {Number(
                                                    order.total_price
                                                ).toLocaleString()}
                                            </td>

                                            <td>
                                                <span
                                                    className={
                                                        `order-status-badge ` +
                                                        `status-${order.status?.toLowerCase()}`
                                                    }
                                                >
                                                    {order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};


export default CustomerDashboard;