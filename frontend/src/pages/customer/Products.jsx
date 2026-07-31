import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { productAPI } from "../../api/axiosConfig";
import { useAuth } from "../../context/AuthContext";


const Products = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [stockFilter, setStockFilter] = useState("All");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    const customerEmail =
        user?.sub ||
        user?.email ||
        "Customer";


    useEffect(() => {
        const loadProducts = async () => {
            setLoading(true);
            setError("");

            try {
                const response = await productAPI.get("/");

                setProducts(
                    Array.isArray(response.data)
                        ? response.data
                        : []
                );
            } catch (requestError) {
                const detail =
                    requestError.response?.data?.detail;

                setError(
                    typeof detail === "string"
                        ? detail
                        : "Unable to load products."
                );
            } finally {
                setLoading(false);
            }
        };

        loadProducts();
    }, []);


    const categories = useMemo(() => {
        const uniqueCategories = [
            ...new Set(
                products
                    .map((product) => product.category)
                    .filter(Boolean)
            )
        ];

        return [
            "All",
            ...uniqueCategories.sort()
        ];
    }, [products]);


    const filteredProducts = useMemo(() => {
        const normalizedSearch =
            searchTerm.trim().toLowerCase();

        return products.filter((product) => {
            const matchesSearch =
                !normalizedSearch ||
                product.name
                    ?.toLowerCase()
                    .includes(normalizedSearch) ||
                product.description
                    ?.toLowerCase()
                    .includes(normalizedSearch) ||
                product.category
                    ?.toLowerCase()
                    .includes(normalizedSearch);

            const matchesCategory =
                selectedCategory === "All" ||
                product.category === selectedCategory;

            const matchesStock =
                stockFilter === "All" ||
                (
                    stockFilter === "In Stock" &&
                    product.stock > 0
                ) ||
                (
                    stockFilter === "Out of Stock" &&
                    product.stock === 0
                );

            return (
                matchesSearch &&
                matchesCategory &&
                matchesStock
            );
        });
    }, [
        products,
        searchTerm,
        selectedCategory,
        stockFilter
    ]);


    const handleLogout = () => {
        logout();
        navigate("/login");
    };


    const clearFilters = () => {
        setSearchTerm("");
        setSelectedCategory("All");
        setStockFilter("All");
    };


    return (
        <div className="products-page">
            <aside className="customer-sidebar products-sidebar">
                <div className="customer-sidebar-brand">
                    <div className="customer-brand-icon">
                        ✦
                    </div>

                    <div>
                        <h2>SmartRetailX</h2>
                        <p>Customer Portal</p>
                    </div>
                </div>

                <nav className="customer-sidebar-nav">
                    <Link
                        className="customer-nav-link"
                        to="/customer"
                    >
                        <span>⌂</span>
                        Dashboard
                    </Link>

                    <Link
                        className="customer-nav-link active"
                        to="/customer/products"
                    >
                        <span>🛍</span>
                        Products
                    </Link>

                    <Link
                        className="customer-nav-link"
                        to="/customer/orders"
                    >
                        <span>📦</span>
                        My Orders
                    </Link>

                    <Link
                        className="customer-nav-link"
                        to="/customer/notifications"
                    >
                        <span>🔔</span>
                        Notifications
                    </Link>
                </nav>

                <div className="customer-sidebar-footer">
                    <div className="customer-mini-profile">
                        <div className="customer-avatar">
                            {customerEmail
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <div>
                            <strong>{customerEmail}</strong>
                            <span>Customer</span>
                        </div>
                    </div>

                    <button
                        className="customer-logout-button"
                        type="button"
                        onClick={handleLogout}
                    >
                        Sign out
                    </button>
                </div>
            </aside>

            <main className="products-main">
                <header className="products-header">
                    <div>
                        <p className="customer-topbar-label">
                            Product catalogue
                        </p>

                        <h1>
                            Find your next
                            <span> favorite product</span>
                        </h1>

                        <p>
                            Explore products available through the
                            SmartRetailX catalogue.
                        </p>
                    </div>

                    <div className="products-header-badge">
                        <span>🛍️</span>

                        <div>
                            <strong>
                                {loading
                                    ? "..."
                                    : products.length}
                            </strong>

                            <small>
                                Total products
                            </small>
                        </div>
                    </div>
                </header>

                <section className="products-hero-strip">
                    <div>
                        <span className="customer-hero-chip">
                            SmartRetailX collection
                        </span>

                        <h2>
                            Shop with confidence and stay connected
                            to every order.
                        </h2>

                        <p>
                            Search by name, filter by category and
                            review stock availability before ordering.
                        </p>
                    </div>

                    <div className="products-hero-icon">
                        🛒
                    </div>
                </section>

                <section className="products-filter-panel">
                    <div className="products-search-group">
                        <label htmlFor="product-search">
                            Search products
                        </label>

                        <div className="products-search-wrapper">
                            <span>⌕</span>

                            <input
                                id="product-search"
                                type="search"
                                value={searchTerm}
                                onChange={(event) => {
                                    setSearchTerm(
                                        event.target.value
                                    );
                                }}
                                placeholder="Search by name, category or description"
                            />
                        </div>
                    </div>

                    <div className="products-filter-group">
                        <label htmlFor="category-filter">
                            Category
                        </label>

                        <select
                            id="category-filter"
                            value={selectedCategory}
                            onChange={(event) => {
                                setSelectedCategory(
                                    event.target.value
                                );
                            }}
                        >
                            {categories.map((category) => (
                                <option
                                    value={category}
                                    key={category}
                                >
                                    {category}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="products-filter-group">
                        <label htmlFor="stock-filter">
                            Availability
                        </label>

                        <select
                            id="stock-filter"
                            value={stockFilter}
                            onChange={(event) => {
                                setStockFilter(
                                    event.target.value
                                );
                            }}
                        >
                            <option value="All">
                                All products
                            </option>

                            <option value="In Stock">
                                In stock
                            </option>

                            <option value="Out of Stock">
                                Out of stock
                            </option>
                        </select>
                    </div>

                    <button
                        className="products-clear-button"
                        type="button"
                        onClick={clearFilters}
                    >
                        Clear filters
                    </button>
                </section>

                <section className="products-results-section">
                    <div className="products-results-heading">
                        <div>
                            <span>
                                Catalogue results
                            </span>

                            <h2>
                                {loading
                                    ? "Loading products"
                                    : `${filteredProducts.length} product${
                                        filteredProducts.length === 1
                                            ? ""
                                            : "s"
                                    } found`}
                            </h2>
                        </div>

                        {!loading && (
                            <p>
                                Showing products that match your filters.
                            </p>
                        )}
                    </div>

                    {error && (
                        <div className="error-message dashboard-error">
                            <span>⚠</span>
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="products-grid">
                            {[1, 2, 3, 4, 5, 6].map((item) => (
                                <div
                                    className="products-skeleton-card"
                                    key={item}
                                />
                            ))}
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="products-empty-state">
                            <div>🔎</div>

                            <h3>
                                No matching products
                            </h3>

                            <p>
                                Try changing your search term or filters.
                            </p>

                            <button
                                className="secondary-button"
                                type="button"
                                onClick={clearFilters}
                            >
                                Reset catalogue
                            </button>
                        </div>
                    ) : (
                        <div className="products-grid">
                            {filteredProducts.map((product) => (
                                <article
                                    className="products-card"
                                    key={product.id}
                                >
                                    <div className="products-card-visual">
                                        <div className="products-category-icon">
                                            {product.category
                                                ?.charAt(0)
                                                .toUpperCase() || "P"}
                                        </div>

                                        <span
                                            className={
                                                product.stock > 0
                                                    ? "products-stock-badge in-stock"
                                                    : "products-stock-badge out-stock"
                                            }
                                        >
                                            {product.stock > 0
                                                ? `${product.stock} available`
                                                : "Out of stock"}
                                        </span>
                                    </div>

                                    <div className="products-card-content">
                                        <span className="products-card-category">
                                            {product.category}
                                        </span>

                                        <h3>
                                            {product.name}
                                        </h3>

                                        <p>
                                            {product.description}
                                        </p>

                                        <div className="products-price-row">
                                            <div>
                                                <span>
                                                    Price
                                                </span>

                                                <strong>
                                                    LKR{" "}
                                                    {Number(
                                                        product.price
                                                    ).toLocaleString()}
                                                </strong>
                                            </div>

                                            <span className="products-id-badge">
                                                #{product.id}
                                            </span>
                                        </div>

                                        <div className="products-card-actions">
                                            <Link
                                                className="products-view-button"
                                                to={
                                                    `/customer/products/` +
                                                    `${product.id}`
                                                }
                                            >
                                                View details
                                            </Link>

                                            <Link
                                                className={
                                                    product.stock > 0
                                                        ? "products-order-button"
                                                        : "products-order-button disabled"
                                                }
                                                to={
                                                    product.stock > 0
                                                        ? `/customer/products/${product.id}`
                                                        : "#"
                                                }
                                                onClick={(event) => {
                                                    if (
                                                        product.stock <= 0
                                                    ) {
                                                        event.preventDefault();
                                                    }
                                                }}
                                            >
                                                {product.stock > 0
                                                    ? "Order now"
                                                    : "Unavailable"}
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};


export default Products;