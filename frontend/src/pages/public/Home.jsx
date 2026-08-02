import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    Link,
    useNavigate
} from "react-router-dom";

import { productAPI } from "../../api/axiosConfig";
import { useCart } from "../../context/CartContext";


const SHOPPING_FEATURES = [
    {
        id: 1,
        icon: "🔐",
        title: "Secure shopping",
        description:
            "Protected authentication and reliable order processing."
    },
    {
        id: 2,
        icon: "📦",
        title: "Live order tracking",
        description:
            "Track your order from creation until final delivery."
    },
    {
        id: 3,
        icon: "🔔",
        title: "Instant notifications",
        description:
            "Receive automatic updates for every important order event."
    },
    {
        id: 4,
        icon: "⚡",
        title: "Fast checkout",
        description:
            "Save products in your cart and complete checkout quickly."
    }
];


const SHOPPING_STEPS = [
    {
        id: 1,
        number: "01",
        icon: "🔎",
        title: "Browse products",
        description:
            "Explore the public product catalogue without signing in."
    },
    {
        id: 2,
        number: "02",
        icon: "🛒",
        title: "Build your cart",
        description:
            "Add one or several products and adjust quantities."
    },
    {
        id: 3,
        number: "03",
        icon: "🔐",
        title: "Sign in at checkout",
        description:
            "Authentication is required only when placing the final order."
    },
    {
        id: 4,
        number: "04",
        icon: "📦",
        title: "Track your order",
        description:
            "View order status and receive automatic notifications."
    }
];


const CUSTOMER_REVIEWS = [
    {
        id: 1,
        name: "Nimal Perera",
        role: "SmartRetailX Customer",
        initials: "NP",
        rating: 5,
        message:
            "The public catalogue made it easy to compare products before creating my account."
    },
    {
        id: 2,
        name: "Ayesha Fernando",
        role: "Verified Customer",
        initials: "AF",
        rating: 5,
        message:
            "I added several items to my cart and signed in only when I was ready to checkout."
    },
    {
        id: 3,
        name: "Kavindu Silva",
        role: "Verified Customer",
        initials: "KS",
        rating: 5,
        message:
            "The order and notification pages clearly showed every update after checkout."
    }
];


const getCategoryIcon = (category) => {
    const normalizedCategory =
        category?.toLowerCase() || "";

    if (
        normalizedCategory.includes("phone") ||
        normalizedCategory.includes("smartphone")
    ) {
        return "📱";
    }

    if (
        normalizedCategory.includes("laptop") ||
        normalizedCategory.includes("computer")
    ) {
        return "💻";
    }

    if (
        normalizedCategory.includes("headphone") ||
        normalizedCategory.includes("audio")
    ) {
        return "🎧";
    }

    if (
        normalizedCategory.includes("camera")
    ) {
        return "📷";
    }

    if (
        normalizedCategory.includes("watch") ||
        normalizedCategory.includes("wearable")
    ) {
        return "⌚";
    }

    if (
        normalizedCategory.includes("tablet")
    ) {
        return "📲";
    }

    if (
        normalizedCategory.includes("speaker")
    ) {
        return "🔊";
    }

    if (
        normalizedCategory.includes("accessor")
    ) {
        return "🖱️";
    }

    return "🛍️";
};


