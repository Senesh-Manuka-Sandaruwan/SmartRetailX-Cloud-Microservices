import axios from "axios";


// ================================
// USER SERVICE
// ================================
export const userAPI = axios.create({
    baseURL:
        `${import.meta.env.VITE_USER_SERVICE}/users`,

    headers: {
        "Content-Type": "application/json"
    }
});


// ================================
// PRODUCT ROUTES
// ================================
export const productAPI = axios.create({
    baseURL:
        `${import.meta.env.VITE_PRODUCT_SERVICE}/products`,

    headers: {
        "Content-Type": "application/json"
    }
});


// ================================
// PRODUCT SERVICE ROOT
// Used for /categories routes
// ================================
export const productServiceAPI = axios.create({
    baseURL:
        import.meta.env.VITE_PRODUCT_SERVICE ||
        "http://127.0.0.1:8001",

    headers: {
        "Content-Type": "application/json"
    }
});


// ================================
// ORDER SERVICE
// ================================
export const orderAPI = axios.create({
    baseURL:
        `${import.meta.env.VITE_ORDER_SERVICE}/orders`,

    headers: {
        "Content-Type": "application/json"
    }
});


// ================================
// NOTIFICATION SERVICE
// ================================
export const notificationAPI = axios.create({
    baseURL:
        `${import.meta.env.VITE_NOTIFICATION_SERVICE}/notifications`,

    headers: {
        "Content-Type": "application/json"
    }
});


// ==========================================
// Automatically attach JWT token
// ==========================================
const attachToken = (config) => {
    const token =
        localStorage.getItem("token");

    if (token) {
        config.headers.Authorization =
            `Bearer ${token}`;
    }

    return config;
};


const handleRequestError = (error) => {
    return Promise.reject(error);
};


// ==========================================
// Apply interceptor after all API clients
// have been created
// ==========================================
userAPI.interceptors.request.use(
    attachToken,
    handleRequestError
);

productAPI.interceptors.request.use(
    attachToken,
    handleRequestError
);

productServiceAPI.interceptors.request.use(
    attachToken,
    handleRequestError
);

orderAPI.interceptors.request.use(
    attachToken,
    handleRequestError
);

notificationAPI.interceptors.request.use(
    attachToken,
    handleRequestError
);