import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

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


const Cart = () => {
    const navigate = useNavigate();

    const {
        cartItems,
        cartItemCount,
        cartSubtotal,
        isCartEmpty,
        removeFromCart,
        updateQuantity,
        increaseQuantity,
        decreaseQuantity,
        clearCart
    } = useCart();

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] =
        useState("success");


    const estimatedDeliveryFee = useMemo(() => {
        if (cartSubtotal === 0) {
            return 0;
        }

        if (cartSubtotal >= 100000) {
            return 0;
        }

        return 1500;
    }, [cartSubtotal]);


    const orderTotal =
        cartSubtotal + estimatedDeliveryFee;


    const showMessage = (
        messageText,
        type = "success"
    ) => {
        setMessage(messageText);
        setMessageType(type);

        window.setTimeout(() => {
            setMessage("");
        }, 3000);
    };


    const handleIncreaseQuantity = (productId) => {
        const result =
            increaseQuantity(productId);

        if (!result.success) {
            showMessage(
                result.message,
                "error"
            );
        }
    };


    const handleDecreaseQuantity = (productId) => {
        decreaseQuantity(productId);
    };


    const handleQuantityInput = (
        productId,
        value
    ) => {
        const result =
            updateQuantity(
                productId,
                value
            );

        if (!result.success) {
            showMessage(
                result.message,
                "error"
            );
        }
    };


    const handleRemoveItem = (item) => {
        const confirmed = window.confirm(
            `Remove "${item.name}" from your cart?`
        );

        if (!confirmed) {
            return;
        }

        removeFromCart(item.id);

        showMessage(
            `${item.name} was removed from your cart.`
        );
    };


    const handleClearCart = () => {
        if (isCartEmpty) {
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to clear the entire cart?"
        );

        if (!confirmed) {
            return;
        }

        clearCart();

        showMessage(
            "Your shopping cart was cleared."
        );
    };


    const handleCheckout = () => {
        if (isCartEmpty) {
            showMessage(
                "Add at least one product before checkout.",
                "error"
            );

            return;
        }

        navigate("/checkout");
    };


    return (
        <div className="public-cart-page">
            {message && (
                <div
                    className={
                        messageType === "success"
                            ? "cart-page-toast success"
                            : "cart-page-toast error"
                    }
                    role="status"
                >
                    <span>
                        {messageType === "success"
                            ? "✓"
                            : "⚠"}
                    </span>

                    <p>{message}</p>
                </div>
            )}

            <section className="cart-page-hero">
                <div className="cart-page-container">
                    <div className="cart-page-hero-content">
                        <span className="cart-page-eyebrow">
                            Your shopping selection
                        </span>

                        <h1>
                            Review your
                            <span> shopping cart</span>
                        </h1>

                        <p>
                            Adjust product quantities, remove unwanted
                            items and continue to secure checkout when
                            you are ready.
                        </p>

                        <div className="cart-page-hero-summary">
                            <div>
                                <span>Cart items</span>
                                <strong>{cartItemCount}</strong>
                            </div>

                            <div>
                                <span>Unique products</span>
                                <strong>{cartItems.length}</strong>
                            </div>

                            <div>
                                <span>Subtotal</span>
                                <strong>
                                    LKR {formatPrice(cartSubtotal)}
                                </strong>
                            </div>
                        </div>
                    </div>

                    <div className="cart-page-hero-visual">
                        <div className="cart-page-hero-icon">
                            🛒
                        </div>

                        <strong>{cartItemCount}</strong>

                        <span>
                            Item
                            {cartItemCount === 1
                                ? ""
                                : "s"}{" "}
                            selected
                        </span>
                    </div>
                </div>
            </section>

            <section className="cart-page-content-section">
                <div className="cart-page-container">
                    {isCartEmpty ? (
                        <div className="cart-empty-state">
                            <div className="cart-empty-icon">
                                🛒
                            </div>

                            <span>
                                Your cart is empty
                            </span>

                            <h2>
                                Start adding products to your cart
                            </h2>

                            <p>
                                Browse the SmartRetailX catalogue and
                                select the products you would like to
                                purchase.
                            </p>

                            <div className="cart-empty-actions">
                                <Link
                                    className="primary-button"
                                    to="/products"
                                >
                                    Browse products
                                </Link>

                                <Link
                                    className="secondary-button"
                                    to="/"
                                >
                                    Return home
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="cart-page-layout">
                            <div className="cart-items-column">
                                <div className="cart-items-heading">
                                    <div>
                                        <span>
                                            Shopping cart
                                        </span>

                                        <h2>
                                            {cartItems.length} product
                                            {cartItems.length === 1
                                                ? ""
                                                : "s"}
                                        </h2>
                                    </div>

                                    <button
                                        className="cart-clear-button"
                                        type="button"
                                        onClick={handleClearCart}
                                    >
                                        Clear cart
                                    </button>
                                </div>

                                <div className="cart-items-list">
                                    {cartItems.map((item) => {
                                        const itemTotal =
                                            item.price *
                                            item.quantity;

                                        return (
                                            <article
                                                className="cart-item-card"
                                                key={item.id}
                                            >
                                                <div className="cart-item-visual">
                                                    <div className="cart-item-image-wrapper">
                                                        {item.image_url ? (
                                                            <>
                                                                <img
                                                                    className="cart-item-image"
                                                                    src={item.image_url}
                                                                    alt={item.name}
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
                                                                    className="cart-item-image-fallback"
                                                                    style={{ display: "none" }}
                                                                >
                                                                    {item.category
                                                                        ?.charAt(0)
                                                                        .toUpperCase() ||
                                                                        "P"}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <span className="cart-item-image-fallback">
                                                                {item.category
                                                                    ?.charAt(0)
                                                                    .toUpperCase() ||
                                                                    "P"}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <small>
                                                        {item.category}
                                                    </small>
                                                </div>

                                                <div className="cart-item-information">
                                                    <div className="cart-item-title-row">
                                                        <div>
                                                            <span>
                                                                Product #
                                                                {item.id}
                                                            </span>

                                                            <h3>
                                                                {item.name}
                                                            </h3>
                                                        </div>

                                                        <button
                                                            className="cart-remove-button"
                                                            type="button"
                                                            onClick={() => {
                                                                handleRemoveItem(
                                                                    item
                                                                );
                                                            }}
                                                            aria-label={
                                                                `Remove ${item.name}`
                                                            }
                                                        >
                                                            ×
                                                        </button>
                                                    </div>

                                                    <p>
                                                        {item.description}
                                                    </p>

                                                    <div className="cart-item-meta">
                                                        <div>
                                                            <span>
                                                                Unit price
                                                            </span>

                                                            <strong>
                                                                LKR{" "}
                                                                {formatPrice(
                                                                    item.price
                                                                )}
                                                            </strong>
                                                        </div>

                                                        <div>
                                                            <span>
                                                                Available stock
                                                            </span>

                                                            <strong>
                                                                {item.stock}
                                                            </strong>
                                                        </div>

                                                        <div>
                                                            <span>
                                                                Item total
                                                            </span>

                                                            <strong>
                                                                LKR{" "}
                                                                {formatPrice(
                                                                    itemTotal
                                                                )}
                                                            </strong>
                                                        </div>
                                                    </div>

                                                    <div className="cart-item-footer">
                                                        <div className="cart-quantity-control">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    handleDecreaseQuantity(
                                                                        item.id
                                                                    );
                                                                }}
                                                            >
                                                                −
                                                            </button>

                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max={item.stock}
                                                                value={
                                                                    item.quantity
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) => {
                                                                    handleQuantityInput(
                                                                        item.id,
                                                                        event
                                                                            .target
                                                                            .value
                                                                    );
                                                                }}
                                                            />

                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    handleIncreaseQuantity(
                                                                        item.id
                                                                    );
                                                                }}
                                                                disabled={
                                                                    item.quantity >=
                                                                    item.stock
                                                                }
                                                            >
                                                                +
                                                            </button>
                                                        </div>

                                                        <Link
                                                            className="cart-view-product-link"
                                                            to={
                                                                `/products/` +
                                                                `${item.id}`
                                                            }
                                                        >
                                                            View product
                                                        </Link>
                                                    </div>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>

                                <div className="cart-continue-shopping">
                                    <Link to="/products">
                                        ← Continue shopping
                                    </Link>
                                </div>
                            </div>

                            <aside className="cart-summary-card">
                                <div className="cart-summary-heading">
                                    <span>
                                        Checkout summary
                                    </span>

                                    <h2>
                                        Order total
                                    </h2>

                                    <p>
                                        Review your estimated charges
                                        before proceeding.
                                    </p>
                                </div>

                                <div className="cart-summary-lines">
                                    <div>
                                        <span>
                                            Subtotal
                                        </span>

                                        <strong>
                                            LKR{" "}
                                            {formatPrice(
                                                cartSubtotal
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Delivery fee
                                        </span>

                                        <strong>
                                            {estimatedDeliveryFee === 0
                                                ? "Free"
                                                : `LKR ${formatPrice(
                                                      estimatedDeliveryFee
                                                  )}`}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Number of items
                                        </span>

                                        <strong>
                                            {cartItemCount}
                                        </strong>
                                    </div>
                                </div>

                                {estimatedDeliveryFee === 0 ? (
                                    <div className="cart-free-delivery-message">
                                        <span>✓</span>

                                        <p>
                                            You qualify for free
                                            delivery.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="cart-delivery-message">
                                        <span>🚚</span>

                                        <p>
                                            Spend LKR{" "}
                                            {formatPrice(
                                                100000 -
                                                    cartSubtotal
                                            )}{" "}
                                            more for free delivery.
                                        </p>
                                    </div>
                                )}

                                <div className="cart-summary-total">
                                    <span>
                                        Estimated total
                                    </span>

                                    <strong>
                                        LKR{" "}
                                        {formatPrice(orderTotal)}
                                    </strong>
                                </div>

                                <button
                                    className="cart-checkout-button"
                                    type="button"
                                    onClick={handleCheckout}
                                >
                                    Proceed to checkout
                                    <span>→</span>
                                </button>

                                <div className="cart-checkout-security">
                                    <div>
                                        🔐
                                    </div>

                                    <p>
                                        You can browse and build your cart
                                        without signing in. Authentication
                                        is required only when confirming
                                        checkout.
                                    </p>
                                </div>

                                <div className="cart-summary-benefits">
                                    <div>
                                        <span>✓</span>
                                        Secure JWT checkout
                                    </div>

                                    <div>
                                        <span>✓</span>
                                        Automatic stock update
                                    </div>

                                    <div>
                                        <span>✓</span>
                                        Order notification created
                                    </div>
                                </div>
                            </aside>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};


export default Cart;