import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    Link,
    useLocation,
    useNavigate
} from "react-router-dom";

import {
    orderAPI,
    productAPI
} from "../../api/axiosConfig";

import { useAuth } from "../../context/AuthContext";
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


const Checkout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const {
        isAuthenticated,
        isAdmin,
        user
    } = useAuth();

    const {
        cartItems,
        cartItemCount,
        cartSubtotal,
        isCartEmpty,
        clearCart,
        refreshCartProduct
    } = useCart();


    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        district: "",
        postalCode: "",
        deliveryNote: ""
    });

    const [placingOrder, setPlacingOrder] =
        useState(false);

    const [validatingCart, setValidatingCart] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [createdOrders, setCreatedOrders] =
        useState([]);


    const deliveryFee = useMemo(() => {
        if (cartSubtotal === 0) {
            return 0;
        }

        return cartSubtotal >= 100000
            ? 0
            : 1500;
    }, [cartSubtotal]);


    const orderTotal =
        cartSubtotal + deliveryFee;


    useEffect(() => {
        if (!user) {
            return;
        }

        const userEmail =
            user.email ||
            user.sub ||
            "";

        setFormData((currentData) => ({
            ...currentData,
            email:
                currentData.email ||
                userEmail
        }));
    }, [user]);


    const handleChange = (event) => {
        const {
            name,
            value
        } = event.target;

        setFormData((currentData) => ({
            ...currentData,
            [name]: value
        }));

        if (error) {
            setError("");
        }

        if (success) {
            setSuccess("");
        }
    };


    const validateDeliveryForm = () => {
        if (!formData.fullName.trim()) {
            return "Please enter the recipient's full name.";
        }

        if (!formData.email.trim()) {
            return "Please enter an email address.";
        }

        if (!formData.phone.trim()) {
            return "Please enter a contact number.";
        }

        if (!formData.addressLine1.trim()) {
            return "Please enter the delivery address.";
        }

        if (!formData.city.trim()) {
            return "Please enter the city.";
        }

        if (!formData.district.trim()) {
            return "Please enter the district.";
        }

        return "";
    };


    const validateCartStock = async () => {
        setValidatingCart(true);

        try {
            for (const item of cartItems) {
                const response =
                    await productAPI.get(
                        `/${item.id}`
                    );

                const latestProduct =
                    response.data;

                refreshCartProduct(
                    latestProduct
                );

                if (
                    Number(latestProduct.stock) <
                    Number(item.quantity)
                ) {
                    throw new Error(
                        `Only ${latestProduct.stock} unit(s) ` +
                        `of ${latestProduct.name} are available.`
                    );
                }
            }

            return true;
        } catch (validationError) {
            setError(
                validationError.response
                    ? formatBackendError(
                          validationError,
                          "Unable to verify product availability."
                      )
                    : validationError.message
            );

            return false;
        } finally {
            setValidatingCart(false);
        }
    };


    const redirectToLogin = () => {
        navigate(
            "/login",
            {
                state: {
                    from:
                        location.pathname +
                        location.search,
                    checkoutMessage:
                        "Please sign in to complete your checkout."
                }
            }
        );
    };


    const handleCheckout = async () => {
        setError("");
        setSuccess("");

        if (isCartEmpty) {
            setError(
                "Your cart is empty. Add products before checkout."
            );

            return;
        }

        if (!isAuthenticated) {
            redirectToLogin();
            return;
        }

        if (isAdmin) {
            setError(
                "Administrator accounts cannot place customer orders."
            );

            return;
        }

        const formError =
            validateDeliveryForm();

        if (formError) {
            setError(formError);
            return;
        }

        const stockIsValid =
            await validateCartStock();

        if (!stockIsValid) {
            return;
        }

        setPlacingOrder(true);

        const successfulOrders = [];

        try {
            for (const item of cartItems) {
                const response =
                    await orderAPI.post(
                        "/",
                        {
                            product_id: item.id,
                            quantity: item.quantity
                        }
                    );

                successfulOrders.push(
                    response.data?.order ||
                    response.data
                );
            }

            setCreatedOrders(
                successfulOrders
            );

            setSuccess(
                successfulOrders.length === 1
                    ? "Your order was placed successfully."
                    : `${successfulOrders.length} orders were placed successfully.`
            );

            clearCart();
        } catch (requestError) {
            setCreatedOrders(
                successfulOrders
            );

            const defaultMessage =
                successfulOrders.length > 0
                    ? `${successfulOrders.length} order(s) were created, ` +
                      "but checkout stopped before all items were completed."
                    : "Unable to complete checkout.";

            setError(
                formatBackendError(
                    requestError,
                    defaultMessage
                )
            );
        } finally {
            setPlacingOrder(false);
        }
    };


    if (isCartEmpty && createdOrders.length === 0) {
        return (
            <div className="checkout-page">
                <section className="checkout-empty-section">
                    <div className="checkout-empty-card">
                        <div className="checkout-empty-icon">
                            🛒
                        </div>

                        <span>
                            Checkout unavailable
                        </span>

                        <h1>
                            Your cart is currently empty
                        </h1>

                        <p>
                            Add products to your cart before
                            proceeding to checkout.
                        </p>

                        <div className="checkout-empty-actions">
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
                </section>
            </div>
        );
    }


    if (
        createdOrders.length > 0 &&
        isCartEmpty
    ) {
        return (
            <div className="checkout-page">
                <section className="checkout-success-section">
                    <div className="checkout-success-card">
                        <div className="checkout-success-icon">
                            ✓
                        </div>

                        <span>
                            Checkout completed
                        </span>

                        <h1>
                            Thank you for your order
                        </h1>

                        <p>
                            Your order records were created and
                            notification updates will appear in your
                            customer account.
                        </p>

                        <div className="checkout-success-orders">
                            {createdOrders.map(
                                (
                                    order,
                                    index
                                ) => (
                                    <article
                                        key={
                                            order?.id ||
                                            index
                                        }
                                    >
                                        <span>
                                            Order reference
                                        </span>

                                        <strong>
                                            #
                                            {order?.id ||
                                                index + 1}
                                        </strong>

                                        <small>
                                            {order?.product_name ||
                                                "SmartRetailX product"}
                                        </small>
                                    </article>
                                )
                            )}
                        </div>

                        <div className="checkout-success-actions">
                            <Link
                                className="primary-button"
                                to="/customer/orders"
                            >
                                View my orders
                            </Link>

                            <Link
                                className="secondary-button"
                                to="/products"
                            >
                                Continue shopping
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        );
    }


    return (
        <div className="checkout-page">
            <section className="checkout-hero">
                <div className="checkout-container">
                    <div className="checkout-hero-content">
                        <span>
                            Secure checkout
                        </span>

                        <h1>
                            Complete your
                            <strong> purchase</strong>
                        </h1>

                        <p>
                            Review your items, provide delivery
                            information and authenticate before
                            confirming the order.
                        </p>
                    </div>

                    <div className="checkout-progress">
                        <div className="checkout-progress-step complete">
                            <b>1</b>
                            <span>Cart</span>
                        </div>

                        <div className="checkout-progress-line complete" />

                        <div className="checkout-progress-step active">
                            <b>2</b>
                            <span>Checkout</span>
                        </div>

                        <div className="checkout-progress-line" />

                        <div className="checkout-progress-step">
                            <b>3</b>
                            <span>Complete</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="checkout-content-section">
                <div className="checkout-container">
                    {!isAuthenticated && (
                        <div className="checkout-login-notice">
                            <div>
                                🔐
                            </div>

                            <div>
                                <strong>
                                    Sign in required at final confirmation
                                </strong>

                                <p>
                                    You can review and complete this form
                                    as a guest. When you confirm checkout,
                                    you will be redirected to login and
                                    returned here afterward.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={redirectToLogin}
                            >
                                Sign in now
                            </button>
                        </div>
                    )}

                    {error && (
                        <div
                            className="error-message checkout-alert"
                            role="alert"
                        >
                            <span>⚠</span>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div
                            className="success-message checkout-alert"
                            role="status"
                        >
                            <span>✓</span>
                            {success}
                        </div>
                    )}

                    <div className="checkout-layout">
                        <div className="checkout-form-column">
                            <section className="checkout-form-card">
                                <div className="checkout-card-heading">
                                    <div>
                                        <span>
                                            Delivery information
                                        </span>

                                        <h2>
                                            Where should we deliver?
                                        </h2>

                                        <p>
                                            These details are used for
                                            this checkout interface.
                                        </p>
                                    </div>

                                    <div className="checkout-heading-icon">
                                        🚚
                                    </div>
                                </div>

                                <div className="checkout-form-grid">
                                    <div className="form-group">
                                        <label
                                            className="form-label"
                                            htmlFor="checkout-full-name"
                                        >
                                            Full name
                                        </label>

                                        <input
                                            id="checkout-full-name"
                                            className="form-control"
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            placeholder="Recipient's full name"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label
                                            className="form-label"
                                            htmlFor="checkout-email"
                                        >
                                            Email address
                                        </label>

                                        <input
                                            id="checkout-email"
                                            className="form-control"
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="name@example.com"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label
                                            className="form-label"
                                            htmlFor="checkout-phone"
                                        >
                                            Contact number
                                        </label>

                                        <input
                                            id="checkout-phone"
                                            className="form-control"
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="+94 7X XXX XXXX"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label
                                            className="form-label"
                                            htmlFor="checkout-postal-code"
                                        >
                                            Postal code
                                        </label>

                                        <input
                                            id="checkout-postal-code"
                                            className="form-control"
                                            type="text"
                                            name="postalCode"
                                            value={formData.postalCode}
                                            onChange={handleChange}
                                            placeholder="Postal code"
                                        />
                                    </div>

                                    <div className="form-group checkout-full-width">
                                        <label
                                            className="form-label"
                                            htmlFor="checkout-address-one"
                                        >
                                            Address line 1
                                        </label>

                                        <input
                                            id="checkout-address-one"
                                            className="form-control"
                                            type="text"
                                            name="addressLine1"
                                            value={formData.addressLine1}
                                            onChange={handleChange}
                                            placeholder="House number and street"
                                            required
                                        />
                                    </div>

                                    <div className="form-group checkout-full-width">
                                        <label
                                            className="form-label"
                                            htmlFor="checkout-address-two"
                                        >
                                            Address line 2
                                        </label>

                                        <input
                                            id="checkout-address-two"
                                            className="form-control"
                                            type="text"
                                            name="addressLine2"
                                            value={formData.addressLine2}
                                            onChange={handleChange}
                                            placeholder="Apartment, landmark or additional information"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label
                                            className="form-label"
                                            htmlFor="checkout-city"
                                        >
                                            City
                                        </label>

                                        <input
                                            id="checkout-city"
                                            className="form-control"
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            placeholder="City"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label
                                            className="form-label"
                                            htmlFor="checkout-district"
                                        >
                                            District
                                        </label>

                                        <input
                                            id="checkout-district"
                                            className="form-control"
                                            type="text"
                                            name="district"
                                            value={formData.district}
                                            onChange={handleChange}
                                            placeholder="District"
                                            required
                                        />
                                    </div>

                                    <div className="form-group checkout-full-width">
                                        <label
                                            className="form-label"
                                            htmlFor="checkout-note"
                                        >
                                            Delivery note
                                        </label>

                                        <textarea
                                            id="checkout-note"
                                            className="form-control checkout-textarea"
                                            name="deliveryNote"
                                            value={formData.deliveryNote}
                                            onChange={handleChange}
                                            placeholder="Optional instructions for delivery"
                                            rows="4"
                                        />
                                    </div>
                                </div>
                            </section>

                            <section className="checkout-payment-card">
                                <div className="checkout-card-heading">
                                    <div>
                                        <span>
                                            Payment method
                                        </span>

                                        <h2>
                                            Payment demonstration
                                        </h2>

                                        <p>
                                            No real payment gateway is
                                            connected in the current MVP.
                                        </p>
                                    </div>

                                    <div className="checkout-heading-icon">
                                        💳
                                    </div>
                                </div>

                                <label className="checkout-payment-option selected">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        defaultChecked
                                    />

                                    <div>
                                        <strong>
                                            Cash on delivery
                                        </strong>

                                        <p>
                                            Pay when the order is
                                            delivered.
                                        </p>
                                    </div>

                                    <span>
                                        Selected
                                    </span>
                                </label>
                            </section>
                        </div>

                        <aside className="checkout-summary-card">
                            <div className="checkout-summary-heading">
                                <span>
                                    Order summary
                                </span>

                                <h2>
                                    {cartItemCount} item
                                    {cartItemCount === 1
                                        ? ""
                                        : "s"}
                                </h2>

                                <Link to="/cart">
                                    Edit cart
                                </Link>
                            </div>

                            <div className="checkout-summary-items">
                                {cartItems.map((item) => (
                                    <article
                                        key={item.id}
                                    >
                                        <div className="checkout-item-icon">
                                            {item.image_url ? (
                                                <>
                                                    <img
                                                        className="checkout-item-image"
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
                                                        className="checkout-item-image-fallback"
                                                        style={{ display: "none" }}
                                                    >
                                                        {item.category
                                                            ?.charAt(0)
                                                            .toUpperCase() ||
                                                            "P"}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="checkout-item-image-fallback">
                                                    {item.category
                                                        ?.charAt(0)
                                                        .toUpperCase() ||
                                                        "P"}
                                                </span>
                                            )}
                                        </div>

                                        <div className="checkout-item-details">
                                            <strong>
                                                {item.name}
                                            </strong>

                                            <span>
                                                Qty: {item.quantity}
                                            </span>

                                            <small>
                                                LKR{" "}
                                                {formatPrice(
                                                    item.price
                                                )}{" "}
                                                each
                                            </small>
                                        </div>

                                        <b>
                                            LKR{" "}
                                            {formatPrice(
                                                item.price *
                                                    item.quantity
                                            )}
                                        </b>
                                    </article>
                                ))}
                            </div>

                            <div className="checkout-summary-lines">
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
                                        {deliveryFee === 0
                                            ? "Free"
                                            : `LKR ${formatPrice(
                                                  deliveryFee
                                              )}`}
                                    </strong>
                                </div>
                            </div>

                            <div className="checkout-summary-total">
                                <span>
                                    Total amount
                                </span>

                                <strong>
                                    LKR{" "}
                                    {formatPrice(
                                        orderTotal
                                    )}
                                </strong>
                            </div>

                            <button
                                className="checkout-confirm-button"
                                type="button"
                                onClick={handleCheckout}
                                disabled={
                                    placingOrder ||
                                    validatingCart
                                }
                            >
                                {validatingCart ? (
                                    <>
                                        <span className="button-spinner" />
                                        Checking stock...
                                    </>
                                ) : placingOrder ? (
                                    <>
                                        <span className="button-spinner" />
                                        Placing orders...
                                    </>
                                ) : !isAuthenticated ? (
                                    <>
                                        Sign in and checkout
                                        <span>→</span>
                                    </>
                                ) : (
                                    <>
                                        Confirm and place orders
                                        <span>→</span>
                                    </>
                                )}
                            </button>

                            <div className="checkout-security-list">
                                <div>
                                    <span>🔐</span>

                                    <p>
                                        JWT authentication protects
                                        order creation.
                                    </p>
                                </div>

                                <div>
                                    <span>📦</span>

                                    <p>
                                        Product stock is checked before
                                        placing orders.
                                    </p>
                                </div>

                                <div>
                                    <span>🔔</span>

                                    <p>
                                        Notifications are created by
                                        the connected service workflow.
                                    </p>
                                </div>
                            </div>

                            <p className="checkout-mvp-note">
                                Each cart item is currently submitted
                                as a separate order because the existing
                                Order Service accepts one product per
                                request.
                            </p>
                        </aside>
                    </div>
                </div>
            </section>
        </div>
    );
};


export default Checkout;