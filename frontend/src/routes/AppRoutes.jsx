import {
    Navigate,
    Route,
    Routes
} from "react-router-dom";

import AdminRoute from "../components/AdminRoute";
import ProtectedRoute from "../components/ProtectedRoute";

import { useAuth } from "../context/AuthContext";

import PublicLayout from "../layouts/PublicLayout";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

import Home from "../pages/public/Home";

import CustomerDashboard from "../pages/customer/CustomerDashboard";
import Products from "../pages/customer/Products";
import ProductDetails from "../pages/customer/ProductDetails";
import MyOrders from "../pages/customer/MyOrders";
import Notifications from "../pages/customer/Notifications";
import Cart from "../pages/public/Cart";
import Checkout from "../pages/public/Checkout";
import PublicProducts from "../pages/public/PublicProducts";
import PublicProductDetails from "../pages/public/PublicProductDetails";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminProducts from "../pages/admin/AdminProducts";
import AdminOrders from "../pages/admin/AdminOrders";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminNotifications from "../pages/admin/AdminNotifications";

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

                <p>{message}</p>
            </div>
        </main>
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
                    You do not have permission to access this section.
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
                    The requested page does not exist or may have moved.
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


const AppRoutes = () => {
    return (
        <Routes>
            {/* Public website */}
            <Route element={<PublicLayout />}>
                <Route
                    path="/"
                    element={<Home />}
                />

                <Route
                    path="/products"
                    element={<PublicProducts />}
                />

                <Route
                    path="/products/:productId"
                    element={<PublicProductDetails />}
                />

                <Route
                    path="/cart"
                    element={<Cart />}
                />

                <Route
                    path="/checkout"
                    element={<Checkout />}
                />

            </Route>

            {/* Public authentication */}
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

            <Route
                path="/customer/products"
                element={
                    <ProtectedRoute allowedRoles={["customer"]}>
                        <Products />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/customer/products/:productId"
                element={
                    <ProtectedRoute allowedRoles={["customer"]}>
                        <ProductDetails />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/customer/orders"
                element={
                    <ProtectedRoute allowedRoles={["customer"]}>
                        <MyOrders />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/customer/notifications"
                element={
                    <ProtectedRoute allowedRoles={["customer"]}>
                        <Notifications />
                    </ProtectedRoute>
                }
            />

            {/* Admin */}
            <Route
                path="/admin"
                element={
                    <AdminRoute>
                        <AdminDashboard />
                    </AdminRoute>
                }
            />

            <Route
                path="/admin/products"
                element={
                    <AdminRoute>
                        <AdminProducts />
                    </AdminRoute>
                }
            />

            <Route
                path="/admin/orders"
                element={
                    <AdminRoute>
                        <AdminOrders />
                    </AdminRoute>
                }
            />

            <Route
                path="/admin/users"
                element={
                    <AdminRoute>
                        <AdminUsers />
                    </AdminRoute>
                }
            />

            <Route
                path="/admin/notifications"
                element={
                    <AdminRoute>
                        <AdminNotifications />
                    </AdminRoute>
                }
            />

            <Route
                path="/unauthorized"
                element={<Unauthorized />}
            />

            <Route
                path="*"
                element={<NotFound />}
            />
        </Routes>
    );
};


export default AppRoutes;