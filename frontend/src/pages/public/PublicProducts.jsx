import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    Link,
    useNavigate,
    useSearchParams
} from "react-router-dom";

import { productAPI } from "../../api/axiosConfig";
import { useCart } from "../../context/CartContext";


const formatPrice = (price) => {
    return Number(price || 0).toLocaleString(
        "en-LK",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
};


const getCategoryIcon = (category) => {
    const value =
        category?.toLowerCase() || "";

    if (
        value.includes("phone") ||
        value.includes("mobile")
    ) {
        return "📱";
    }

    if (
        value.includes("laptop") ||
        value.includes("computer")
    ) {
        return "💻";
    }

    if (
        value.includes("audio") ||
        value.includes("headphone")
    ) {
        return "🎧";
    }

    if (value.includes("camera")) {
        return "📷";
    }

    if (
        value.includes("watch") ||
        value.includes("wearable")
    ) {
        return "⌚";
    }

    if (value.includes("tablet")) {
        return "📲";
    }

    if (value.includes("speaker")) {
        return "🔊";
    }

    if (value.includes("accessor")) {
        return "🖱️";
    }

    return "🛍️";
};


const PublicProducts = () => {
    const navigate = useNavigate();

    const [
        searchParams,
        setSearchParams
    ] = useSearchParams();

    const {
        addToCart,
        cartItemCount
    } = useCart();


    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchTerm, setSearchTerm] = useState(
        searchParams.get("search") || ""
    );

    const [selectedCategory, setSelectedCategory] =
        useState(
            searchParams.get("category") || "All"
        );

    const [stockFilter, setStockFilter] =
        useState("All");

    const [sortOption, setSortOption] =
        useState("default");

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] =
        useState("success");


    useEffect(() => {
        const loadProducts = async () => {
            setLoading(true);
            setError("");

            try {
                const response =
                    await productAPI.get("/");

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
                        : "Unable to load the product catalogue."
                );
            } finally {
                setLoading(false);
            }
        };

        loadProducts();
    }, []);


    useEffect(() => {
        setSearchTerm(
            searchParams.get("search") || ""
        );

        setSelectedCategory(
            searchParams.get("category") || "All"
        );
    }, [searchParams]);


    useEffect(() => {
        if (!message) {
            return undefined;
        }

        const timer = window.setTimeout(() => {
            setMessage("");
        }, 3000);

        return () => {
            window.clearTimeout(timer);
        };
    }, [message]);


    const categories = useMemo(() => {
        const values = [
            ...new Set(
                products
                    .map(
                        (product) =>
                            product.category
                    )
                    .filter(Boolean)
            )
        ];

        return [
            "All",
            ...values.sort()
        ];
    }, [products]);


    const filteredProducts = useMemo(() => {
        const normalizedSearch =
            searchTerm.trim().toLowerCase();

        const result = products.filter(
            (product) => {
                const matchesSearch =
                    !normalizedSearch ||
                    product.name
                        ?.toLowerCase()
                        .includes(
                            normalizedSearch
                        ) ||
                    product.description
                        ?.toLowerCase()
                        .includes(
                            normalizedSearch
                        ) ||
                    product.category
                        ?.toLowerCase()
                        .includes(
                            normalizedSearch
                        );

                const matchesCategory =
                    selectedCategory === "All" ||
                    product.category ===
                        selectedCategory;

                const matchesStock =
                    stockFilter === "All" ||
                    (
                        stockFilter === "In Stock" &&
                        Number(product.stock) > 0
                    ) ||
                    (
                        stockFilter ===
                            "Out of Stock" &&
                        Number(product.stock) <= 0
                    );

                return (
                    matchesSearch &&
                    matchesCategory &&
                    matchesStock
                );
            }
        );

        return [...result].sort(
            (firstProduct, secondProduct) => {
                if (sortOption === "price-low") {
                    return (
                        Number(firstProduct.price) -
                        Number(secondProduct.price)
                    );
                }

                if (sortOption === "price-high") {
                    return (
                        Number(secondProduct.price) -
                        Number(firstProduct.price)
                    );
                }

                if (sortOption === "name-asc") {
                    return firstProduct.name.localeCompare(
                        secondProduct.name
                    );
                }

                if (sortOption === "name-desc") {
                    return secondProduct.name.localeCompare(
                        firstProduct.name
                    );
                }

                return (
                    Number(firstProduct.id) -
                    Number(secondProduct.id)
                );
            }
        );
    }, [
        products,
        searchTerm,
        selectedCategory,
        stockFilter,
        sortOption
    ]);


    const catalogueStatistics = useMemo(
        () => ({
            total: products.length,

            available: products.filter(
                (product) =>
                    Number(product.stock) > 0
            ).length,

            categories:
                categories.length > 0
                    ? categories.length - 1
                    : 0
        }),
        [
            products,
            categories
        ]
    );


    const updateQueryParameters = (
        search,
        category
    ) => {
        const parameters = {};

        if (search.trim()) {
            parameters.search =
                search.trim();
        }

        if (category !== "All") {
            parameters.category =
                category;
        }

        setSearchParams(parameters);
    };


    const handleSearchChange = (event) => {
        const value = event.target.value;

        setSearchTerm(value);

        updateQueryParameters(
            value,
            selectedCategory
        );
    };


    const handleCategoryChange = (event) => {
        const value = event.target.value;

        setSelectedCategory(value);

        updateQueryParameters(
            searchTerm,
            value
        );
    };


    const clearFilters = () => {
        setSearchTerm("");
        setSelectedCategory("All");
        setStockFilter("All");
        setSortOption("default");
        setSearchParams({});
    };


    const showMessage = (
        text,
        type = "success"
    ) => {
        setMessage(text);
        setMessageType(type);
    };


    const handleAddToCart = (product) => {
        const result =
            addToCart(product, 1);

        showMessage(
            result.message,
            result.success
                ? "success"
                : "error"
        );
    };


    const handleBuyNow = (product) => {
        const result =
            addToCart(product, 1);

        if (!result.success) {
            showMessage(
                result.message,
                "error"
            );

            return;
        }

        navigate("/cart");
    };


    return (
        <div className="public-products-page">
            {message && (
                <div
                    className={
                        messageType === "success"
                            ? "public-products-toast success"
                            : "public-products-toast error"
                    }
                    role="status"
                >
                    <span>
                        {messageType === "success"
                            ? "✓"
                            : "⚠"}
                    </span>

                    <p>{message}</p>

                    {messageType === "success" && (
                        <Link to="/cart">
                            View cart
                        </Link>
                    )}
                </div>
            )}

            <section className="public-products-hero">
                <div className="public-products-container">
                    <div className="public-products-hero-content">
                        <span>
                            SmartRetailX catalogue
                        </span>

                        <h1>
                            Explore our
                            <strong> product collection</strong>
                        </h1>

                        <p>
                            Search, compare and add products to your
                            cart without signing in. Authentication is
                            required only when confirming checkout.
                        </p>

                        <div className="public-products-hero-statistics">
                            <article>
                                <span>Total products</span>

                                <strong>
                                    {loading
                                        ? "..."
                                        : catalogueStatistics.total}
                                </strong>
                            </article>

                            <article>
                                <span>Available now</span>

                                <strong>
                                    {loading
                                        ? "..."
                                        : catalogueStatistics.available}
                                </strong>
                            </article>

                            <article>
                                <span>Categories</span>

                                <strong>
                                    {loading
                                        ? "..."
                                        : catalogueStatistics.categories}
                                </strong>
                            </article>

                            <article>
                                <span>Cart items</span>

                                <strong>
                                    {cartItemCount}
                                </strong>
                            </article>
                        </div>
                    </div>

                    <div className="public-products-hero-visual">
                        <div>🛍️</div>

                        <strong>
                            Browse freely
                        </strong>

                        <span>
                            Sign in only at checkout
                        </span>
                    </div>
                </div>
            </section>

            <section className="public-products-content">
                <div className="public-products-container">
                    <div className="public-products-filter-panel">
                        <div className="public-products-search">
                            <label htmlFor="public-product-search">
                                Search products
                            </label>

                            <div>
                                <span>⌕</span>

                                <input
                                    id="public-product-search"
                                    type="search"
                                    value={searchTerm}
                                    onChange={
                                        handleSearchChange
                                    }
                                    placeholder="Search by name, category or description"
                                />
                            </div>
                        </div>

                        <div className="public-products-filter">
                            <label htmlFor="public-category-filter">
                                Category
                            </label>

                            <select
                                id="public-category-filter"
                                value={
                                    selectedCategory
                                }
                                onChange={
                                    handleCategoryChange
                                }
                            >
                                {categories.map(
                                    (category) => (
                                        <option
                                            value={
                                                category
                                            }
                                            key={
                                                category
                                            }
                                        >
                                            {
                                                category
                                            }
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        <div className="public-products-filter">
                            <label htmlFor="public-stock-filter">
                                Availability
                            </label>

                            <select
                                id="public-stock-filter"
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

                        <div className="public-products-filter">
                            <label htmlFor="public-sort-filter">
                                Sort products
                            </label>

                            <select
                                id="public-sort-filter"
                                value={sortOption}
                                onChange={(event) => {
                                    setSortOption(
                                        event.target.value
                                    );
                                }}
                            >
                                <option value="default">
                                    Default order
                                </option>

                                <option value="price-low">
                                    Price: low to high
                                </option>

                                <option value="price-high">
                                    Price: high to low
                                </option>

                                <option value="name-asc">
                                    Name: A to Z
                                </option>

                                <option value="name-desc">
                                    Name: Z to A
                                </option>
                            </select>
                        </div>

                        <button
                            className="public-products-clear-button"
                            type="button"
                            onClick={clearFilters}
                        >
                            Clear filters
                        </button>
                    </div>

                    <div className="public-products-heading">
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

                        <Link to="/cart">
                            Open cart ({cartItemCount})
                            <span>→</span>
                        </Link>
                    </div>

                    {error && (
                        <div
                            className="error-message public-products-error"
                            role="alert"
                        >
                            <span>⚠</span>
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="public-products-grid">
                            {[
                                1,
                                2,
                                3,
                                4,
                                5,
                                6
                            ].map((item) => (
                                <div
                                    className="public-product-skeleton"
                                    key={item}
                                />
                            ))}
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="public-products-empty-state">
                            <div>🔎</div>

                            <h3>
                                No matching products
                            </h3>

                            <p>
                                Change your search term or filters and
                                try again.
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
                        <div className="public-products-grid">
                            {filteredProducts.map(
                                (product) => (
                                    <article
                                        className="public-product-card"
                                        key={product.id}
                                    >
                                        <div className="public-product-visual">
                                            <span className="public-product-category">
                                                {product.category ||
                                                    "Uncategorized"}
                                            </span>

                                            <div className="public-product-icon">
                                                {getCategoryIcon(
                                                    product.category
                                                )}
                                            </div>

                                            <span
                                                className={
                                                    Number(
                                                        product.stock
                                                    ) > 0
                                                        ? "public-product-stock available"
                                                        : "public-product-stock unavailable"
                                                }
                                            >
                                                {Number(
                                                    product.stock
                                                ) > 0
                                                    ? `${product.stock} available`
                                                    : "Out of stock"}
                                            </span>
                                        </div>

                                        <div className="public-product-body">
                                            <span className="public-product-reference">
                                                Product #{product.id}
                                            </span>

                                            <h3>
                                                {product.name}
                                            </h3>

                                            <p>
                                                {product.description ||
                                                    "No product description is available."}
                                            </p>

                                            <div className="public-product-price-row">
                                                <div>
                                                    <span>
                                                        Price
                                                    </span>

                                                    <strong>
                                                        LKR{" "}
                                                        {formatPrice(
                                                            product.price
                                                        )}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>
                                                        Stock
                                                    </span>

                                                    <strong>
                                                        {
                                                            product.stock
                                                        }
                                                    </strong>
                                                </div>
                                            </div>

                                            <div className="public-product-actions">
                                                <Link
                                                    className="public-product-details-link"
                                                    to={
                                                        `/products/` +
                                                        `${product.id}`
                                                    }
                                                >
                                                    View details
                                                </Link>

                                                <button
                                                    className="public-product-add-button"
                                                    type="button"
                                                    disabled={
                                                        Number(
                                                            product.stock
                                                        ) <= 0
                                                    }
                                                    onClick={() => {
                                                        handleAddToCart(
                                                            product
                                                        );
                                                    }}
                                                >
                                                    Add to cart
                                                </button>
                                            </div>

                                            <button
                                                className="public-product-buy-button"
                                                type="button"
                                                disabled={
                                                    Number(
                                                        product.stock
                                                    ) <= 0
                                                }
                                                onClick={() => {
                                                    handleBuyNow(
                                                        product
                                                    );
                                                }}
                                            >
                                                Buy now
                                                <span>→</span>
                                            </button>
                                        </div>
                                    </article>
                                )
                            )}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};


export default PublicProducts;