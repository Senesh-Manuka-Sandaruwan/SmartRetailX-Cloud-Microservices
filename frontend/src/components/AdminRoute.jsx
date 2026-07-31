import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";


const AdminRoute = ({ children }) => {

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

                    <h2>

                        Loading SmartRetailX

                    </h2>

                    <p>

                        Verifying administrator privileges...

                    </p>

                </div>

            </main>

        );

    }


    if (!isAuthenticated) {

        return <Navigate to="/login" replace />;

    }


    if (!isAdmin) {

        return (

            <Navigate
                to="/customer"
                replace
            />

        );

    }


    return children;

};


export default AdminRoute;