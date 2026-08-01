import { useEffect, useState } from "react";
import {
    Link,
    useLocation,
    useNavigate
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";


const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const { login } = useAuth();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [showPassword, setShowPassword] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [informationMessage, setInformationMessage] =
        useState("");


    useEffect(() => {
        const checkoutMessage =
            location.state?.checkoutMessage;

        const registrationSuccess =
            location.state?.registrationSuccess;

        if (checkoutMessage) {
            setInformationMessage(
                checkoutMessage
            );
        } else if (registrationSuccess) {
            setInformationMessage(
                "Your account was created successfully. Please sign in."
            );
        }
    }, [location.state]);


    const handleChange = (event) => {
        const {
            name,
            value
        } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value
        }));

        if (error) {
            setError("");
        }
    };


    const handleSubmit = async (event) => {
        event.preventDefault();

        setLoading(true);
        setError("");

        try {
            const result =
                await login(formData);

            const requestedDestination =
                location.state?.from;

            let destination;

            if (
                result.user?.role === "admin"
            ) {
                destination = "/admin";
            } else if (
                requestedDestination &&
                requestedDestination.startsWith(
                    "/checkout"
                )
            ) {
                destination =
                    requestedDestination;
            } else {
                destination = "/customer";
            }

            navigate(
                destination,
                {
                    replace: true,
                    state: {
                        loginSuccess: true
                    }
                }
            );
        } catch (requestError) {
            const detail =
                requestError.response?.data?.detail;

            setError(
                typeof detail === "string"
                    ? detail
                    : "Invalid email or password. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };


    return (
        <main className="login-page">
            <div className="login-background-shape login-shape-one" />
            <div className="login-background-shape login-shape-two" />
            <div className="login-background-shape login-shape-three" />

            <section className="login-container">
                <div className="login-brand-panel">
                    <div className="brand-badge">
                        <span className="brand-badge-icon">
                            ✦
                        </span>

                        SmartRetailX
                    </div>

                    <div className="brand-content">
                        <p className="brand-eyebrow">
                            Cloud-powered retail experience
                        </p>

                        <h1>
                            Shop smarter.
                            <span>
                                Manage faster.
                            </span>
                        </h1>

                        <p className="brand-description">
                            Access products, orders and notifications
                            through one secure and intelligent retail
                            platform.
                        </p>
                    </div>

                    <div className="feature-grid">
                        <div className="feature-card">
                            <div className="feature-icon">
                                🛍️
                            </div>

                            <div>
                                <h3>
                                    Smart shopping
                                </h3>

                                <p>
                                    Browse products and place orders
                                    quickly.
                                </p>
                            </div>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                🔔
                            </div>

                            <div>
                                <h3>
                                    Live updates
                                </h3>

                                <p>
                                    Receive notifications for every
                                    order stage.
                                </p>
                            </div>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                🔐
                            </div>

                            <div>
                                <h3>
                                    Secure access
                                </h3>

                                <p>
                                    Protected customer and admin
                                    experiences.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="brand-footer-note">
                        <span className="status-dot" />

                        All backend services are connected
                    </div>
                </div>

                <div className="login-form-panel">
                    <div className="mobile-brand">
                        <div className="brand-badge">
                            <span className="brand-badge-icon">
                                ✦
                            </span>

                            SmartRetailX
                        </div>
                    </div>

                    <div className="login-form-wrapper">
                        <div className="login-heading">
                            <span className="welcome-chip">
                                Welcome back
                            </span>

                            <h2>
                                Sign in to your account
                            </h2>

                            <p>
                                Enter your registered credentials to
                                continue.
                            </p>
                        </div>

                        {informationMessage && (
                            <div
                                className="login-information-message"
                                role="status"
                            >
                                <span>
                                    ℹ
                                </span>

                                <p>
                                    {informationMessage}
                                </p>
                            </div>
                        )}

                        <form
                            className="login-form"
                            onSubmit={handleSubmit}
                        >
                            <div className="form-group">
                                <label
                                    className="form-label"
                                    htmlFor="email"
                                >
                                    Email address
                                </label>

                                <div className="input-wrapper">
                                    <span className="input-icon">
                                        ✉
                                    </span>

                                    <input
                                        id="email"
                                        className="form-control login-input"
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="name@example.com"
                                        autoComplete="email"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <div className="password-label-row">
                                    <label
                                        className="form-label"
                                        htmlFor="password"
                                    >
                                        Password
                                    </label>

                                    <button
                                        className="forgot-password-button"
                                        type="button"
                                    >
                                        Forgot password?
                                    </button>
                                </div>

                                <div className="input-wrapper">
                                    <span className="input-icon">
                                        ●
                                    </span>

                                    <input
                                        id="password"
                                        className="form-control login-input password-input"
                                        type={
                                            showPassword
                                                ? "text"
                                                : "password"
                                        }
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
                                        required
                                    />

                                    <button
                                        className="password-toggle"
                                        type="button"
                                        onClick={() => {
                                            setShowPassword(
                                                (
                                                    currentValue
                                                ) =>
                                                    !currentValue
                                            );
                                        }}
                                        aria-label={
                                            showPassword
                                                ? "Hide password"
                                                : "Show password"
                                        }
                                    >
                                        {showPassword
                                            ? "Hide"
                                            : "Show"}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div
                                    className="error-message login-error"
                                    role="alert"
                                >
                                    <span>
                                        ⚠
                                    </span>

                                    {error}
                                </div>
                            )}

                            <button
                                className="primary-button login-submit-button"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="button-spinner" />
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        Sign in
                                        <span className="button-arrow">
                                            →
                                        </span>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="login-divider">
                            <span />

                            <p>
                                New to SmartRetailX?
                            </p>

                            <span />
                        </div>

                        <Link
                            className="register-link-button"
                            to="/register"
                            state={{
                                from:
                                    location.state?.from ||
                                    null,
                                checkoutMessage:
                                    location.state
                                        ?.checkoutMessage ||
                                    null
                            }}
                        >
                            Create a customer account
                        </Link>

                        <Link
                            className="login-return-home-link"
                            to="/"
                        >
                            ← Return to store
                        </Link>

                        <p className="login-security-note">
                            By signing in, you agree to use this platform
                            responsibly and securely.
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
};


export default Login;