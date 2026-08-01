import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";


const PublicNavbar = () => {
    const navigate = useNavigate();

    const {
        isAuthenticated,
        isAdmin,
        logout
    } = useAuth();

    const {
        cartItemCount
    } = useCart();

    const [searchText, setSearchText] = useState("");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);


    const handleSearch = (event) => {
        event.preventDefault();

        const keyword = searchText.trim();

        if (!keyword) {
            navigate("/products");
            return;
        }

        navigate(
            `/products?search=${encodeURIComponent(keyword)}`
        );

        setMobileMenuOpen(false);
    };


    const handleLogout = () => {
        logout();
        navigate("/");
    };


    return (
        <header className="public-navbar">

            <div className="public-navbar-logo">
                <Link to="/">
                    <div className="logo-icon">
                        🛍
                    </div>

                    <div>
                        <h2>SmartRetailX</h2>
                        <span>
                            Cloud Shopping Platform
                        </span>
                    </div>
                </Link>
            </div>


            <form
                className="navbar-search"
                onSubmit={handleSearch}
            >
                <input
                    type="text"
                    placeholder="Search products..."
                    value={searchText}
                    onChange={(event) =>
                        setSearchText(event.target.value)
                    }
                />

                <button type="submit">
                    🔍
                </button>
            </form>


            <button
                className="mobile-menu-button"
                onClick={() =>
                    setMobileMenuOpen(!mobileMenuOpen)
                }
            >
                ☰
            </button>


            <nav
                className={
                    mobileMenuOpen
                        ? "navbar-links active"
                        : "navbar-links"
                }
            >
                <Link
                    to="/"
                    onClick={() =>
                        setMobileMenuOpen(false)
                    }
                >
                    Home
                </Link>

                <Link
                    to="/products"
                    onClick={() =>
                        setMobileMenuOpen(false)
                    }
                >
                    Products
                </Link>

                <Link
                    className="cart-link"
                    to="/cart"
                    onClick={() =>
                        setMobileMenuOpen(false)
                    }
                >
                    🛒 Cart

                    {cartItemCount > 0 && (
                        <span className="cart-count">
                            {cartItemCount}
                        </span>
                    )}
                </Link>

                {!isAuthenticated && (
                    <>
                        <Link
                            to="/login"
                            onClick={() =>
                                setMobileMenuOpen(false)
                            }
                        >
                            Login
                        </Link>

                        <Link
                            className="register-button"
                            to="/register"
                            onClick={() =>
                                setMobileMenuOpen(false)
                            }
                        >
                            Register
                        </Link>
                    </>
                )}

                {isAuthenticated && !isAdmin && (
                    <>
                        <Link
                            to="/customer"
                            onClick={() =>
                                setMobileMenuOpen(false)
                            }
                        >
                            Dashboard
                        </Link>

                        <button
                            className="logout-button"
                            type="button"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </>
                )}

                {isAuthenticated && isAdmin && (
                    <>
                        <Link
                            to="/admin"
                            onClick={() =>
                                setMobileMenuOpen(false)
                            }
                        >
                            Admin
                        </Link>

                        <button
                            className="logout-button"
                            type="button"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </>
                )}
            </nav>

        </header>
    );
};

export default PublicNavbar;