import {
    useMemo,
    useState
} from "react";

import {
    Link,
    useLocation,
    useNavigate
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";


const getPasswordStrength = (password) => {
    let score = 0;

    if (password.length >= 8) {
        score += 1;
    }

    if (/[A-Z]/.test(password)) {
        score += 1;
    }

    if (/[a-z]/.test(password)) {
        score += 1;
    }

    if (/\d/.test(password)) {
        score += 1;
    }

    if (/[^A-Za-z0-9]/.test(password)) {
        score += 1;
    }

    if (score <= 2) {
        return {
            label: "Weak",
            level: 1
        };
    }

    if (score <= 4) {
        return {
            label: "Medium",
            level: 2
        };
    }

    return {
        label: "Strong",
        level: 3
    };
};


const formatBackendError = (requestError) => {
    const detail =
        requestError.response?.data?.detail;

    if (typeof detail === "string") {
        return detail;
    }

    if (
        Array.isArray(detail) &&
        detail.length > 0
    ) {
        return detail
            .map((item) => item.msg)
            .filter(Boolean)
            .join(" ");
    }

    return (
        "Registration failed. Please check your " +
        "details and try again."
    );
};


const Register = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const { register } = useAuth();

    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const [showPassword, setShowPassword] =
        useState(false);

    const [
        showConfirmPassword,
        setShowConfirmPassword
    ] = useState(false);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");


    const requestedDestination =
        location.state?.from || null;


    const checkoutMessage =
        location.state?.checkoutMessage || "";


    const passwordStrength = useMemo(
        () =>
            getPasswordStrength(
                formData.password
            ),
        [formData.password]
    );


    const passwordChecks = useMemo(
        () => ({
            minimumLength:
                formData.password.length >= 8,

            uppercase:
                /[A-Z]/.test(
                    formData.password
                ),

            lowercase:
                /[a-z]/.test(
                    formData.password
                ),

            number:
                /\d/.test(
                    formData.password
                ),

            passwordsMatch:
                formData.password.length > 0 &&
                formData.password ===
                    formData.confirmPassword
        }),
        [
            formData.password,
            formData.confirmPassword
        ]
    );


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

        if (success) {
            setSuccess("");
        }
    };


    const validateForm = () => {
        if (!formData.full_name.trim()) {
            return "Please enter your full name.";
        }

        if (!formData.email.trim()) {
            return "Please enter your email address.";
        }

        if (!passwordChecks.minimumLength) {
            return (
                "Password must contain at least " +
                "8 characters."
            );
        }

        if (!passwordChecks.uppercase) {
            return (
                "Password must contain at least " +
                "one uppercase letter."
            );
        }

        if (!passwordChecks.lowercase) {
            return (
                "Password must contain at least " +
                "one lowercase letter."
            );
        }

        if (!passwordChecks.number) {
            return (
                "Password must contain at least " +
                "one number."
            );
        }

        if (!passwordChecks.passwordsMatch) {
            return "The passwords do not match.";
        }

        return "";
    };


    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        const validationError =
            validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);

        try {
            await register({
                full_name:
                    formData.full_name.trim(),

                email:
                    formData.email
                        .trim()
                        .toLowerCase(),

                password:
                    formData.password
            });

            setSuccess(
                "Your SmartRetailX account " +
                "was created successfully."
            );

            window.setTimeout(() => {
                navigate(
                    "/login",
                    {
                        replace: true,

                        state: {
                            registrationSuccess: true,

                            from:
                                requestedDestination,

                            checkoutMessage:
                                requestedDestination
                                    ?.startsWith(
                                        "/checkout"
                                    )
                                    ? (
                                        "Your account was created. " +
                                        "Sign in to return to checkout."
                                    )
                                    : checkoutMessage
                        }
                    }
                );
            }, 1200);
        } catch (requestError) {
            setError(
                formatBackendError(
                    requestError
                )
            );
        } finally {
            setLoading(false);
        }
    };


    return (
        <main className="register-page">
            <div className="register-orb register-orb-one" />
            <div className="register-orb register-orb-two" />
            <div className="register-orb register-orb-three" />

            <section className="register-shell">
                <aside className="register-showcase">
                    <div className="brand-badge register-brand-badge">
                        <span className="brand-badge-icon">
                            ✦
                        </span>

                        SmartRetailX
                    </div>

                    <div className="register-showcase-content">
                        <p className="register-eyebrow">
                            Join the smarter retail experience
                        </p>

                        <h1>
                            One account.
                            <span>
                                Everything connected.
                            </span>
                        </h1>

                        <p>
                            Discover products, place orders,
                            track progress and receive important
                            updates from one secure platform.
                        </p>
                    </div>

                    <div className="register-benefits">
                        <div className="register-benefit-card">
                            <span className="register-benefit-icon">
                                ⚡
                            </span>

                            <div>
                                <h3>
                                    Fast ordering
                                </h3>

                                <p>
                                    Build your cart first and
                                    register only when checkout
                                    requires authentication.
                                </p>
                            </div>
                        </div>

                        <div className="register-benefit-card">
                            <span className="register-benefit-icon">
                                📦
                            </span>

                            <div>
                                <h3>
                                    Order tracking
                                </h3>

                                <p>
                                    Follow every stage from
                                    pending to delivery.
                                </p>
                            </div>
                        </div>

                        <div className="register-benefit-card">
                            <span className="register-benefit-icon">
                                🔔
                            </span>

                            <div>
                                <h3>
                                    Instant notifications
                                </h3>

                                <p>
                                    Stay informed whenever your
                                    order status changes.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="register-showcase-footer">
                        <div className="register-avatar-stack">
                            <span>SM</span>
                            <span>AX</span>
                            <span>RX</span>
                        </div>

                        <p>
                            Built for modern customers and
                            retail teams.
                        </p>
                    </div>
                </aside>

                <section className="register-form-panel">
                    <div className="register-mobile-brand">
                        <div className="brand-badge">
                            <span className="brand-badge-icon">
                                ✦
                            </span>

                            SmartRetailX
                        </div>
                    </div>

                    <div className="register-form-wrapper">
                        <header className="register-heading">
                            <span className="welcome-chip">
                                Create account
                            </span>

                            <h2>
                                Start your SmartRetailX journey
                            </h2>

                            <p>
                                Enter your information to create
                                a secure customer account.
                            </p>
                        </header>

                        {requestedDestination?.startsWith(
                            "/checkout"
                        ) && (
                            <div
                                className="register-checkout-message"
                                role="status"
                            >
                                <span>
                                    🛒
                                </span>

                                <div>
                                    <strong>
                                        Your cart is still saved
                                    </strong>

                                    <p>
                                        Create your account, sign in
                                        and you will return directly
                                        to checkout.
                                    </p>
                                </div>
                            </div>
                        )}

                        <form
                            className="register-form"
                            onSubmit={handleSubmit}
                        >
                            <div className="form-group">
                                <label
                                    className="form-label"
                                    htmlFor="full_name"
                                >
                                    Full name
                                </label>

                                <div className="input-wrapper">
                                    <span className="input-icon">
                                        ●
                                    </span>

                                    <input
                                        id="full_name"
                                        className="form-control register-input"
                                        type="text"
                                        name="full_name"
                                        value={
                                            formData.full_name
                                        }
                                        onChange={handleChange}
                                        placeholder="Senesh Sandaruwan"
                                        autoComplete="name"
                                        minLength="2"
                                        maxLength="150"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label
                                    className="form-label"
                                    htmlFor="register-email"
                                >
                                    Email address
                                </label>

                                <div className="input-wrapper">
                                    <span className="input-icon">
                                        ✉
                                    </span>

                                    <input
                                        id="register-email"
                                        className="form-control register-input"
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

                            <div className="register-password-grid">
                                <div className="form-group">
                                    <label
                                        className="form-label"
                                        htmlFor="register-password"
                                    >
                                        Password
                                    </label>

                                    <div className="input-wrapper">
                                        <span className="input-icon">
                                            ●
                                        </span>

                                        <input
                                            id="register-password"
                                            className="form-control register-input password-input"
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            name="password"
                                            value={
                                                formData.password
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Create password"
                                            autoComplete="new-password"
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
                                        >
                                            {showPassword
                                                ? "Hide"
                                                : "Show"}
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label
                                        className="form-label"
                                        htmlFor="confirm-password"
                                    >
                                        Confirm password
                                    </label>

                                    <div className="input-wrapper">
                                        <span className="input-icon">
                                            ✓
                                        </span>

                                        <input
                                            id="confirm-password"
                                            className="form-control register-input password-input"
                                            type={
                                                showConfirmPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            name="confirmPassword"
                                            value={
                                                formData.confirmPassword
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Repeat password"
                                            autoComplete="new-password"
                                            required
                                        />

                                        <button
                                            className="password-toggle"
                                            type="button"
                                            onClick={() => {
                                                setShowConfirmPassword(
                                                    (
                                                        currentValue
                                                    ) =>
                                                        !currentValue
                                                );
                                            }}
                                        >
                                            {showConfirmPassword
                                                ? "Hide"
                                                : "Show"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {formData.password && (
                                <div className="password-strength-panel">
                                    <div className="password-strength-header">
                                        <p>
                                            Password strength
                                        </p>

                                        <span
                                            className={
                                                `strength-label ` +
                                                `strength-level-${passwordStrength.level}`
                                            }
                                        >
                                            {
                                                passwordStrength.label
                                            }
                                        </span>
                                    </div>

                                    <div className="strength-bars">
                                        {[1, 2, 3].map(
                                            (level) => (
                                                <span
                                                    key={level}
                                                    className={
                                                        level <=
                                                        passwordStrength.level
                                                            ? (
                                                                `strength-bar active ` +
                                                                `level-${passwordStrength.level}`
                                                            )
                                                            : "strength-bar"
                                                    }
                                                />
                                            )
                                        )}
                                    </div>

                                    <div className="password-check-grid">
                                        <span
                                            className={
                                                passwordChecks.minimumLength
                                                    ? "password-check complete"
                                                    : "password-check"
                                            }
                                        >
                                            <b>
                                                {
                                                    passwordChecks.minimumLength
                                                        ? "✓"
                                                        : "○"
                                                }
                                            </b>

                                            8 characters
                                        </span>

                                        <span
                                            className={
                                                passwordChecks.uppercase
                                                    ? "password-check complete"
                                                    : "password-check"
                                            }
                                        >
                                            <b>
                                                {
                                                    passwordChecks.uppercase
                                                        ? "✓"
                                                        : "○"
                                                }
                                            </b>

                                            Uppercase
                                        </span>

                                        <span
                                            className={
                                                passwordChecks.lowercase
                                                    ? "password-check complete"
                                                    : "password-check"
                                            }
                                        >
                                            <b>
                                                {
                                                    passwordChecks.lowercase
                                                        ? "✓"
                                                        : "○"
                                                }
                                            </b>

                                            Lowercase
                                        </span>

                                        <span
                                            className={
                                                passwordChecks.number
                                                    ? "password-check complete"
                                                    : "password-check"
                                            }
                                        >
                                            <b>
                                                {
                                                    passwordChecks.number
                                                        ? "✓"
                                                        : "○"
                                                }
                                            </b>

                                            Number
                                        </span>

                                        <span
                                            className={
                                                passwordChecks.passwordsMatch
                                                    ? "password-check complete"
                                                    : "password-check"
                                            }
                                        >
                                            <b>
                                                {
                                                    passwordChecks.passwordsMatch
                                                        ? "✓"
                                                        : "○"
                                                }
                                            </b>

                                            Passwords match
                                        </span>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div
                                    className="error-message register-alert"
                                    role="alert"
                                >
                                    <span>
                                        ⚠
                                    </span>

                                    {error}
                                </div>
                            )}

                            {success && (
                                <div
                                    className="success-message register-alert"
                                    role="status"
                                >
                                    <span>
                                        ✓
                                    </span>

                                    {success}
                                </div>
                            )}

                            <label className="terms-check">
                                <input
                                    type="checkbox"
                                    required
                                />

                                <span>
                                    I agree to use SmartRetailX
                                    responsibly and accept the
                                    platform terms.
                                </span>
                            </label>

                            <button
                                className="primary-button register-submit-button"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="button-spinner" />
                                        Creating account...
                                    </>
                                ) : (
                                    <>
                                        Create account

                                        <span className="button-arrow">
                                            →
                                        </span>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="login-divider register-divider">
                            <span />

                            <p>
                                Already registered?
                            </p>

                            <span />
                        </div>

                        <Link
                            className="register-login-link"
                            to="/login"
                            state={{
                                from:
                                    requestedDestination,

                                checkoutMessage:
                                    requestedDestination
                                        ?.startsWith(
                                            "/checkout"
                                        )
                                        ? (
                                            "Sign in to return to " +
                                            "your checkout."
                                        )
                                        : checkoutMessage
                            }}
                        >
                            Sign in to your account
                        </Link>

                        <Link
                            className="register-return-store-link"
                            to="/"
                        >
                            ← Return to store
                        </Link>
                    </div>
                </section>
            </section>
        </main>
    );
};


export default Register;