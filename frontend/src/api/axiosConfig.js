import axios from "axios";

// ================================
// USER SERVICE
// ================================
export const userAPI = axios.create({
    baseURL: `${import.meta.env.VITE_USER_SERVICE}/users`,
    headers: {
        "Content-Type": "application/json",
    },
});

// ================================
// PRODUCT SERVICE
// ================================
export const productAPI = axios.create({
    baseURL: `${import.meta.env.VITE_PRODUCT_SERVICE}/products`,
    headers: {
        "Content-Type": "application/json",
    },
});

// ================================
// ORDER SERVICE
// ================================
export const orderAPI = axios.create({
    baseURL: `${import.meta.env.VITE_ORDER_SERVICE}/orders`,
    headers: {
        "Content-Type": "application/json",
    },
});

// ================================
// NOTIFICATION SERVICE
// ================================
export const notificationAPI = axios.create({
    baseURL: `${import.meta.env.VITE_NOTIFICATION_SERVICE}/notifications`,
    headers: {
        "Content-Type": "application/json",
    },
});


// ==========================================
// Automatically attach JWT Token
// ==========================================
const attachToken = (config) => {

    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
};


// ==========================================
// Apply interceptor to all services
// ==========================================
userAPI.interceptors.request.use(attachToken);
productAPI.interceptors.request.use(attachToken);
orderAPI.interceptors.request.use(attachToken);
notificationAPI.interceptors.request.use(attachToken);