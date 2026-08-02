import { useEffect, useMemo, useState } from "react";
import {
    Link,
    useNavigate,
    useParams
} from "react-router-dom";

import { productAPI, orderAPI } from "../../api/axiosConfig";
import { useAuth } from "../../context/AuthContext";


const ProductDetails = () => {
    const { productId } = useParams();
    const navigate = useNavigate();

    const {
        user,
        logout
    } = useAuth();

    const [product, setProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);

    const [loading, setLoading] = useState(true);
    const [ordering, setOrdering] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");


    const customerEmail = useMemo(
        () => user?.sub || user?.email || "Customer",
        [user]
    );


    useEffect(() => {
        const loadProduct = async () => {
            setLoading(true);
            setError("");

            try {
                const response = await productAPI.get(
                    `/${productId}`
                );

                setProduct(response.data);
            } catch (requestError) {
                const detail =
                    requestError.response?.data?.detail;

                setError(
                    typeof detail === "string"
                        ? detail
                        : "Unable to load product details."
                );
            } finally {
                setLoading(false);
            }
        };

        loadProduct();
    }, [productId]);


    const totalPrice = useMemo(() => {
        if (!product) {
            return 0;
        }

        return Number(product.price) * quantity;
    }, [product, quantity]);


    const handleLogout = () => {
        logout();
        navigate("/login");
    };


    const increaseQuantity = () => {
        if (!product) {
            return;
        }

        setQuantity((currentQuantity) => {
            const nextQuantity = currentQuantity + 1;

            return Math.min(
                nextQuantity,
                product.stock
            );
        });
    };


    const decreaseQuantity = () => {
        setQuantity((currentQuantity) =>
            Math.max(currentQuantity - 1, 1)
        );
    };


    const handleQuantityChange = (event) => {
        if (!product) {
            return;
        }

        const value = Number(event.target.value);

        if (Number.isNaN(value)) {
            setQuantity(1);
            return;
        }

        setQuantity(
            Math.min(
                Math.max(value, 1),
                product.stock
            )
        );
    };


    const handleCreateOrder = async () => {
        if (!product) {
            return;
        }

        if (product.stock <= 0) {
            setError("This product is currently out of stock.");
            return;
        }

        if (quantity < 1) {
            setError("Order quantity must be at least 1.");
            return;
        }

        if (quantity > product.stock) {
            setError(
                `Only ${product.stock} unit(s) are available.`
            );
            return;
        }

        setOrdering(true);
        setError("");
        setSuccess("");

        try {
            const response = await orderAPI.post(
                "/",
                {
                    product_id: product.id,
                    quantity
                }
            );

            setSuccess(
                response.data?.message ||
                "Order created successfully."
            );

            const updatedProductResponse =
                await productAPI.get(`/${product.id}`);

            setProduct(updatedProductResponse.data);
            setQuantity(1);
        } catch (requestError) {
            const detail =
                requestError.response?.data?.detail;

            setError(
                typeof detail === "string"
                    ? detail
                    : "Unable to create your order."
            );
        } finally {
            setOrdering(false);
        }
    };


    return (
        <div className="product-details-page">
            <aside className="customer-sidebar product-details-sidebar">
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
                        className="customer-nav-link active"
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

            <main className="product-details-main">
                <header className="product-details-topbar">
                    <div>
                        <p className="customer-topbar-label">
                            Product information
                        </p>

                        <h1>
                            Product
                            <span> details</span>
                        </h1>
                    </div>

                    <Link
                        className="secondary-button"
                        to="/customer/products"
                    >
                        ← Back to products
                    </Link>
                </header>

                {loading ? (
                    <section className="product-details-loading">
                        <div className="product-details-loading-visual" />

                        <div className="product-details-loading-content">
                            <div />
                            <div />
                            <div />
                            <div />
                        </div>
                    </section>
                ) : error && !product ? (
                    <section className="product-details-error-card">
                        <div>⚠️</div>

                        <h2>Unable to load product</h2>

                        <p>{error}</p>

                        <Link
                            className="primary-button"
                            to="/customer/products"
                        >
                            Return to catalogue
                        </Link>
                    </section>
                ) : product ? (
                    <>
                        <section className="product-details-card">
                            <div className="product-details-visual">
                                <div className="product-details-pattern pattern-one" />
                                <div className="product-details-pattern pattern-two" />

                                <span
                                    className={
                                        product.stock > 0
                                            ? "product-details-stock available"
                                            : "product-details-stock unavailable"
                                    }
                                >
                                    {product.stock > 0
                                        ? `${product.stock} unit(s) available`
                                        : "Out of stock"}
                                </span>

                                <div className="product-details-image-wrapper">
                                    {product.image_url ? (
                                        <>
                                            <img
                                                className="product-details-image"
                                                src={product.image_url}
                                                alt={product.name}
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

                                            <div
                                                className="product-details-letter"
                                                style={{ display: "none" }}
                                            >
                                                {product.category
                                                    ?.charAt(0)
                                                    .toUpperCase() || "P"}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="product-details-letter">
                                            {product.category
                                                ?.charAt(0)
                                                .toUpperCase() || "P"}
                                        </div>
                                    )}
                                </div>

                                <div className="product-details-visual-caption">
                                    <small>
                                        SmartRetailX collection
                                    </small>

                                    <strong>
                                        {product.category}
                                    </strong>
                                </div>
                            </div>

                            <div className="product-details-content">
                                <div className="product-details-category-row">
                                    <span>
                                        {product.category}
                                    </span>

                                    <b>
                                        Product #{product.id}
                                    </b>
                                </div>

                                <h2>{product.name}</h2>

                                <p className="product-details-description">
                                    {product.description}
                                </p>

                                <div className="product-details-info-grid">
                                    <article>
                                        <span>Unit price</span>

                                        <strong>
                                            LKR{" "}
                                            {Number(
                                                product.price
                                            ).toLocaleString()}
                                        </strong>
                                    </article>

                                    <article>
                                        <span>Availability</span>

                                        <strong>
                                            {product.stock > 0
                                                ? "In stock"
                                                : "Unavailable"}
                                        </strong>
                                    </article>

                                    <article>
                                        <span>Category</span>

                                        <strong>
                                            {product.category}
                                        </strong>
                                    </article>
                                </div>

                                <div className="product-order-panel">
                                    <div className="product-quantity-section">
                                        <label htmlFor="order-quantity">
                                            Quantity
                                        </label>

                                        <div className="product-quantity-control">
                                            <button
                                                type="button"
                                                onClick={decreaseQuantity}
                                                disabled={
                                                    quantity <= 1 ||
                                                    product.stock <= 0
                                                }
                                            >
                                                −
                                            </button>

                                            <input
                                                id="order-quantity"
                                                type="number"
                                                min="1"
                                                max={product.stock}
                                                value={quantity}
                                                onChange={
                                                    handleQuantityChange
                                                }
                                                disabled={
                                                    product.stock <= 0
                                                }
                                            />

                                            <button
                                                type="button"
                                                onClick={increaseQuantity}
                                                disabled={
                                                    quantity >=
                                                    product.stock ||
                                                    product.stock <= 0
                                                }
                                            >
                                                +
                                            </button>
                                        </div>

                                        <small>
                                            Maximum available:{" "}
                                            {product.stock}
                                        </small>
                                    </div>

                                    <div className="product-order-total">
                                        <span>Estimated total</span>

                                        <strong>
                                            LKR{" "}
                                            {Number(
                                                totalPrice
                                            ).toLocaleString()}
                                        </strong>
                                    </div>
                                </div>

                                {error && (
                                    <div
                                        className="error-message product-details-alert"
                                        role="alert"
                                    >
                                        <span>⚠</span>
                                        {error}
                                    </div>
                                )}

                                {success && (
                                    <div
                                        className="success-message product-details-alert"
                                        role="status"
                                    >
                                        <span>✓</span>
                                        {success}
                                    </div>
                                )}

                                <div className="product-details-actions">
                                    <button
                                        className="primary-button product-order-submit"
                                        type="button"
                                        onClick={handleCreateOrder}
                                        disabled={
                                            ordering ||
                                            product.stock <= 0
                                        }
                                    >
                                        {ordering ? (
                                            <>
                                                <span className="button-spinner" />
                                                Creating order...
                                            </>
                                        ) : (
                                            <>
                                                Place order
                                                <span>→</span>
                                            </>
                                        )}
                                    </button>

                                    <Link
                                        className="secondary-button"
                                        to="/customer/orders"
                                    >
                                        View my orders
                                    </Link>
                                </div>
                            </div>
                        </section>

                        <section className="product-details-benefits">
                            <article>
                                <div>🔐</div>

                                <h3>Secure ordering</h3>

                                <p>
                                    Your order is protected using JWT-based
                                    authentication.
                                </p>
                            </article>

                            <article>
                                <div>📦</div>

                                <h3>Automatic stock update</h3>

                                <p>
                                    Available stock is reduced when your order
                                    is successfully created.
                                </p>
                            </article>

                            <article>
                                <div>🔔</div>

                                <h3>Instant notifications</h3>

                                <p>
                                    You will receive an order-created
                                    notification automatically.
                                </p>
                            </article>
                        </section>
                    </>
                ) : null}
            </main>
        </div>
    );
};


export default ProductDetails;