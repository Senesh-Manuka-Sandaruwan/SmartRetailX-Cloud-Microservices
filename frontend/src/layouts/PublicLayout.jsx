import { Outlet } from "react-router-dom";

import PublicNavbar from "../components/PublicNavbar";


const PublicLayout = () => {
    const currentYear = new Date().getFullYear();

    return (
        <div className="public-layout">
            <PublicNavbar />

            <main className="public-layout-content">
                <Outlet />
            </main>

            <footer className="public-footer">
                <div className="public-footer-container">
                    <section className="public-footer-brand">
                        <div className="public-footer-logo">
                            <span>✦</span>

                            <div>
                                <h2>SmartRetailX</h2>
                                <p>Cloud Shopping Platform</p>
                            </div>
                        </div>

                        <p className="public-footer-description">
                            A connected retail platform for browsing
                            products, placing orders and receiving live
                            order notifications.
                        </p>
                    </section>

                    <section className="public-footer-column">
                        <h3>Shop</h3>

                        <a href="/">
                            Home
                        </a>

                        <a href="/products">
                            Products
                        </a>

                        <a href="/cart">
                            Shopping cart
                        </a>

                        <a href="/checkout">
                            Checkout
                        </a>
                    </section>

                    <section className="public-footer-column">
                        <h3>Account</h3>

                        <a href="/login">
                            Sign in
                        </a>

                        <a href="/register">
                            Create account
                        </a>

                        <a href="/customer">
                            Customer dashboard
                        </a>

                        <a href="/customer/orders">
                            My orders
                        </a>
                    </section>

                    <section className="public-footer-column">
                        <h3>Platform</h3>

                        <p>User Service</p>
                        <p>Product Service</p>
                        <p>Order Service</p>
                        <p>Notification Service</p>
                    </section>
                </div>

                <div className="public-footer-bottom">
                    <p>
                        © {currentYear} SmartRetailX. All rights reserved.
                    </p>

                    <p>
                        Secure shopping powered by cloud microservices.
                    </p>
                </div>
            </footer>
        </div>
    );
};


export default PublicLayout;