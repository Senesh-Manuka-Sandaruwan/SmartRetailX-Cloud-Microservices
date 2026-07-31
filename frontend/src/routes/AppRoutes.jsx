import {
    Navigate,
    Route,
    Routes
} from "react-router-dom";

import AdminRoute from "../components/AdminRoute";
import ProtectedRoute from "../components/ProtectedRoute";

import { useAuth } from "../context/AuthContext";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";


const CustomerDashboardPlaceholder = () => {
    const { user, logout } = useAuth();

    return (
        <main className="temporary-dashboard-page">
            <section className="temporary-dashboard-card">
                <div className="temporary-dashboard-icon">
                    🛍️
                </div>

                <span className="welcome-chip">
                    Customer area
                </span>

                <h1>
                    Welcome to SmartRetailX
                </h1>

                <p>
                    Signed in as{" "}
                    <strong>
                        {user?.sub || user?.email || "Customer"}
                    </strong>
                </p>

                <p className="temporary-dashboard-description">
                    Your customer dashboard is ready. Product browsing,
                    shopping cart, orders and notifications will be added next.
                </p>

                <button
                    className="primary-button"
                    type="button"
                    onClick={logout}
                >
                    Sign out
                </button>
            </section>
        </main>
    );
};


const AdminDashboardPlaceholder = () => {
    const { user, logout } = useAuth();

    return (
        <main className="temporary-dashboard-page admin-placeholder-page">
            <section className="temporary-dashboard-card admin-placeholder-card">
                <div className="temporary-dashboard-icon admin-dashboard-icon">
                    ⚙️
                </div>

                <span className="welcome-chip">
                    Administrator area
                </span>

                <h1>
                    SmartRetailX Admin Dashboard
                </h1>

                <p>
                    Signed in as{" "}
                    <strong>
                        {user?.sub || user?.email || "Administrator"}
                    </strong>
                </p>

                <p className="temporary-dashboard-description">
                    Product management, order administration, notifications
                    and dashboard analytics will be added next.
                </p>

                <button
                    className="primary-button"
                    type="button"
                    onClick={logout}
                >
                    Sign out
                </button>
            </section>
        </main>
    );
};


const NotFound = () => {
    return (
        <main className="not-found-page">
            <section className="not-found-card">
                <div className="not-found-number">
                    404
                </div>

                <h1>Page not found</h1>

                <p>
                    The page you requested does not exist or may have moved.
                </p>

                <a
                    className="primary-button"
                    href="/"
                >
                    Return home
                </a>
            </section>
        </main>
    );
};


const HomeRedirect = () => {
    const {
        loading,
        isAuthenticated,
        isAdmin
    } = useAuth();

    if (loading) {
        return (
            <main className="route-loading-page">
                <div className="route-loading-card">
                    <div className="route-loading-logo">
                        ✦
                    </div>

                    <div className="route-loading-spinner" />

                    <h2>Loading SmartRetailX</h2>

                    <p>
                        Preparing your account...
                    </p>
                </div>
            </main>
        );
    }

    if (!isAuthenticated) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    return (
        <Navigate
            to={isAdmin ? "/admin" : "/customer"}
            replace
        />
    );
};


const PublicOnlyRoute = ({ children }) => {
    const {
        loading,
        isAuthenticated,
        isAdmin
    } = useAuth();

    if (loading) {
        return (
            <main className="route-loading-page">
                <div className="route-loading-card">
                    <div className="route-loading-logo">
                        ✦
                    </div>

                    <div className="route-loading-spinner" />

                    <h2>Loading SmartRetailX</h2>

                    <p>
                        Checking your session...
                    </p>
                </div>
            </main>
        );
    }

    if (isAuthenticated) {
        return (
            <Navigate
                to={isAdmin ? "/admin" : "/customer"}
                replace
            />
        );
    }

    return children;
};


const AppRoutes = () => {
    return (
        <Routes>
            <Route
                path="/"
                element={<HomeRedirect />}
            />

            <Route
                path="/login"
                element={
                    <PublicOnlyRoute>
                        <Login />
                    </PublicOnlyRoute>
                }
            />

            <Route
                path="/register"
                element={
                    <PublicOnlyRoute>
                        <Register />
                    </PublicOnlyRoute>
                }
            />

            <Route
                path="/customer"
                element={
                    <ProtectedRoute allowedRoles={["customer"]}>
                        <CustomerDashboardPlaceholder />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin"
                element={
                    <AdminRoute>
                        <AdminDashboardPlaceholder />
                    </AdminRoute>
                }
            />

            <Route
                path="/unauthorized"
                element={
                    <main className="not-found-page">
                        <section className="not-found-card">
                            <div className="temporary-dashboard-icon">
                                🔒
                            </div>

                            <h1>Access denied</h1>

                            <p>
                                You do not have permission to access this
                                section.
                            </p>

                            <a
                                className="primary-button"
                                href="/"
                            >
                                Return to dashboard
                            </a>
                        </section>
                    </main>
                }
            />

            <Route
                path="*"
                element={<NotFound />}
            />
        </Routes>
    );
};


export default AppRoutes;