import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    Link,
    useNavigate,
    useParams
} from "react-router-dom";

import { productAPI } from "../../api/axiosConfig";
import { useCart } from "../../context/CartContext";


const formatPrice = (price) => {
    return Number(price || 0).toLocaleString(
        "en-LK",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
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


const getCategoryIcon = (category) => {
    const value =
        category?.toLowerCase() || "";

    if (
        value.includes("phone") ||
        value.includes("mobile")
    ) {
        return "📱";
    }

    if (
        value.includes("laptop") ||
        value.includes("computer")
    ) {
        return "💻";
    }

    if (
        value.includes("audio") ||
        value.includes("headphone")
    ) {
        return "🎧";
    }

    if (value.includes("camera")) {
        return "📷";
    }

    if (
        value.includes("watch") ||
        value.includes("wearable")
    ) {
        return "⌚";
    }

    if (value.includes("tablet")) {
        return "📲";
    }

    if (value.includes("speaker")) {
        return "🔊";
    }

    if (value.includes("accessor")) {
        return "🖱️";
    }

    return "🛍️";
};


const PublicProductDetails = () => {
    const { productId } = useParams();
    const navigate = useNavigate();

    const {
        addToCart,
        cartItemCount
    } = useCart();

    const [product, setProduct] = useState(null);
    const [allProducts, setAllProducts] = useState([]);
    const [quantity, setQuantity] = useState(1);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] =
        useState("success");


    useEffect(() => {
        const loadProductData = async () => {
            setLoading(true);
            setError("");
            setProduct(null);

            try {
                const [
                    productResponse,
                    allProductsResponse
                ] = await Promise.all([
                    productAPI.get(`/${productId}`),
                    productAPI.get("/")
                ]);

                setProduct(productResponse.data);

                setAllProducts(
                    Array.isArray(allProductsResponse.data)
                        ? allProductsResponse.data
                        : []
                );

                setQuantity(1);
            } catch (requestError) {
                setError(
                    formatBackendError(
                        requestError,
                        "Unable to load product details."
                    )
                );
            } finally {
                setLoading(false);
            }
        };

        loadProductData();
    }, [productId]);


    useEffect(() => {
        if (!message) {
            return undefined;
        }

        const timer = window.setTimeout(() => {
            setMessage("");
        }, 3000);

        return () => {
            window.clearTimeout(timer);
        };
    }, [message]);


    const relatedProducts = useMemo(() => {
        if (!product) {
            return [];
        }

        const sameCategory = allProducts.filter(
            (item) =>
                item.id !== product.id &&
                item.category === product.category
        );

        const otherProducts = allProducts.filter(
            (item) =>
                item.id !== product.id &&
                item.category !== product.category
        );

        return [
            ...sameCategory,
            ...otherProducts
        ].slice(0, 4);
    }, [
        allProducts,
        product
    ]);


    const totalPrice = useMemo(() => {
        if (!product) {
            return 0;
        }

        return (
            Number(product.price || 0) *
            Number(quantity || 0)
        );
    }, [
        product,
        quantity
    ]);


    const showMessage = (
        text,
        type = "success"
    ) => {
        setMessage(text);
        setMessageType(type);
    };


    const increaseQuantity = () => {
        if (!product) {
            return;
        }

        if (quantity >= Number(product.stock)) {
            showMessage(
                `Only ${product.stock} unit(s) are available.`,
                "error"
            );

            return;
        }

        setQuantity(
            (currentQuantity) =>
                currentQuantity + 1
        );
    };


    const decreaseQuantity = () => {
        setQuantity(
            (currentQuantity) =>
                Math.max(
                    currentQuantity - 1,
                    1
                )
        );
    };


    const handleQuantityChange = (event) => {
        if (!product) {
            return;
        }

        const value =
            Number(event.target.value);

        if (
            Number.isNaN(value) ||
            value < 1
        ) {
            setQuantity(1);
            return;
        }

        if (value > Number(product.stock)) {
            setQuantity(
                Number(product.stock)
            );

            showMessage(
                `Only ${product.stock} unit(s) are available.`,
                "error"
            );

            return;
        }

        setQuantity(value);
    };


    const handleAddToCart = () => {
        if (!product) {
            return;
        }

        const result = addToCart(
            product,
            quantity
        );

        showMessage(
            result.message,
            result.success
                ? "success"
                : "error"
        );
    };


    const handleBuyNow = () => {
        if (!product) {
            return;
        }

        const result = addToCart(
            product,
            quantity
        );

        if (!result.success) {
            showMessage(
                result.message,
                "error"
            );

            return;
        }

        navigate("/cart");
    };


    if (loading) {
        return (
            <div className="public-product-details-page">
                <section className="public-product-details-loading">
                    <div className="public-product-details-container">
                        <div className="public-product-loading-card">
                            <div className="public-product-loading-visual" />

                            <div className="public-product-loading-content">
                                <div />
                                <div />
                                <div />
                                <div />
                                <div />
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        );
    }


    if (error || !product) {
        return (
            <div className="public-product-details-page">
                <section className="public-product-details-error-section">
                    <div className="public-product-details-error-card">
                        <div>
                            ⚠️
                        </div>

                        <span>
                            Product unavailable
                        </span>

                        <h1>
                            Unable to load product details
                        </h1>

                        <p>
                            {error ||
                                "The requested product could not be found."}
                        </p>

                        <div className="public-product-details-error-actions">
                            <Link
                                className="primary-button"
                                to="/products"
                            >
                                Return to products
                            </Link>

                            <Link
                                className="secondary-button"
                                to="/"
                            >
                                Go home
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        );
    }


    const isOutOfStock =
        Number(product.stock) <= 0;


    return (
        <div className="public-product-details-page">
            {message && (
                <div
                    className={
                        messageType === "success"
                            ? "public-product-details-toast success"
                            : "public-product-details-toast error"
                    }
                    role="status"
                >
                    <span>
                        {messageType === "success"
                            ? "✓"
                            : "⚠"}
                    </span>

                    <p>{message}</p>

                    {messageType === "success" && (
                        <Link to="/cart">
                            View cart
                        </Link>
                    )}
                </div>
            )}

            <section className="public-product-details-hero">
                <div className="public-product-details-container">
                    <div className="public-product-details-breadcrumb">
                        <Link to="/">
                            Home
                        </Link>

                        <span>›</span>

                        <Link to="/products">
                            Products
                        </Link>

                        <span>›</span>

                        <strong>
                            {product.name}
                        </strong>
                    </div>

                    <div className="public-product-details-hero-grid">
                        <div className="public-product-details-hero-content">
                            <span>
                                Product #{product.id}
                            </span>

                            <h1>
                                {product.name}
                            </h1>

                            <p>
                                Explore product information, choose
                                your preferred quantity and add the
                                item to your cart without signing in.
                            </p>
                        </div>

                        <div className="public-product-details-hero-cart">
                            <span>🛒</span>

                            <div>
                                <strong>
                                    {cartItemCount}
                                </strong>

                                <small>
                                    Item
                                    {cartItemCount === 1
                                        ? ""
                                        : "s"}{" "}
                                    in cart
                                </small>
                            </div>

                            <Link to="/cart">
                                Open cart
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <section className="public-product-details-content-section">
                <div className="public-product-details-container">
                    <div className="public-product-details-main-card">
                        <div className="public-product-details-visual">
                            <div className="public-product-details-pattern pattern-one" />
                            <div className="public-product-details-pattern pattern-two" />

                            <span className="public-product-details-category">
                                {product.category ||
                                    "Uncategorized"}
                            </span>

                            <span
                                className={
                                    isOutOfStock
                                        ? "public-product-details-stock unavailable"
                                        : "public-product-details-stock available"
                                }
                            >
                                {isOutOfStock
                                    ? "Out of stock"
                                    : `${product.stock} unit(s) available`}
                            </span>

                            <div className="public-product-details-image-wrapper">
                                {product.image_url ? (
                                    <>
                                        <img
                                            className="public-product-details-image"
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
                                            className="public-product-details-icon"
                                            style={{ display: "none" }}
                                        >
                                            {getCategoryIcon(
                                                product.category
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="public-product-details-icon">
                                        {getCategoryIcon(
                                            product.category
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="public-product-details-visual-caption">
                                <small>
                                    SmartRetailX Collection
                                </small>

                                <strong>
                                    {product.name}
                                </strong>

                                <p>
                                    {product.category}
                                </p>
                            </div>
                        </div>

                        <div className="public-product-details-information">
                            <div className="public-product-details-heading-row">
                                <div>
                                    <span>
                                        {product.category ||
                                            "Uncategorized"}
                                    </span>

                                    <h2>
                                        {product.name}
                                    </h2>
                                </div>

                                <span
                                    className={
                                        isOutOfStock
                                            ? "public-product-availability-badge unavailable"
                                            : "public-product-availability-badge available"
                                    }
                                >
                                    {isOutOfStock
                                        ? "Unavailable"
                                        : "In stock"}
                                </span>
                            </div>

                            <p className="public-product-details-description">
                                {product.description ||
                                    "No product description is currently available."}
                            </p>

                            <div className="public-product-details-info-grid">
                                <article>
                                    <span>
                                        Unit price
                                    </span>

                                    <strong>
                                        LKR{" "}
                                        {formatPrice(
                                            product.price
                                        )}
                                    </strong>
                                </article>

                                <article>
                                    <span>
                                        Available stock
                                    </span>

                                    <strong>
                                        {product.stock}
                                    </strong>
                                </article>

                                <article>
                                    <span>
                                        Category
                                    </span>

                                    <strong>
                                        {product.category ||
                                            "Uncategorized"}
                                    </strong>
                                </article>

                                <article>
                                    <span>
                                        Product ID
                                    </span>

                                    <strong>
                                        #{product.id}
                                    </strong>
                                </article>
                            </div>

                            <div className="public-product-purchase-panel">
                                <div className="public-product-quantity-section">
                                    <label htmlFor="public-product-quantity">
                                        Select quantity
                                    </label>

                                    <div className="public-product-quantity-control">
                                        <button
                                            type="button"
                                            onClick={
                                                decreaseQuantity
                                            }
                                            disabled={
                                                quantity <= 1 ||
                                                isOutOfStock
                                            }
                                        >
                                            −
                                        </button>

                                        <input
                                            id="public-product-quantity"
                                            type="number"
                                            min="1"
                                            max={product.stock}
                                            value={quantity}
                                            onChange={
                                                handleQuantityChange
                                            }
                                            disabled={
                                                isOutOfStock
                                            }
                                        />

                                        <button
                                            type="button"
                                            onClick={
                                                increaseQuantity
                                            }
                                            disabled={
                                                isOutOfStock ||
                                                quantity >=
                                                Number(
                                                    product.stock
                                                )
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

                                <div className="public-product-total-price">
                                    <span>
                                        Estimated total
                                    </span>

                                    <strong>
                                        LKR{" "}
                                        {formatPrice(
                                            totalPrice
                                        )}
                                    </strong>
                                </div>
                            </div>

                            <div className="public-product-details-actions">
                                <button
                                    className="public-product-details-cart-button"
                                    type="button"
                                    onClick={
                                        handleAddToCart
                                    }
                                    disabled={
                                        isOutOfStock
                                    }
                                >
                                    Add to cart
                                </button>

                                <button
                                    className="public-product-details-buy-button"
                                    type="button"
                                    onClick={
                                        handleBuyNow
                                    }
                                    disabled={
                                        isOutOfStock
                                    }
                                >
                                    Buy now
                                    <span>→</span>
                                </button>
                            </div>

                            <div className="public-product-details-security-list">
                                <article>
                                    <div>
                                        🔐
                                    </div>

                                    <div>
                                        <strong>
                                            Secure checkout
                                        </strong>

                                        <p>
                                            Login is required only
                                            when confirming the order.
                                        </p>
                                    </div>
                                </article>

                                <article>
                                    <div>
                                        📦
                                    </div>

                                    <div>
                                        <strong>
                                            Live stock
                                        </strong>

                                        <p>
                                            Availability is loaded
                                            from the Product Service.
                                        </p>
                                    </div>
                                </article>

                                <article>
                                    <div>
                                        🔔
                                    </div>

                                    <div>
                                        <strong>
                                            Order notifications
                                        </strong>

                                        <p>
                                            Receive status updates
                                            after checkout.
                                        </p>
                                    </div>
                                </article>
                            </div>
                        </div>
                    </div>

                    <section className="public-product-details-about">
                        <div className="public-product-details-about-heading">
                            <span>
                                Product overview
                            </span>

                            <h2>
                                About this product
                            </h2>
                        </div>

                        <div className="public-product-details-about-grid">
                            <article>
                                <div>
                                    🛍️
                                </div>

                                <h3>
                                    Product description
                                </h3>

                                <p>
                                    {product.description ||
                                        "No additional description is available."}
                                </p>
                            </article>

                            <article>
                                <div>
                                    🏷️
                                </div>

                                <h3>
                                    Product category
                                </h3>

                                <p>
                                    This item is listed under the{" "}
                                    <strong>
                                        {product.category ||
                                            "Uncategorized"}
                                    </strong>{" "}
                                    category.
                                </p>
                            </article>

                            <article>
                                <div>
                                    📊
                                </div>

                                <h3>
                                    Current inventory
                                </h3>

                                <p>
                                    {isOutOfStock
                                        ? "This product is currently unavailable."
                                        : `${product.stock} unit(s) are currently available for purchase.`}
                                </p>
                            </article>
                        </div>
                    </section>

                    <section className="public-related-products-section">
                        <div className="public-related-products-heading">
                            <div>
                                <span>
                                    You may also like
                                </span>

                                <h2>
                                    Related products
                                </h2>

                                <p>
                                    Explore other items available in
                                    the SmartRetailX catalogue.
                                </p>
                            </div>

                            <Link to="/products">
                                View all products
                                <span>→</span>
                            </Link>
                        </div>

                        {relatedProducts.length === 0 ? (
                            <div className="public-related-products-empty">
                                <div>
                                    🛍️
                                </div>

                                <h3>
                                    No related products available
                                </h3>

                                <p>
                                    More products will appear here
                                    when they are added.
                                </p>
                            </div>
                        ) : (
                            <div className="public-related-products-grid">
                                {relatedProducts.map(
                                    (relatedProduct) => (
                                        <article
                                            className="public-related-product-card"
                                            key={
                                                relatedProduct.id
                                            }
                                        >
                                            <div className="public-related-product-visual">

                                                <div className="public-related-product-image-wrapper">
                                                    {relatedProduct.image_url ? (
                                                        <>
                                                            <img
                                                                src={relatedProduct.image_url}
                                                                alt={relatedProduct.name}
                                                                className="public-related-product-image"
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
                                                                className="public-related-product-fallback"
                                                                style={{ display: "none" }}
                                                            >
                                                                {getCategoryIcon(
                                                                    relatedProduct.category
                                                                )}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="public-related-product-fallback">
                                                            {getCategoryIcon(
                                                                relatedProduct.category
                                                            )}
                                                        </span>
                                                    )}
                                                </div>

                                                <b
                                                    className={
                                                        Number(
                                                            relatedProduct.stock
                                                        ) > 0
                                                            ? "available"
                                                            : "unavailable"
                                                    }
                                                >
                                                    {Number(
                                                        relatedProduct.stock
                                                    ) > 0
                                                        ? "In stock"
                                                        : "Out of stock"}
                                                </b>

                                            </div>

                                            <div className="public-related-product-body">
                                                <span>
                                                    {relatedProduct.category ||
                                                        "Uncategorized"}
                                                </span>

                                                <h3>
                                                    {
                                                        relatedProduct.name
                                                    }
                                                </h3>

                                                <p>
                                                    {relatedProduct.description ||
                                                        "No description available."}
                                                </p>

                                                <div>
                                                    <strong>
                                                        LKR{" "}
                                                        {formatPrice(
                                                            relatedProduct.price
                                                        )}
                                                    </strong>

                                                    <Link
                                                        to={
                                                            `/products/` +
                                                            `${relatedProduct.id}`
                                                        }
                                                    >
                                                        View
                                                    </Link>
                                                </div>
                                            </div>
                                        </article>
                                    )
                                )}
                            </div>
                        )}
                    </section>
                </div>
            </section>
        </div>
    );
};


export default PublicProductDetails;