import { createContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('admin_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch {
                localStorage.removeItem('admin_user');
                localStorage.removeItem('admin_token');
            }
        }
        setLoading(false);
    }, []);

    function login(userData, token) {
        const payload = { ...userData, token };
        setUser(payload);
        localStorage.setItem('admin_user', JSON.stringify(payload));
        localStorage.setItem('admin_token', token);
    }

    function logout() {
        setUser(null);
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_token');
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export { AuthContext };