const formatPrice = (price) => {
    return Number(price || 0).toLocaleString(
        "en-LK",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
};


const Home = () => {
    const navigate = useNavigate();

    const {
        addToCart,
        cartItemCount
    } = useCart();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [cartMessage, setCartMessage] =
        useState("");

    const [cartMessageType, setCartMessageType] =
        useState("success");


    useEffect(() => {
        const loadProducts = async () => {
            setLoading(true);
            setError("");

            try {
                const response =
                    await productAPI.get("/");

                setProducts(
                    Array.isArray(response.data)
                        ? response.data
                        : []
                );
            } catch (requestError) {
                const detail =
                    requestError.response?.data?.detail;

                setError(
                    typeof detail === "string"
                        ? detail
                        : "Unable to load products at this time."
                );
            } finally {
                setLoading(false);
            }
        };

        loadProducts();
    }, []);


    useEffect(() => {
        if (!cartMessage) {
            return undefined;
        }

        const timer = window.setTimeout(() => {
            setCartMessage("");
        }, 3000);

        return () => {
            window.clearTimeout(timer);
        };
    }, [cartMessage]);


    const featuredProducts = useMemo(() => {
        return products
            .filter((product) => product.stock > 0)
            .slice(0, 6);
    }, [products]);


const productCategories = useMemo(() => {
        const categoryMap = new Map();

        products.forEach((product) => {
            const category =
                product.category || "Uncategorized";

            if (!categoryMap.has(category)) {
                categoryMap.set(category, {
                    name: category,
                    productCount: 0,
                    availableCount: 0
                });
            }

            const categoryInformation =
                categoryMap.get(category);

            categoryInformation.productCount += 1;

            if (Number(product.stock) > 0) {
                categoryInformation.availableCount += 1;
            }
        });

        return Array.from(
            categoryMap.values()
        ).slice(0, 6);
    }, [products]);


    const homeStatistics = useMemo(() => {
        const categories = new Set(
            products
                .map((product) => product.category)
                .filter(Boolean)
        );

        const availableProducts =
            products.filter(
                (product) => product.stock > 0
            ).length;

        const totalStock = products.reduce(
            (total, product) =>
                total + Number(product.stock || 0),
            0
        );

        return {
            products: products.length,
            categories: categories.size,
            availableProducts,
            totalStock
        };
    }, [products]);


    const handleAddToCart = (
        product,
        quantity = 1
    ) => {
        const result = addToCart(
            product,
            quantity
        );

        setCartMessageType(
            result.success
                ? "success"
                : "error"
        );

        setCartMessage(result.message);
    };


    const handleBuyNow = (product) => {
        const result = addToCart(
            product,
            1
        );

        if (!result.success) {
            setCartMessageType("error");
            setCartMessage(result.message);
            return;
        }

        navigate("/cart");
    };


    return (
        <div className="public-home-page">
            {cartMessage && (
                <div
                    className={
                        cartMessageType === "success"
                            ? "home-cart-toast success"
                            : "home-cart-toast error"
                    }
                    role="status"
                >
                    <span>
                        {cartMessageType === "success"
                            ? "✓"
                            : "⚠"}
                    </span>

                    <p>{cartMessage}</p>

                    {cartMessageType === "success" && (
                        <Link to="/cart">
                            View cart
                        </Link>
                    )}
                </div>
            )}

            <section className="home-hero-section">
                <div className="home-hero-background-shape shape-one" />
                <div className="home-hero-background-shape shape-two" />
                <div className="home-hero-background-shape shape-three" />

                <div className="home-hero-container">
                    <div className="home-hero-content">
                        <span className="home-hero-eyebrow">
                            Smart shopping powered by microservices
                        </span>

                        <h1>
                            Discover products.
                            <span>
                                Shop without limits.
                            </span>
                        </h1>

                        <p>
                            Browse the SmartRetailX product catalogue,
                            add your favourite items to the cart and
                            sign in only when you are ready to complete
                            checkout.
                        </p>

                        <div className="home-hero-actions">
                            <Link
                                className="home-hero-primary-button"
                                to="/products"
                            >
                                Start shopping
                                <span>→</span>
                            </Link>

                            <Link
                                className="home-hero-secondary-button"
                                to="/cart"
                            >
                                View cart

                                {cartItemCount > 0 && (
                                    <b>
                                        {cartItemCount}
                                    </b>
                                )}
                            </Link>
                        </div>

                        <div className="home-hero-trust-row">
                            <div>
                                <span>✓</span>
                                No login required to browse
                            </div>

                            <div>
                                <span>✓</span>
                                Secure login at checkout
                            </div>

                            <div>
                                <span>✓</span>
                                Live order notifications
                            </div>
                        </div>
                    </div>

                    <div className="home-hero-visual">
                        <div className="home-visual-orbit orbit-one" />
                        <div className="home-visual-orbit orbit-two" />

                        <div className="home-shopping-card">
                            <div className="home-shopping-card-header">
                                <span>SmartRetailX</span>

                                <div className="home-shopping-cart-icon">
                                    🛒

                                    {cartItemCount > 0 && (
                                        <b>
                                            {cartItemCount}
                                        </b>
                                    )}
                                </div>
                            </div>

                            <div className="home-shopping-card-visual">
                                <span>🛍️</span>
                            </div>

                            <div className="home-shopping-card-content">
                                <small>
                                    Connected shopping
                                </small>

                                <strong>
                                    Browse. Add. Checkout.
                                </strong>

                                <p>
                                    Your cart stays available until
                                    you are ready to place the order.
                                </p>
                            </div>
                        </div>

                        <div className="home-floating-card floating-products">
                            <span>🛍️</span>

                            <div>
                                <strong>
                                    {loading
                                        ? "..."
                                        : homeStatistics.products}
                                </strong>

                                <small>
                                    Products
                                </small>
                            </div>
                        </div>

                        <div className="home-floating-card floating-secure">
                            <span>🔐</span>

                            <div>
                                <strong>
                                    Secure
                                </strong>

                                <small>
                                    Checkout
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="home-features-section">
                <div className="home-section-container">
                    <div className="home-features-grid">
                        {SHOPPING_FEATURES.map((feature) => (
                            <article
                                className="home-feature-card"
                                key={feature.id}
                            >
                                <div className="home-feature-icon">
                                    {feature.icon}
                                </div>

                                <div>
                                    <h3>
                                        {feature.title}
                                    </h3>

                                    <p>
                                        {feature.description}
                                    </p>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="home-statistics-section">
                <div className="home-section-container">
                    <div className="home-statistics-panel">
                        <div className="home-statistics-heading">
                            <span>
                                Live catalogue overview
                            </span>

                            <h2>
                                Shopping information from the
                                Product Service
                            </h2>

                            <p>
                                The statistics below are generated
                                using live product information from
                                the SmartRetailX backend.
                            </p>
                        </div>

                        <div className="home-statistics-grid">
                            <article>
                                <div className="home-stat-icon products">
                                    🛍️
                                </div>

                                <span>
                                    Products
                                </span>

                                <strong>
                                    {loading
                                        ? "..."
                                        : homeStatistics.products}
                                </strong>
                            </article>

                            <article>
                                <div className="home-stat-icon categories">
                                    🏷️
                                </div>

                                <span>
                                    Categories
                                </span>

                                <strong>
                                    {loading
                                        ? "..."
                                        : homeStatistics.categories}
                                </strong>
                            </article>

                            <article>
                                <div className="home-stat-icon available">
                                    ✓
                                </div>

                                <span>
                                    Available items
                                </span>

                                <strong>
                                    {loading
                                        ? "..."
                                        : homeStatistics.availableProducts}
                                </strong>
                            </article>

                            <article>
                                <div className="home-stat-icon stock">
                                    📦
                                </div>

                                <span>
                                    Units in stock
                                </span>

                                <strong>
                                    {loading
                                        ? "..."
                                        : homeStatistics.totalStock}
                                </strong>
                            </article>
                        </div>
                    </div>
                </div>
            </section>

            <section className="home-featured-products-section">
                <div className="home-section-container">
                    <div className="home-section-heading">
                        <div>
                            <span>
                                Featured collection
                            </span>

                            <h2>
                                Popular products available now
                            </h2>

                            <p>
                                Add products directly to your cart
                                without creating an account first.
                            </p>
                        </div>

                        <Link
                            className="home-section-link"
                            to="/products"
                        >
                            View full catalogue
                            <span>→</span>
                        </Link>
                    </div>

                    {error && (
                        <div
                            className="error-message home-products-error"
                            role="alert"
                        >
                            <span>⚠</span>
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="home-featured-products-grid">
                            {[1, 2, 3, 4, 5, 6].map(
                                (item) => (
                                    <div
                                        className="home-product-skeleton"
                                        key={item}
                                    />
                                )
                            )}
                        </div>
                    ) : featuredProducts.length === 0 ? (
                        <div className="home-products-empty-state">
                            <div>🛍️</div>

                            <h3>
                                No featured products available
                            </h3>

                            <p>
                                Products will appear here when
                                inventory is added.
                            </p>
                        </div>
                    ) : (
                        <div className="home-featured-products-grid">
                            {featuredProducts.map((product) => (
                                <article
                                    className="home-product-card"
                                    key={product.id}
                                >
                                    <div className="home-product-card-visual">
                                        <span className="home-product-category-badge">
                                            {product.category}
                                        </span>

                                        <div className="home-product-image-wrapper">
                                            {product.image_url ? (
                                                <>
                                                    <img
                                                        className="home-product-image"
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
                                                        className="home-product-main-icon"
                                                        style={{ display: "none" }}
                                                    >
                                                        {getCategoryIcon(
                                                            product.category
                                                        )}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="home-product-main-icon">
                                                    {getCategoryIcon(
                                                        product.category
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <span
                                            className={
                                                product.stock > 0
                                                    ? "home-product-stock in-stock"
                                                    : "home-product-stock out-of-stock"
                                            }
                                        >
                                            {product.stock > 0
                                                ? `${product.stock} available`
                                                : "Out of stock"}
                                        </span>
                                    </div>

                                    <div className="home-product-card-body">
                                        <span className="home-product-reference">
                                            Product #{product.id}
                                        </span>

                                        <h3>
                                            {product.name}
                                        </h3>

                                        <p>
                                            {product.description}
                                        </p>

                                        <div className="home-product-price">
                                            <span>
                                                Price
                                            </span>

                                            <strong>
                                                LKR{" "}
                                                {formatPrice(
                                                    product.price
                                                )}
                                            </strong>
                                        </div>

                                        <div className="home-product-actions">
                                            <Link
                                                className="home-product-details-button"
                                                to={
                                                    `/products/` +
                                                    `${product.id}`
                                                }
                                            >
                                                View details
                                            </Link>

                                            <button
                                                className="home-product-cart-button"
                                                type="button"
                                                disabled={
                                                    product.stock <= 0
                                                }
                                                onClick={() => {
                                                    handleAddToCart(
                                                        product,
                                                        1
                                                    );
                                                }}
                                            >
                                                Add to cart
                                            </button>
                                        </div>

                                        <button
                                            className="home-product-buy-button"
                                            type="button"
                                            disabled={
                                                product.stock <= 0
                                            }
                                            onClick={() => {
                                                handleBuyNow(
                                                    product
                                                );
                                            }}
                                        >
                                            Buy now
                                            <span>→</span>
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </section>

                        <section className="home-categories-section">
                <div className="home-section-container">
                    <div className="home-section-heading">
                        <div>
                            <span>
                                Browse by category
                            </span>

                            <h2>
                                Find products that match your needs
                            </h2>

                            <p>
                                Explore product groups generated from
                                the live SmartRetailX catalogue.
                            </p>
                        </div>

                        <Link
                            className="home-section-link"
                            to="/products"
                        >
                            Explore categories
                            <span>→</span>
                        </Link>
                    </div>

                    {loading ? (
                        <div className="home-category-grid">
                            {[1, 2, 3, 4, 5, 6].map(
                                (item) => (
                                    <div
                                        className="home-category-skeleton"
                                        key={item}
                                    />
                                )
                            )}
                        </div>
                    ) : productCategories.length === 0 ? (
                        <div className="home-products-empty-state">
                            <div>🏷️</div>

                            <h3>
                                No categories available
                            </h3>

                            <p>
                                Product categories will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="home-category-grid">
                            {productCategories.map(
                                (category) => (
                                    <Link
                                        className="home-category-card"
                                        to={
                                            `/products?category=` +
                                            `${encodeURIComponent(
                                                category.name
                                            )}`
                                        }
                                        key={category.name}
                                    >
                                        <div className="home-category-icon">
                                            {getCategoryIcon(
                                                category.name
                                            )}
                                        </div>

                                        <div className="home-category-card-content">
                                            <h3>
                                                {category.name}
                                            </h3>

                                            <p>
                                                {
                                                    category.productCount
                                                }{" "}
                                                product
                                                {category.productCount ===
                                                1
                                                    ? ""
                                                    : "s"}
                                            </p>
                                        </div>

                                        <div className="home-category-availability">
                                            <strong>
                                                {
                                                    category.availableCount
                                                }
                                            </strong>

                                            <span>
                                                Available
                                            </span>
                                        </div>

                                        <span className="home-category-arrow">
                                            →
                                        </span>
                                    </Link>
                                )
                            )}
                        </div>
                    )}
                </div>
            </section>

            <section className="home-shopping-process-section">
                <div className="home-section-container">
                    <div className="home-shopping-process-panel">
                        <div className="home-shopping-process-heading">
                            <span>
                                Simple shopping journey
                            </span>

                            <h2>
                                Browse first and authenticate only
                                when checking out
                            </h2>

                            <p>
                                Customers can explore the website and
                                prepare their cart before registration
                                or login becomes necessary.
                            </p>

                            <div className="home-shopping-process-actions">
                                <Link
                                    className="primary-button"
                                    to="/products"
                                >
                                    Browse products
                                </Link>

                                <Link
                                    className="secondary-button"
                                    to="/cart"
                                >
                                    Open cart
                                </Link>
                            </div>
                        </div>

                        <div className="home-shopping-step-grid">
                            {SHOPPING_STEPS.map((step) => (
                                <article
                                    className="home-shopping-step"
                                    key={step.id}
                                >
                                    <span className="home-step-number">
                                        {step.number}
                                    </span>

                                    <div className="home-step-icon">
                                        {step.icon}
                                    </div>

                                    <h3>
                                        {step.title}
                                    </h3>

                                    <p>
                                        {step.description}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="home-why-section">
                <div className="home-section-container">
                    <div className="home-why-grid">
                        <div className="home-why-visual">
                            <div className="home-why-pattern why-pattern-one" />
                            <div className="home-why-pattern why-pattern-two" />

                            <div className="home-why-main-card">
                                <span>☁️</span>

                                <small>
                                    Cloud microservices
                                </small>

                                <strong>
                                    Four connected backend services
                                </strong>

                                <p>
                                    User, Product, Order and Notification
                                    services work together to complete
                                    every purchase.
                                </p>
                            </div>

                            <div className="home-why-floating-card why-stock-card">
                                <span>📦</span>

                                <div>
                                    <strong>
                                        Live stock
                                    </strong>

                                    <small>
                                        Automatic updates
                                    </small>
                                </div>
                            </div>

                            <div className="home-why-floating-card why-alert-card">
                                <span>🔔</span>

                                <div>
                                    <strong>
                                        Notifications
                                    </strong>

                                    <small>
                                        Order activity
                                    </small>
                                </div>
                            </div>
                        </div>

                        <div className="home-why-content">
                            <span>
                                Why choose SmartRetailX?
                            </span>

                            <h2>
                                A complete shopping experience built on
                                secure microservices
                            </h2>

                            <p>
                                SmartRetailX separates major business
                                capabilities into independent services,
                                improving maintainability, security and
                                scalability.
                            </p>

                            <div className="home-why-benefit-list">
                                <article>
                                    <div>✓</div>

                                    <div>
                                        <h3>
                                            Public product browsing
                                        </h3>

                                        <p>
                                            Visitors can explore products
                                            without creating an account.
                                        </p>
                                    </div>
                                </article>

                                <article>
                                    <div>✓</div>

                                    <div>
                                        <h3>
                                            Persistent guest cart
                                        </h3>

                                        <p>
                                            Cart contents remain stored
                                            locally until checkout.
                                        </p>
                                    </div>
                                </article>

                                <article>
                                    <div>✓</div>

                                    <div>
                                        <h3>
                                            Protected checkout
                                        </h3>

                                        <p>
                                            JWT authentication protects
                                            the final order operation.
                                        </p>
                                    </div>
                                </article>

                                <article>
                                    <div>✓</div>

                                    <div>
                                        <h3>
                                            Automatic integration
                                        </h3>

                                        <p>
                                            Checkout reduces product stock
                                            and creates notifications.
                                        </p>
                                    </div>
                                </article>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="home-reviews-section">
                <div className="home-section-container">
                    <div className="home-reviews-heading">
                        <div>
                            <span>
                                Customer experience
                            </span>

                            <h2>
                                Designed for simple and flexible shopping
                            </h2>

                            <p>
                                The public-first checkout journey gives
                                customers freedom to explore before
                                signing in.
                            </p>
                        </div>

                        <div className="home-review-score">
                            <strong>5.0</strong>

                            <div>
                                <span>
                                    ★★★★★
                                </span>

                                <small>
                                    Customer satisfaction
                                </small>
                            </div>
                        </div>
                    </div>

                    <div className="home-review-grid">
                        {CUSTOMER_REVIEWS.map((review) => (
                            <article
                                className="home-review-card"
                                key={review.id}
                            >
                                <div className="home-review-stars">
                                    {"★".repeat(review.rating)}
                                </div>

                                <p>
                                    “{review.message}”
                                </p>

                                <div className="home-review-customer">
                                    <div>
                                        {review.initials}
                                    </div>

                                    <span>
                                        <strong>
                                            {review.name}
                                        </strong>

                                        <small>
                                            {review.role}
                                        </small>
                                    </span>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="home-checkout-cta-section">
                <div className="home-section-container">
                    <div className="home-checkout-cta">
                        <div className="home-checkout-cta-pattern cta-pattern-one" />
                        <div className="home-checkout-cta-pattern cta-pattern-two" />

                        <div className="home-checkout-cta-content">
                            <span>
                                Ready to complete your purchase?
                            </span>

                            <h2>
                                Your cart is waiting for you
                            </h2>

                            <p>
                                Review selected items and proceed to
                                checkout. You will be asked to sign in
                                only when confirming the order.
                            </p>

                            <div className="home-checkout-cta-actions">
                                <Link
                                    className="home-cta-primary"
                                    to="/cart"
                                >
                                    View cart

                                    {cartItemCount > 0 && (
                                        <b>
                                            {cartItemCount}
                                        </b>
                                    )}
                                </Link>

                                <Link
                                    className="home-cta-secondary"
                                    to="/products"
                                >
                                    Continue shopping
                                </Link>
                            </div>
                        </div>

                        <div className="home-checkout-cta-visual">
                            <div>
                                🛒
                            </div>

                            <strong>
                                {cartItemCount}
                            </strong>

                            <span>
                                Item
                                {cartItemCount === 1
                                    ? ""
                                    : "s"}{" "}
                                in cart
                            </span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};


export default Home;