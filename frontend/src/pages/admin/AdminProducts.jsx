import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import {
    Link,
    useNavigate
} from "react-router-dom";

import { productAPI } from "../../api/axiosConfig";
import {
    createCategory,
    getCategories
} from "../../api/categoryService";
import { useAuth } from "../../context/AuthContext";


const EMPTY_FORM = {
    name: "",
    description: "",
    category: "",
    image_url: "",
    price: "",
    stock: ""
};


const EMPTY_CATEGORY_FORM = {
    name: "",
    description: ""
};


const formatPrice = (value) => {
    return Number(value || 0).toLocaleString(
        "en-LK",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
};


const getBackendError = (
    requestError,
    defaultMessage
) => {
    const detail =
        requestError.response?.data?.detail;

    if (typeof detail === "string") {
        return detail;
    }

    if (Array.isArray(detail)) {
        return detail
            .map((item) => item.msg)
            .filter(Boolean)
            .join(" ");
    }

    return defaultMessage;
};


const AdminProducts = () => {
    const navigate = useNavigate();

    const {
        user,
        logout
    } = useAuth();

    const [products, setProducts] = useState([]);
    const [categoryRecords, setCategoryRecords] =
        useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] =
        useState(false);

    const [searchTerm, setSearchTerm] =
        useState("");

    const [selectedCategory, setSelectedCategory] =
        useState("All");

    const [stockFilter, setStockFilter] =
        useState("All");

    const [sortOption, setSortOption] =
        useState("default");

    const [formData, setFormData] =
        useState(EMPTY_FORM);

    const [editingProduct, setEditingProduct] =
        useState(null);

    const [showFormModal, setShowFormModal] =
        useState(false);

    const [showCategoryModal, setShowCategoryModal] =
        useState(false);

    const [categoryForm, setCategoryForm] =
        useState(EMPTY_CATEGORY_FORM);

    const [saving, setSaving] =
        useState(false);

    const [savingCategory, setSavingCategory] =
        useState(false);

    const [deletingProductId, setDeletingProductId] =
        useState(null);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");


    const adminEmail =
        user?.sub ||
        user?.email ||
        "Administrator";


    const loadProducts = useCallback(
        async (showRefreshState = false) => {
            if (showRefreshState) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

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
                setError(
                    getBackendError(
                        requestError,
                        "Unable to load products."
                    )
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        []
    );


    const loadCategories = useCallback(
        async () => {
            try {
                const data = await getCategories();
                setCategoryRecords(
                    Array.isArray(data) ? data : []
                );
            } catch (categoryError) {
                setError(
                    categoryError.message ||
                    "Unable to load categories."
                );
            }
        },
        []
    );


    useEffect(() => {
        loadProducts();
        loadCategories();
    }, [loadProducts, loadCategories]);


    const categories = useMemo(() => {
        const names = new Set();

        categoryRecords.forEach((category) => {
            if (category?.name) {
                names.add(category.name);
            }
        });

        products.forEach((product) => {
            if (product?.category) {
                names.add(product.category);
            }
        });

        return [
            "All",
            ...Array.from(names).sort()
        ];
    }, [categoryRecords, products]);


    const statistics = useMemo(() => {
        const totalStock = products.reduce(
            (total, product) =>
                total +
                Number(product.stock || 0),
            0
        );

        const lowStock = products.filter(
            (product) =>
                Number(product.stock || 0) > 0 &&
                Number(product.stock || 0) <= 5
        ).length;

        const outOfStock = products.filter(
            (product) =>
                Number(product.stock || 0) <= 0
        ).length;

        const inventoryValue = products.reduce(
            (total, product) =>
                total +
                (
                    Number(product.price || 0) *
                    Number(product.stock || 0)
                ),
            0
        );

        return {
            products: products.length,
            totalStock,
            lowStock,
            outOfStock,
            inventoryValue
        };
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
                        .includes(normalizedSearch) ||
                    product.description
                        ?.toLowerCase()
                        .includes(normalizedSearch) ||
                    product.category
                        ?.toLowerCase()
                        .includes(normalizedSearch) ||
                    String(product.id).includes(
                        normalizedSearch
                    );

                const matchesCategory =
                    selectedCategory === "All" ||
                    product.category ===
                        selectedCategory;

                const stockValue =
                    Number(product.stock || 0);

                const matchesStock =
                    stockFilter === "All" ||
                    (
                        stockFilter === "In Stock" &&
                        stockValue > 5
                    ) ||
                    (
                        stockFilter === "Low Stock" &&
                        stockValue > 0 &&
                        stockValue <= 5
                    ) ||
                    (
                        stockFilter === "Out of Stock" &&
                        stockValue <= 0
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

                if (sortOption === "stock-low") {
                    return (
                        Number(firstProduct.stock) -
                        Number(secondProduct.stock)
                    );
                }

                if (sortOption === "stock-high") {
                    return (
                        Number(secondProduct.stock) -
                        Number(firstProduct.stock)
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


    const closeMessages = () => {
        setError("");
        setSuccess("");
    };


    const openCreateModal = () => {
        closeMessages();
        setEditingProduct(null);
        setFormData(EMPTY_FORM);
        setShowFormModal(true);
    };


    const openEditModal = (product) => {
        closeMessages();

        setEditingProduct(product);

        setFormData({
            name:
                product.name || "",
            description:
                product.description || "",
            category:
                product.category || "",
            image_url:
                product.image_url || "",
            price:
                String(product.price ?? ""),
            stock:
                String(product.stock ?? "")
        });

        setShowFormModal(true);
    };


    const openCategoryModal = () => {
        setCategoryForm(EMPTY_CATEGORY_FORM);
        setShowCategoryModal(true);
        setError("");
    };


    const closeCategoryModal = () => {
        if (savingCategory) {
            return;
        }

        setShowCategoryModal(false);
        setCategoryForm(EMPTY_CATEGORY_FORM);
    };


    const handleCategoryFormChange = (event) => {
        const { name, value } = event.target;

        setCategoryForm((currentData) => ({
            ...currentData,
            [name]: value
        }));

        if (error) {
            setError("");
        }
    };


    const handleCategorySubmit = async (event) => {
        event.preventDefault();
        setError("");

        const categoryName = categoryForm.name.trim();

        if (!categoryName) {
            setError("Category name is required.");
            return;
        }

        setSavingCategory(true);

        try {
            const createdCategory = await createCategory({
                name: categoryName,
                description:
                    categoryForm.description.trim()
            });

            await loadCategories();

            setFormData((currentData) => ({
                ...currentData,
                category: createdCategory.name
            }));

            setShowCategoryModal(false);
            setCategoryForm(EMPTY_CATEGORY_FORM);
            setSuccess(
                `Category "${createdCategory.name}" was created successfully.`
            );
        } catch (categoryError) {
            setError(
                categoryError.message ||
                "Unable to create category."
            );
        } finally {
            setSavingCategory(false);
        }
    };


    const closeFormModal = () => {
        if (saving) {
            return;
        }

        setShowFormModal(false);
        setEditingProduct(null);
        setFormData(EMPTY_FORM);
    };


    const handleFormChange = (event) => {
        const {
            name,
            value
        } = event.target;

        setFormData(
            (currentData) => ({
                ...currentData,
                [name]: value
            })
        );

        if (error) {
            setError("");
        }
    };


    const validateForm = () => {
        if (!formData.name.trim()) {
            return "Product name is required.";
        }

        if (!formData.description.trim()) {
            return "Product description is required.";
        }

        if (!formData.category.trim()) {
            return "Product category is required.";
        }

        const imageUrl = formData.image_url.trim();

        if (
            imageUrl &&
            !imageUrl.startsWith("http://") &&
            !imageUrl.startsWith("https://")
        ) {
            return "Image URL must start with http:// or https://";
        }

        const numericPrice =
            Number(formData.price);

        if (
            Number.isNaN(numericPrice) ||
            numericPrice < 0
        ) {
            return "Enter a valid product price.";
        }

        const numericStock =
            Number(formData.stock);

        if (
            Number.isNaN(numericStock) ||
            numericStock < 0 ||
            !Number.isInteger(numericStock)
        ) {
            return "Stock must be a non-negative whole number.";
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

        setSaving(true);

        const payload = {
            name:
                formData.name.trim(),
            description:
                formData.description.trim(),
            category:
                formData.category.trim(),
            image_url:
                formData.image_url.trim() || null,
            price:
                Number(formData.price),
            stock:
                Number(formData.stock)
        };

        try {
            if (editingProduct) {
                await productAPI.put(
                    `/${editingProduct.id}`,
                    payload
                );

                setSuccess(
                    `"${payload.name}" was updated successfully.`
                );
            } else {
                await productAPI.post(
                    "/",
                    payload
                );

                setSuccess(
                    `"${payload.name}" was created successfully.`
                );
            }

            setShowFormModal(false);
            setEditingProduct(null);
            setFormData(EMPTY_FORM);

            await loadProducts(true);
        } catch (requestError) {
            setError(
                getBackendError(
                    requestError,
                    editingProduct
                        ? "Unable to update this product."
                        : "Unable to create this product."
                )
            );
        } finally {
            setSaving(false);
        }
    };


    const handleDelete = async (product) => {
        const confirmed = window.confirm(
            `Delete "${product.name}" permanently?`
        );

        if (!confirmed) {
            return;
        }

        setDeletingProductId(product.id);
        closeMessages();

        try {
            await productAPI.delete(
                `/${product.id}`
            );

            setProducts(
                (currentProducts) =>
                    currentProducts.filter(
                        (currentProduct) =>
                            currentProduct.id !==
                            product.id
                    )
            );

            setSuccess(
                `"${product.name}" was deleted successfully.`
            );
        } catch (requestError) {
            setError(
                getBackendError(
                    requestError,
                    "Unable to delete this product."
                )
            );
        } finally {
            setDeletingProductId(null);
        }
    };


    const clearFilters = () => {
        setSearchTerm("");
        setSelectedCategory("All");
        setStockFilter("All");
        setSortOption("default");
    };


    const getStockClass = (stock) => {
        const value =
            Number(stock || 0);

        if (value <= 0) {
            return "admin-product-stock-badge out";
        }

        if (value <= 5) {
            return "admin-product-stock-badge low";
        }

        return "admin-product-stock-badge available";
    };


    const getStockLabel = (stock) => {
        const value =
            Number(stock || 0);

        if (value <= 0) {
            return "Out of stock";
        }

        if (value <= 5) {
            return "Low stock";
        }

        return "In stock";
    };


    const handleLogout = () => {
        logout();
        navigate("/login");
    };


    return (
        <div className="admin-products-page">
            <aside className="admin-sidebar">
                <div className="admin-sidebar-brand">
                    <div className="admin-brand-icon">
                        ✦
                    </div>

                    <div>
                        <h2>SmartRetailX</h2>
                        <p>Administration</p>
                    </div>
                </div>

                <nav className="admin-sidebar-nav">
                    <Link
                        className="admin-nav-link"
                        to="/admin"
                    >
                        <span>⌂</span>
                        Dashboard
                    </Link>

                    <Link
                        className="admin-nav-link active"
                        to="/admin/products"
                    >
                        <span>🛍️</span>
                        Products
                    </Link>

                    <Link
                        className="admin-nav-link"
                        to="/admin/orders"
                    >
                        <span>📦</span>
                        Orders
                    </Link>

                    <Link
                        className="admin-nav-link"
                        to="/admin/notifications"
                    >
                        <span>🔔</span>
                        Notifications
                    </Link>

                    <Link
                        className="admin-nav-link"
                        to="/admin/users"
                    >
                        <span>👥</span>
                        Users
                    </Link>
                </nav>

                <div className="admin-sidebar-footer">
                    <div className="admin-mini-profile">
                        <div className="admin-avatar">
                            {adminEmail
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <div>
                            <strong>
                                {adminEmail}
                            </strong>

                            <span>
                                Administrator
                            </span>
                        </div>
                    </div>

                    <button
                        className="admin-logout-button"
                        type="button"
                        onClick={handleLogout}
                    >
                        Sign out
                    </button>
                </div>
            </aside>

            <main className="admin-products-main">
                <header className="admin-products-topbar">
                    <div>
                        <p className="admin-topbar-label">
                            Catalogue administration
                        </p>

                        <h1>
                            Product
                            <span> management</span>
                        </h1>

                        <p>
                            Create, edit, search and manage product
                            inventory from one administration page.
                        </p>
                    </div>

                    <div className="admin-products-topbar-actions">
                        <button
                            className="admin-refresh-button"
                            type="button"
                            onClick={() => {
                                loadProducts(true);
                                loadCategories();
                            }}
                            disabled={refreshing}
                        >
                            {refreshing
                                ? "Refreshing..."
                                : "Refresh"}
                        </button>

                        <button
                            className="primary-button"
                            type="button"
                            onClick={openCreateModal}
                        >
                            Add product
                            <span>＋</span>
                        </button>
                    </div>
                </header>

                {error && !showFormModal && (
                    <div
                        className="error-message admin-products-alert"
                        role="alert"
                    >
                        <span>⚠</span>
                        {error}
                    </div>
                )}

                {success && !showFormModal && (
                    <div
                        className="success-message admin-products-alert"
                        role="status"
                    >
                        <span>✓</span>
                        {success}
                    </div>
                )}

                <section className="admin-products-hero">
                    <div>
                        <span>
                            Product Service integration
                        </span>

                        <h2>
                            Keep your catalogue accurate and your
                            inventory ready for customers.
                        </h2>

                        <p>
                            All create, update and delete operations
                            are protected by administrator
                            authentication.
                        </p>
                    </div>

                    <div className="admin-products-hero-visual">
                        <span>🛍️</span>

                        <strong>
                            {loading
                                ? "..."
                                : statistics.products}
                        </strong>

                        <small>
                            Catalogue products
                        </small>
                    </div>
                </section>

                <section className="admin-products-stat-grid">
                    <article>
                        <div>🛍️</div>

                        <span>
                            Products
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : statistics.products}
                        </strong>
                    </article>

                    <article>
                        <div>📦</div>

                        <span>
                            Stock units
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : statistics.totalStock}
                        </strong>
                    </article>

                    <article>
                        <div>⚠️</div>

                        <span>
                            Low stock
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : statistics.lowStock}
                        </strong>
                    </article>

                    <article>
                        <div>✕</div>

                        <span>
                            Out of stock
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : statistics.outOfStock}
                        </strong>
                    </article>

                    <article>
                        <div>💰</div>

                        <span>
                            Inventory value
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : `LKR ${formatPrice(
                                      statistics.inventoryValue
                                  )}`}
                        </strong>
                    </article>
                </section>

                <section className="admin-products-filter-panel">
                    <div className="admin-products-search">
                        <label htmlFor="admin-product-search">
                            Search products
                        </label>

                        <div>
                            <span>⌕</span>

                            <input
                                id="admin-product-search"
                                type="search"
                                value={searchTerm}
                                onChange={(event) => {
                                    setSearchTerm(
                                        event.target.value
                                    );
                                }}
                                placeholder="Search by ID, name, category or description"
                            />
                        </div>
                    </div>

                    <div className="admin-products-filter">
                        <label htmlFor="admin-category-filter">
                            Category
                        </label>

                        <select
                            id="admin-category-filter"
                            value={selectedCategory}
                            onChange={(event) => {
                                setSelectedCategory(
                                    event.target.value
                                );
                            }}
                        >
                            {categories.map(
                                (category) => (
                                    <option
                                        key={category}
                                        value={category}
                                    >
                                        {category}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    <div className="admin-products-filter">
                        <label htmlFor="admin-stock-filter">
                            Stock level
                        </label>

                        <select
                            id="admin-stock-filter"
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

                            <option value="Low Stock">
                                Low stock
                            </option>

                            <option value="Out of Stock">
                                Out of stock
                            </option>
                        </select>
                    </div>

                    <div className="admin-products-filter">
                        <label htmlFor="admin-sort-products">
                            Sort
                        </label>

                        <select
                            id="admin-sort-products"
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

                            <option value="name-asc">
                                Name: A to Z
                            </option>

                            <option value="name-desc">
                                Name: Z to A
                            </option>

                            <option value="price-low">
                                Price: low to high
                            </option>

                            <option value="price-high">
                                Price: high to low
                            </option>

                            <option value="stock-low">
                                Stock: low to high
                            </option>

                            <option value="stock-high">
                                Stock: high to low
                            </option>
                        </select>
                    </div>

                    <button
                        className="admin-products-clear-button"
                        type="button"
                        onClick={clearFilters}
                    >
                        Clear filters
                    </button>
                </section>

                <section className="admin-products-content">
                    <div className="admin-products-heading">
                        <div>
                            <span>
                                Product catalogue
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

                        <button
                            className="admin-products-create-link"
                            type="button"
                            onClick={openCreateModal}
                        >
                            Create new product
                            <span>＋</span>
                        </button>
                    </div>

                    {loading ? (
                        <div className="admin-products-loading-grid">
                            {[1, 2, 3, 4, 5, 6].map(
                                (item) => (
                                    <div
                                        className="admin-product-skeleton"
                                        key={item}
                                    />
                                )
                            )}
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="admin-products-empty">
                            <div>🛍️</div>

                            <h3>
                                No products found
                            </h3>

                            <p>
                                Create a product or change the current
                                search and filter options.
                            </p>

                            <button
                                className="primary-button"
                                type="button"
                                onClick={openCreateModal}
                            >
                                Add first product
                            </button>
                        </div>
                    ) : (
                        <div className="admin-products-table-wrapper">
                            <table className="admin-products-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Category</th>
                                        <th>Price</th>
                                        <th>Stock</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredProducts.map(
                                        (product) => (
                                            <tr key={product.id}>
                                                <td>
                                                    <div className="admin-product-table-name">
                                                        <div className="admin-product-table-image">
                                                            {product.image_url ? (
                                                                <img
                                                                    src={product.image_url}
                                                                    alt={product.name}
                                                                    onError={(event) => {
                                                                        event.currentTarget.style.display =
                                                                            "none";
                                                                    }}
                                                                />
                                                            ) : (
                                                                <span>
                                                                    {product.category
                                                                        ?.charAt(0)
                                                                        .toUpperCase() ||
                                                                        "P"}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <span>
                                                            <strong>
                                                                {product.name}
                                                            </strong>

                                                            <small>
                                                                Product #
                                                                {product.id}
                                                            </small>

                                                            <p>
                                                                {product.description}
                                                            </p>
                                                        </span>
                                                    </div>
                                                </td>

                                                <td>
                                                    <span className="admin-product-category-badge">
                                                        {product.category}
                                                    </span>
                                                </td>

                                                <td>
                                                    <strong>
                                                        LKR{" "}
                                                        {formatPrice(
                                                            product.price
                                                        )}
                                                    </strong>
                                                </td>

                                                <td>
                                                    {product.stock}
                                                </td>

                                                <td>
                                                    <span
                                                        className={getStockClass(
                                                            product.stock
                                                        )}
                                                    >
                                                        {getStockLabel(
                                                            product.stock
                                                        )}
                                                    </span>
                                                </td>

                                                <td>
                                                    <div className="admin-product-table-actions">
                                                        <button
                                                            className="admin-product-edit-button"
                                                            type="button"
                                                            onClick={() => {
                                                                openEditModal(
                                                                    product
                                                                );
                                                            }}
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            className="admin-product-delete-button"
                                                            type="button"
                                                            onClick={() => {
                                                                handleDelete(
                                                                    product
                                                                );
                                                            }}
                                                            disabled={
                                                                deletingProductId ===
                                                                product.id
                                                            }
                                                        >
                                                            {deletingProductId ===
                                                            product.id
                                                                ? "Deleting..."
                                                                : "Delete"}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>

            {showFormModal && (
                <div
                    className="admin-product-modal-backdrop"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeFormModal();
                        }
                    }}
                >
                    <section
                        className="admin-product-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="admin-product-modal-title"
                    >
                        <div className="admin-product-modal-heading">
                            <div>
                                <span>
                                    {editingProduct
                                        ? "Update catalogue item"
                                        : "Create catalogue item"}
                                </span>

                                <h2 id="admin-product-modal-title">
                                    {editingProduct
                                        ? "Edit product"
                                        : "Add new product"}
                                </h2>

                                <p>
                                    Enter the product information below
                                    and save it to the Product Service.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeFormModal}
                                disabled={saving}
                                aria-label="Close product form"
                            >
                                ×
                            </button>
                        </div>

                        {error && (
                            <div
                                className="error-message admin-product-modal-alert"
                                role="alert"
                            >
                                <span>⚠</span>
                                {error}
                            </div>
                        )}

                        <form
                            className="admin-product-form"
                            onSubmit={handleSubmit}
                        >
                            <div className="form-group">
                                <label
                                    className="form-label"
                                    htmlFor="admin-product-name"
                                >
                                    Product name
                                </label>

                                <input
                                    id="admin-product-name"
                                    className="form-control"
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleFormChange}
                                    placeholder="Enter product name"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <div className="admin-product-category-label-row">
                                    <label
                                        className="form-label"
                                        htmlFor="admin-product-category"
                                    >
                                        Category
                                    </label>

                                    <button
                                        className="admin-add-category-button"
                                        type="button"
                                        onClick={openCategoryModal}
                                    >
                                        + Add category
                                    </button>
                                </div>

                                <select
                                    id="admin-product-category"
                                    className="form-control"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleFormChange}
                                    required
                                >
                                    <option value="">
                                        Select a category
                                    </option>

                                    {categories
                                        .filter(
                                            (category) =>
                                                category !== "All"
                                        )
                                        .map((category) => (
                                            <option
                                                key={category}
                                                value={category}
                                            >
                                                {category}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div className="form-group admin-product-form-full">
                                <label
                                    className="form-label"
                                    htmlFor="admin-product-image-url"
                                >
                                    Product image URL
                                </label>

                                <input
                                    id="admin-product-image-url"
                                    className="form-control"
                                    type="url"
                                    name="image_url"
                                    value={formData.image_url}
                                    onChange={handleFormChange}
                                    placeholder="https://example.com/product-image.jpg"
                                />

                                {formData.image_url && (
                                    <div className="admin-product-image-preview">
                                        <img
                                            src={formData.image_url}
                                            alt="Product preview"
                                            onError={(event) => {
                                                event.currentTarget.style.display =
                                                    "none";
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label
                                    className="form-label"
                                    htmlFor="admin-product-price"
                                >
                                    Price (LKR)
                                </label>

                                <input
                                    id="admin-product-price"
                                    className="form-control"
                                    type="number"
                                    name="price"
                                    min="0"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={handleFormChange}
                                    placeholder="0.00"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label
                                    className="form-label"
                                    htmlFor="admin-product-stock"
                                >
                                    Stock quantity
                                </label>

                                <input
                                    id="admin-product-stock"
                                    className="form-control"
                                    type="number"
                                    name="stock"
                                    min="0"
                                    step="1"
                                    value={formData.stock}
                                    onChange={handleFormChange}
                                    placeholder="0"
                                    required
                                />
                            </div>

                            <div className="form-group admin-product-form-full">
                                <label
                                    className="form-label"
                                    htmlFor="admin-product-description"
                                >
                                    Description
                                </label>

                                <textarea
                                    id="admin-product-description"
                                    className="form-control admin-product-description-input"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleFormChange}
                                    placeholder="Enter product description"
                                    rows="5"
                                    required
                                />
                            </div>

                            <div className="admin-product-form-actions">
                                <button
                                    className="secondary-button"
                                    type="button"
                                    onClick={closeFormModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    className="primary-button"
                                    type="submit"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <span className="button-spinner" />
                                            Saving...
                                        </>
                                    ) : editingProduct ? (
                                        "Save changes"
                                    ) : (
                                        "Create product"
                                    )}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}

            {showCategoryModal && (
                <div
                    className="admin-product-modal-backdrop"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeCategoryModal();
                        }
                    }}
                >
                    <section
                        className="admin-product-modal admin-category-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="admin-category-modal-title"
                    >
                        <div className="admin-product-modal-heading">
                            <div>
                                <span>Category management</span>
                                <h2 id="admin-category-modal-title">
                                    Add new category
                                </h2>
                                <p>
                                    Create a reusable category for
                                    the SmartRetailX product catalogue.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeCategoryModal}
                                disabled={savingCategory}
                                aria-label="Close category form"
                            >
                                ×
                            </button>
                        </div>

                        {error && (
                            <div
                                className="error-message admin-product-modal-alert"
                                role="alert"
                            >
                                <span>⚠</span>
                                {error}
                            </div>
                        )}

                        <form
                            className="admin-product-form admin-category-form"
                            onSubmit={handleCategorySubmit}
                        >
                            <div className="form-group admin-product-form-full">
                                <label
                                    className="form-label"
                                    htmlFor="admin-category-name"
                                >
                                    Category name
                                </label>

                                <input
                                    id="admin-category-name"
                                    className="form-control"
                                    type="text"
                                    name="name"
                                    value={categoryForm.name}
                                    onChange={handleCategoryFormChange}
                                    placeholder="Example: Electronics"
                                    required
                                />
                            </div>

                            <div className="form-group admin-product-form-full">
                                <label
                                    className="form-label"
                                    htmlFor="admin-category-description"
                                >
                                    Description
                                </label>

                                <textarea
                                    id="admin-category-description"
                                    className="form-control admin-product-description-input"
                                    name="description"
                                    value={categoryForm.description}
                                    onChange={handleCategoryFormChange}
                                    placeholder="Describe this category"
                                    rows="4"
                                />
                            </div>

                            <div className="admin-product-form-actions">
                                <button
                                    className="secondary-button"
                                    type="button"
                                    onClick={closeCategoryModal}
                                    disabled={savingCategory}
                                >
                                    Cancel
                                </button>

                                <button
                                    className="primary-button"
                                    type="submit"
                                    disabled={savingCategory}
                                >
                                    {savingCategory
                                        ? "Creating..."
                                        : "Create category"}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </div>
    );
};


export default AdminProducts;