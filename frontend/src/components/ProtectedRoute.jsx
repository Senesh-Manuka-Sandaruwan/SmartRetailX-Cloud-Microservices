import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";


const ProtectedRoute = ({
    children,
    allowedRoles
}) => {
    const location = useLocation();

    const {
        user,
        loading,
        isAuthenticated
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
                        Verifying your secure session...
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
                state={{
                    from: location.pathname
                }}
            />
        );
    }


    if (
        Array.isArray(allowedRoles) &&
        allowedRoles.length > 0 &&
        !allowedRoles.includes(user?.role)
    ) {
        const redirectPath =
            user?.role === "admin"
                ? "/admin"
                : "/customer";

        return (
            <Navigate
                to={redirectPath}
                replace
            />
        );
    }


    return children;
};


export default ProtectedRoute;