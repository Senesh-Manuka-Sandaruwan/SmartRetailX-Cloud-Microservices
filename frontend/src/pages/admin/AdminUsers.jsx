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

import { userAPI } from "../../api/axiosConfig";
import { useAuth } from "../../context/AuthContext";


/*
The userAPI base URL already ends with /users.

Expected backend endpoints:

GET    /users/admin/users
PUT    /users/admin/users/{user_id}/status
DELETE /users/admin/users/{user_id}

Change only these constants if your User Service uses
different administrator routes.
*/
const ADMIN_USERS_ENDPOINT =
    "/admin/users";

const getAdminUserEndpoint = (userId) =>
    `/admin/users/${userId}`;

const getAdminUserStatusEndpoint = (userId) =>
    `/admin/users/${userId}/status`;


const formatDate = (value) => {
    if (!value) {
        return "Not available";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not available";
    }

    return date.toLocaleString();
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


const extractUsers = (responseData) => {
    if (Array.isArray(responseData)) {
        return responseData;
    }

    const possibleKeys = [
        "users",
        "items",
        "data",
        "results"
    ];

    for (const key of possibleKeys) {
        if (Array.isArray(responseData?.[key])) {
            return responseData[key];
        }
    }

    return [];
};


const normalizeRole = (role) => {
    return String(
        role || "customer"
    ).toLowerCase();
};


const getUserDisplayName = (user) => {
    return (
        user.full_name ||
        user.name ||
        user.username ||
        user.email ||
        `User #${user.id}`
    );
};


const getUserStatus = (user) => {
    if (
        user.is_active === false ||
        String(user.status).toLowerCase() ===
            "disabled" ||
        String(user.status).toLowerCase() ===
            "inactive"
    ) {
        return "Disabled";
    }

    return "Active";
};


const AdminUsers = () => {
    const navigate = useNavigate();

    const {
        user: currentUser,
        logout
    } = useAuth();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] =
        useState(false);

    const [searchTerm, setSearchTerm] =
        useState("");

    const [roleFilter, setRoleFilter] =
        useState("All");

    const [statusFilter, setStatusFilter] =
        useState("All");

    const [sortOption, setSortOption] =
        useState("newest");

    const [selectedUser, setSelectedUser] =
        useState(null);

    const [updatingUserId, setUpdatingUserId] =
        useState(null);

    const [deletingUserId, setDeletingUserId] =
        useState(null);

    const [error, setError] = useState("");
    const [success, setSuccess] =
        useState("");


    const adminEmail =
        currentUser?.sub ||
        currentUser?.email ||
        "Administrator";


    const loadUsers = useCallback(
        async (showRefreshState = false) => {
            if (showRefreshState) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            try {
                const response =
                    await userAPI.get(
                        ADMIN_USERS_ENDPOINT
                    );

                setUsers(
                    extractUsers(
                        response.data
                    )
                );
            } catch (requestError) {
                setError(
                    getBackendError(
                        requestError,
                        "Unable to load users. Confirm that the User Service provides GET /users/admin/users."
                    )
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        []
    );


    useEffect(() => {
        loadUsers();
    }, [loadUsers]);


    const statistics = useMemo(() => {
        const admins = users.filter(
            (user) =>
                normalizeRole(user.role) ===
                "admin"
        ).length;

        const customers = users.filter(
            (user) =>
                normalizeRole(user.role) ===
                "customer"
        ).length;

        const active = users.filter(
            (user) =>
                getUserStatus(user) ===
                "Active"
        ).length;

        const disabled = users.filter(
            (user) =>
                getUserStatus(user) ===
                "Disabled"
        ).length;

        return {
            total: users.length,
            admins,
            customers,
            active,
            disabled
        };
    }, [users]);


    const filteredUsers = useMemo(() => {
        const normalizedSearch =
            searchTerm.trim().toLowerCase();

        const result = users.filter(
            (user) => {
                const searchableValues = [
                    user.id,
                    user.full_name,
                    user.name,
                    user.username,
                    user.email,
                    user.role,
                    user.status
                ]
                    .filter(
                        (value) =>
                            value !== undefined &&
                            value !== null
                    )
                    .map(
                        (value) =>
                            String(value).toLowerCase()
                    );

                const matchesSearch =
                    !normalizedSearch ||
                    searchableValues.some(
                        (value) =>
                            value.includes(
                                normalizedSearch
                            )
                    );

                const role =
                    normalizeRole(user.role);

                const matchesRole =
                    roleFilter === "All" ||
                    role ===
                        roleFilter.toLowerCase();

                const status =
                    getUserStatus(user);

                const matchesStatus =
                    statusFilter === "All" ||
                    status === statusFilter;

                return (
                    matchesSearch &&
                    matchesRole &&
                    matchesStatus
                );
            }
        );

        return [...result].sort(
            (firstUser, secondUser) => {
                if (sortOption === "oldest") {
                    return (
                        new Date(
                            firstUser.created_at || 0
                        ).getTime() -
                        new Date(
                            secondUser.created_at || 0
                        ).getTime()
                    );
                }

                if (sortOption === "name-asc") {
                    return getUserDisplayName(
                        firstUser
                    ).localeCompare(
                        getUserDisplayName(
                            secondUser
                        )
                    );
                }

                if (sortOption === "name-desc") {
                    return getUserDisplayName(
                        secondUser
                    ).localeCompare(
                        getUserDisplayName(
                            firstUser
                        )
                    );
                }

                return (
                    new Date(
                        secondUser.created_at || 0
                    ).getTime() -
                    new Date(
                        firstUser.created_at || 0
                    ).getTime()
                );
            }
        );
    }, [
        users,
        searchTerm,
        roleFilter,
        statusFilter,
        sortOption
    ]);


    const clearFilters = () => {
        setSearchTerm("");
        setRoleFilter("All");
        setStatusFilter("All");
        setSortOption("newest");
    };


    const updateUserStatus = async (
        targetUser
    ) => {
        const currentStatus =
            getUserStatus(targetUser);

        const nextIsActive =
            currentStatus !== "Active";

        setUpdatingUserId(targetUser.id);
        setError("");
        setSuccess("");

        try {
            const response =
                await userAPI.put(
                    getAdminUserStatusEndpoint(
                        targetUser.id
                    ),
                    {
                        is_active: nextIsActive
                    }
                );

            const updatedUser =
                response.data?.user ||
                response.data;

            const fallbackUpdate = {
                is_active: nextIsActive,
                status:
                    nextIsActive
                        ? "Active"
                        : "Disabled"
            };

            setUsers(
                (currentUsers) =>
                    currentUsers.map(
                        (user) =>
                            user.id ===
                            targetUser.id
                                ? {
                                      ...user,
                                      ...fallbackUpdate,
                                      ...updatedUser
                                  }
                                : user
                    )
            );

            setSelectedUser(
                (user) =>
                    user?.id ===
                    targetUser.id
                        ? {
                              ...user,
                              ...fallbackUpdate,
                              ...updatedUser
                          }
                        : user
            );

            setSuccess(
                `${getUserDisplayName(
                    targetUser
                )} was ${
                    nextIsActive
                        ? "enabled"
                        : "disabled"
                } successfully.`
            );
        } catch (requestError) {
            setError(
                getBackendError(
                    requestError,
                    "Unable to change this user's account status. Confirm the administrator status endpoint."
                )
            );
        } finally {
            setUpdatingUserId(null);
        }
    };


    const deleteUser = async (
        targetUser
    ) => {
        if (
            String(targetUser.email) ===
            String(adminEmail)
        ) {
            setError(
                "You cannot delete your own administrator account."
            );
            return;
        }

        const confirmed = window.confirm(
            `Delete ${getUserDisplayName(
                targetUser
            )} permanently?`
        );

        if (!confirmed) {
            return;
        }

        setDeletingUserId(targetUser.id);
        setError("");
        setSuccess("");

        try {
            await userAPI.delete(
                getAdminUserEndpoint(
                    targetUser.id
                )
            );

            setUsers(
                (currentUsers) =>
                    currentUsers.filter(
                        (user) =>
                            user.id !==
                            targetUser.id
                    )
            );

            setSelectedUser(
                (user) =>
                    user?.id ===
                    targetUser.id
                        ? null
                        : user
            );

            setSuccess(
                `${getUserDisplayName(
                    targetUser
                )} was deleted successfully.`
            );
        } catch (requestError) {
            setError(
                getBackendError(
                    requestError,
                    "Unable to delete this user. Confirm the administrator delete endpoint."
                )
            );
        } finally {
            setDeletingUserId(null);
        }
    };


    const handleLogout = () => {
        logout();
        navigate("/login");
    };


    return (
        <div className="admin-users-page">
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
                        className="admin-nav-link"
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
                        className="admin-nav-link active"
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

            <main className="admin-users-main">
                <header className="admin-users-topbar">
                    <div>
                        <p className="admin-topbar-label">
                            Account administration
                        </p>

                        <h1>
                            User
                            <span> management</span>
                        </h1>

                        <p>
                            Review customer and administrator accounts,
                            account roles and access status.
                        </p>
                    </div>

                    <button
                        className="admin-refresh-button"
                        type="button"
                        onClick={() => {
                            loadUsers(true);
                        }}
                        disabled={refreshing}
                    >
                        {refreshing
                            ? "Refreshing..."
                            : "Refresh users"}
                    </button>
                </header>

                {error && (
                    <div
                        className="error-message admin-users-alert"
                        role="alert"
                    >
                        <span>⚠</span>
                        {error}
                    </div>
                )}

                {success && (
                    <div
                        className="success-message admin-users-alert"
                        role="status"
                    >
                        <span>✓</span>
                        {success}
                    </div>
                )}

                <section className="admin-users-hero">
                    <div>
                        <span>
                            Connected User Service
                        </span>

                        <h2>
                            Manage access across the SmartRetailX
                            platform.
                        </h2>

                        <p>
                            Search accounts, inspect user information
                            and manage account access from a single
                            administration page.
                        </p>
                    </div>

                    <div className="admin-users-hero-visual">
                        <span>👥</span>

                        <strong>
                            {loading
                                ? "..."
                                : statistics.total}
                        </strong>

                        <small>
                            Registered users
                        </small>
                    </div>
                </section>

                <section className="admin-users-stat-grid">
                    <article>
                        <span>Total users</span>
                        <strong>
                            {loading
                                ? "..."
                                : statistics.total}
                        </strong>
                    </article>

                    <article>
                        <span>Customers</span>
                        <strong>
                            {loading
                                ? "..."
                                : statistics.customers}
                        </strong>
                    </article>

                    <article>
                        <span>Administrators</span>
                        <strong>
                            {loading
                                ? "..."
                                : statistics.admins}
                        </strong>
                    </article>

                    <article>
                        <span>Active</span>
                        <strong>
                            {loading
                                ? "..."
                                : statistics.active}
                        </strong>
                    </article>

                    <article>
                        <span>Disabled</span>
                        <strong>
                            {loading
                                ? "..."
                                : statistics.disabled}
                        </strong>
                    </article>
                </section>

                <section className="admin-users-filter-panel">
                    <div className="admin-users-search">
                        <label htmlFor="admin-user-search">
                            Search users
                        </label>

                        <div>
                            <span>⌕</span>

                            <input
                                id="admin-user-search"
                                type="search"
                                value={searchTerm}
                                onChange={(event) => {
                                    setSearchTerm(
                                        event.target.value
                                    );
                                }}
                                placeholder="Search by name, email, role or ID"
                            />
                        </div>
                    </div>

                    <div className="admin-users-filter">
                        <label htmlFor="admin-user-role-filter">
                            Role
                        </label>

                        <select
                            id="admin-user-role-filter"
                            value={roleFilter}
                            onChange={(event) => {
                                setRoleFilter(
                                    event.target.value
                                );
                            }}
                        >
                            <option value="All">
                                All roles
                            </option>

                            <option value="Customer">
                                Customers
                            </option>

                            <option value="Admin">
                                Administrators
                            </option>
                        </select>
                    </div>

                    <div className="admin-users-filter">
                        <label htmlFor="admin-user-status-filter">
                            Status
                        </label>

                        <select
                            id="admin-user-status-filter"
                            value={statusFilter}
                            onChange={(event) => {
                                setStatusFilter(
                                    event.target.value
                                );
                            }}
                        >
                            <option value="All">
                                All statuses
                            </option>

                            <option value="Active">
                                Active
                            </option>

                            <option value="Disabled">
                                Disabled
                            </option>
                        </select>
                    </div>

                    <div className="admin-users-filter">
                        <label htmlFor="admin-user-sort">
                            Sort
                        </label>

                        <select
                            id="admin-user-sort"
                            value={sortOption}
                            onChange={(event) => {
                                setSortOption(
                                    event.target.value
                                );
                            }}
                        >
                            <option value="newest">
                                Newest first
                            </option>

                            <option value="oldest">
                                Oldest first
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
                        className="admin-users-clear-button"
                        type="button"
                        onClick={clearFilters}
                    >
                        Clear filters
                    </button>
                </section>

                <section className="admin-users-content">
                    <div className="admin-users-heading">
                        <div>
                            <span>User accounts</span>

                            <h2>
                                {loading
                                    ? "Loading users"
                                    : `${filteredUsers.length} user${
                                          filteredUsers.length === 1
                                              ? ""
                                              : "s"
                                      } found`}
                            </h2>
                        </div>
                    </div>

                    {loading ? (
                        <div className="admin-users-loading">
                            Loading users...
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="admin-users-empty">
                            <div>👥</div>

                            <h3>No matching users</h3>

                            <p>
                                Change your search or filter options.
                            </p>

                            <button
                                className="secondary-button"
                                type="button"
                                onClick={clearFilters}
                            >
                                Reset filters
                            </button>
                        </div>
                    ) : (
                        <div className="admin-users-table-wrapper">
                            <table className="admin-users-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Registered</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredUsers.map(
                                        (user) => {
                                            const status =
                                                getUserStatus(
                                                    user
                                                );

                                            const role =
                                                normalizeRole(
                                                    user.role
                                                );

                                            return (
                                                <tr key={user.id}>
                                                    <td>
                                                        <div className="admin-user-identity">
                                                            <div>
                                                                {getUserDisplayName(
                                                                    user
                                                                )
                                                                    .charAt(0)
                                                                    .toUpperCase()}
                                                            </div>

                                                            <span>
                                                                <strong>
                                                                    {getUserDisplayName(
                                                                        user
                                                                    )}
                                                                </strong>

                                                                <small>
                                                                    User #
                                                                    {user.id}
                                                                </small>
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td>
                                                        {user.email ||
                                                            "Not available"}
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={
                                                                role ===
                                                                "admin"
                                                                    ? "admin-user-role-badge admin"
                                                                    : "admin-user-role-badge customer"
                                                            }
                                                        >
                                                            {role ===
                                                            "admin"
                                                                ? "Administrator"
                                                                : "Customer"}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={
                                                                status ===
                                                                "Active"
                                                                    ? "admin-user-status-badge active"
                                                                    : "admin-user-status-badge disabled"
                                                            }
                                                        >
                                                            {status}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        {formatDate(
                                                            user.created_at
                                                        )}
                                                    </td>

                                                    <td>
                                                        <div className="admin-user-actions">
                                                            <button
                                                                className="admin-user-view-button"
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedUser(
                                                                        user
                                                                    );
                                                                }}
                                                            >
                                                                View
                                                            </button>

                                                            <button
                                                                className={
                                                                    status ===
                                                                    "Active"
                                                                        ? "admin-user-status-button disable"
                                                                        : "admin-user-status-button enable"
                                                                }
                                                                type="button"
                                                                onClick={() => {
                                                                    updateUserStatus(
                                                                        user
                                                                    );
                                                                }}
                                                                disabled={
                                                                    updatingUserId ===
                                                                    user.id
                                                                }
                                                            >
                                                                {updatingUserId ===
                                                                user.id
                                                                    ? "Updating..."
                                                                    : status ===
                                                                        "Active"
                                                                      ? "Disable"
                                                                      : "Enable"}
                                                            </button>

                                                            <button
                                                                className="admin-user-delete-button"
                                                                type="button"
                                                                onClick={() => {
                                                                    deleteUser(
                                                                        user
                                                                    );
                                                                }}
                                                                disabled={
                                                                    deletingUserId ===
                                                                    user.id
                                                                }
                                                            >
                                                                {deletingUserId ===
                                                                user.id
                                                                    ? "Deleting..."
                                                                    : "Delete"}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>

            {selectedUser && (
                <div
                    className="admin-user-modal-backdrop"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            setSelectedUser(null);
                        }
                    }}
                >
                    <section
                        className="admin-user-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="admin-user-modal-title"
                    >
                        <div className="admin-user-modal-heading">
                            <div>
                                <span>User information</span>

                                <h2 id="admin-user-modal-title">
                                    {getUserDisplayName(
                                        selectedUser
                                    )}
                                </h2>

                                <p>
                                    Review account identity, role and
                                    access status.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedUser(null);
                                }}
                                aria-label="Close user details"
                            >
                                ×
                            </button>
                        </div>

                        <div className="admin-user-details-grid">
                            <article>
                                <span>User ID</span>
                                <strong>
                                    #{selectedUser.id}
                                </strong>
                            </article>

                            <article>
                                <span>Email</span>
                                <strong>
                                    {selectedUser.email ||
                                        "Not available"}
                                </strong>
                            </article>

                            <article>
                                <span>Role</span>
                                <strong>
                                    {normalizeRole(
                                        selectedUser.role
                                    ) === "admin"
                                        ? "Administrator"
                                        : "Customer"}
                                </strong>
                            </article>

                            <article>
                                <span>Status</span>
                                <strong>
                                    {getUserStatus(
                                        selectedUser
                                    )}
                                </strong>
                            </article>

                            <article>
                                <span>Registered</span>
                                <strong>
                                    {formatDate(
                                        selectedUser.created_at
                                    )}
                                </strong>
                            </article>

                            <article>
                                <span>Last updated</span>
                                <strong>
                                    {formatDate(
                                        selectedUser.updated_at
                                    )}
                                </strong>
                            </article>
                        </div>

                        <div className="admin-user-modal-actions">
                            <button
                                className="secondary-button"
                                type="button"
                                onClick={() => {
                                    setSelectedUser(null);
                                }}
                            >
                                Close
                            </button>

                            <button
                                className={
                                    getUserStatus(
                                        selectedUser
                                    ) === "Active"
                                        ? "admin-user-status-button disable"
                                        : "admin-user-status-button enable"
                                }
                                type="button"
                                onClick={() => {
                                    updateUserStatus(
                                        selectedUser
                                    );
                                }}
                                disabled={
                                    updatingUserId ===
                                    selectedUser.id
                                }
                            >
                                {getUserStatus(
                                    selectedUser
                                ) === "Active"
                                    ? "Disable account"
                                    : "Enable account"}
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
};


export default AdminUsers;