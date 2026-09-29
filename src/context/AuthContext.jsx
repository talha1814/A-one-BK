import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('aone_token') || null);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('aone_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Sync token and user to localStorage
  const handleSetAuth = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    if (newToken) {
      localStorage.setItem('aone_token', newToken);
    } else {
      localStorage.removeItem('aone_token');
    }
    if (newUser) {
      localStorage.setItem('aone_user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('aone_user');
    }
  };

  // Verify and refresh session on mount
  const refreshUser = useCallback(async () => {
    const savedToken = localStorage.getItem('aone_token');
    if (!savedToken) {
      setLoading(false);
      return;
    }

    try {
      const res = await authAPI.getMe();
      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem('aone_user', JSON.stringify(res.user));
      }
    } catch (err) {
      console.warn('Session verification failed, logging out:', err.message);
      handleSetAuth(null, null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (username, password) => {
    const res = await authAPI.login(username, password);
    if (res.success && res.token) {
      handleSetAuth(res.token, res.user);
      return res.user;
    }
    throw new Error(res.error || 'Login failed');
  };

  const logout = () => {
    handleSetAuth(null, null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'admin',
    isClient: user?.role === 'client',
    login,
    logout,
    refreshUser,
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
