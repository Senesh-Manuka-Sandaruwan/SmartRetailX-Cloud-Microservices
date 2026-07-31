import { userAPI } from "../api/axiosConfig";


const TOKEN_KEY = "token";
const USER_KEY = "user";


const decodeJwtPayload = (token) => {
    try {
        const payload = token.split(".")[1];

        const normalizedPayload = payload
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        const decodedPayload = decodeURIComponent(
            window
                .atob(normalizedPayload)
                .split("")
                .map((character) => {
                    return `%${(
                        "00" + character.charCodeAt(0).toString(16)
                    ).slice(-2)}`;
                })
                .join("")
        );

        return JSON.parse(decodedPayload);
    } catch {
        return null;
    }
};


const saveAuthentication = (token) => {
    const decodedUser = decodeJwtPayload(token);

    localStorage.setItem(TOKEN_KEY, token);

    if (decodedUser) {
        localStorage.setItem(
            USER_KEY,
            JSON.stringify(decodedUser)
        );
    }

    return decodedUser;
};


const register = async (userData) => {
    const response = await userAPI.post(
        "/register",
        userData
    );

    return response.data;
};


const login = async (credentials) => {
    const response = await userAPI.post(
        "/login",
        credentials
    );

    const token = response.data.access_token;

    if (!token) {
        throw new Error(
            "The User Service did not return an access token."
        );
    }

    const user = saveAuthentication(token);

    return {
        token,
        user,
        tokenType: response.data.token_type
    };
};


const getProfile = async () => {
    const response = await userAPI.get("/profile");

    return response.data;
};


const getAdminDashboard = async () => {
    const response = await userAPI.get("/admin");

    return response.data;
};


const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
};


const getToken = () => {
    return localStorage.getItem(TOKEN_KEY);
};


const getStoredUser = () => {
    const user = localStorage.getItem(USER_KEY);

    if (!user) {
        return null;
    }

    try {
        return JSON.parse(user);
    } catch {
        localStorage.removeItem(USER_KEY);
        return null;
    }
};


const isAuthenticated = () => {
    const token = getToken();

    if (!token) {
        return false;
    }

    const payload = decodeJwtPayload(token);

    if (!payload) {
        logout();
        return false;
    }

    if (
        payload.exp &&
        payload.exp * 1000 < Date.now()
    ) {
        logout();
        return false;
    }

    return true;
};


const getUserRole = () => {
    const user = getStoredUser();

    return user?.role ?? null;
};


const authService = {
    register,
    login,
    logout,
    getProfile,
    getAdminDashboard,
    getToken,
    getStoredUser,
    getUserRole,
    isAuthenticated
};


export default authService;