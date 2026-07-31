import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState
} from "react";

import authService from "../services/authService";


const AuthContext = createContext(null);


export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(
        authService.getStoredUser()
    );

    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const initialiseAuthentication = () => {
            if (authService.isAuthenticated()) {
                setUser(authService.getStoredUser());
            } else {
                setUser(null);
            }

            setLoading(false);
        };

        initialiseAuthentication();
    }, []);


    const login = async (credentials) => {
        const result = await authService.login(credentials);

        setUser(result.user);

        return result;
    };


    const register = async (userData) => {
        return authService.register(userData);
    };


    const logout = () => {
        authService.logout();
        setUser(null);
    };


    const refreshUser = () => {
        if (authService.isAuthenticated()) {
            const storedUser = authService.getStoredUser();
            setUser(storedUser);
            return storedUser;
        }

        setUser(null);
        return null;
    };


    const isAdmin = user?.role === "admin";
    const isCustomer = user?.role === "customer";
    const isAuthenticated = Boolean(user);


    const contextValue = useMemo(
        () => ({
            user,
            loading,
            isAuthenticated,
            isAdmin,
            isCustomer,
            login,
            register,
            logout,
            refreshUser
        }),
        [
            user,
            loading,
            isAuthenticated,
            isAdmin,
            isCustomer
        ]
    );


    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};


export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside an AuthProvider."
        );
    }

    return context;
};


export default AuthContext;