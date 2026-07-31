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

import CustomerDashboard from "../pages/customer/CustomerDashboard";
import Products from "../pages/customer/Products";
import ProductDetails from "../pages/customer/ProductDetails";
import MyOrders from "../pages/customer/MyOrders";
import Notifications from "../pages/customer/Notifications";


const AdminDashboardPlaceholder = () => {
    const {
        user,
        logout
    } = useAuth();

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
                        {user?.sub ||
                            user?.email ||
                            "Administrator"}
                    </strong>
                </p>

                <p className="temporary-dashboard-description">
                    Product management, order administration,
                    notifications and dashboard analytics will be
                    added next.
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

                <h1>
                    Page not found
                </h1>

                <p>
                    The page you requested does not exist or may
                    have moved.
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


const Unauthorized = () => {
    return (
        <main className="not-found-page">
            <section className="not-found-card">
                <div className="temporary-dashboard-icon">
                    🔒
                </div>

                <h1>
                    Access denied
                </h1>

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
    );
};


const LoadingScreen = ({ message }) => {
    return (
        <main className="route-loading-page">
            <div className="route-loading-card">
                <div className="route-loading-logo">
                    ✦
                </div>

                <div className="route-loading-spinner" />

                <h2>
                    Loading SmartRetailX
                </h2>

                <p>
                    {message}
                </p>
            </div>
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
            <LoadingScreen message="Preparing your account..." />
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
            <LoadingScreen message="Checking your session..." />
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
            {/* Home */}
            <Route
                path="/"
                element={<HomeRedirect />}
            />

            {/* Public authentication routes */}
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

            {/* Customer dashboard */}
            <Route
                path="/customer"
                element={
                    <ProtectedRoute allowedRoles={["customer"]}>
                        <CustomerDashboard />
                    </ProtectedRoute>
                }
            />

            {/* Customer product catalogue */}
            <Route
                path="/customer/products"
                element={
                    <ProtectedRoute allowedRoles={["customer"]}>
                        <Products />
                    </ProtectedRoute>
                }
            />

            {/* Customer product details */}
            <Route
                path="/customer/products/:productId"
                element={
                    <ProtectedRoute allowedRoles={["customer"]}>
                        <ProductDetails />
                    </ProtectedRoute>
                }
            />

            {/* Customer orders */}
            <Route
                path="/customer/orders"
                element={
                    <ProtectedRoute allowedRoles={["customer"]}>
                        <MyOrders />
                    </ProtectedRoute>
                }
            />

            {/* Customer notifications */}
            <Route
                path="/customer/notifications"
                element={
                    <ProtectedRoute allowedRoles={["customer"]}>
                        <Notifications />
                    </ProtectedRoute>
                }
            />

            {/* Admin dashboard */}
            <Route
                path="/admin"
                element={
                    <AdminRoute>
                        <AdminDashboardPlaceholder />
                    </AdminRoute>
                }
            />

            {/* Access denied */}
            <Route
                path="/unauthorized"
                element={<Unauthorized />}
            />

            {/* Invalid routes */}
            <Route
                path="*"
                element={<NotFound />}
            />
        </Routes>
    );
};


export default AppRoutes;