import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi, getProfile } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('ab_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('ab_token');
      const storedUser = localStorage.getItem('ab_user');
      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          const { data } = await getProfile();
          setUser(data.user);
          localStorage.setItem('ab_user', JSON.stringify(data.user));
        } catch {
          localStorage.removeItem('ab_token');
          localStorage.removeItem('ab_user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (credentials) => {
    const { data } = await loginApi(credentials);
    localStorage.setItem('ab_token', data.token);
    localStorage.setItem('ab_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('ab_token');
    localStorage.removeItem('ab_user');
    setUser(null);
    setToken(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('ab_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
