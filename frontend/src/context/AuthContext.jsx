import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../api/axios';
import { normalizeRole } from '../utils/roles';

const AuthContext = createContext(null);

function sanitizeUser(u) {
  if (!u) return null;
  return {
    ...u,
    role: normalizeRole(u.role),
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
    if (storedUser && token) {
      try {
        const parsed = sanitizeUser(JSON.parse(storedUser));
        setUser(parsed);
      } catch {
        setUser(null);
      }
      // Verify token is still valid
      API.get('/auth/me')
        .then((res) => {
          const freshUser = sanitizeUser(res.data.data.user);
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        })
        .catch(() => {
          // Token invalid — clear everything
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password, loginType) => {
    const payload = { email, password };
    if (loginType) payload.login_type = loginType;
    const { data } = await API.post('/auth/login', payload);
    if (data.success) {
      const normalizedUser = sanitizeUser(data.data.user);
      localStorage.setItem('access_token', data.data.access_token);
      localStorage.setItem('refresh_token', data.data.refresh_token);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      setUser(normalizedUser);
      return {
        ...data,
        data: {
          ...data.data,
          user: normalizedUser,
        },
      };
    }
    return data;
  }, []);

  const register = useCallback(async (userData) => {
    const { data } = await API.post('/auth/register', userData);
    if (data.success) {
      const normalizedUser = sanitizeUser(data.data.user);
      localStorage.setItem('access_token', data.data.access_token);
      localStorage.setItem('refresh_token', data.data.refresh_token);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      setUser(normalizedUser);
      return {
        ...data,
        data: {
          ...data.data,
          user: normalizedUser,
        },
      };
    }
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await API.post('/auth/logout', { refresh_token: refreshToken });
      }
    } catch {
      // Even if API call fails, clear local state
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setUser(null);
    }
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
