import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, getMe as apiGetMe, logout as apiLogout, getAuthToken, setAuthToken } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(getAuthToken());
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Check auth session on startup
  const checkAuth = useCallback(async () => {
    const existingToken = getAuthToken();
    if (!existingToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await apiGetMe();
      if (res.user) {
        setUser(res.user);
        setTokenState(existingToken);
      } else {
        setUser(null);
        setAuthToken(null);
      }
    } catch (err) {
      console.warn("Session check expired or failed:", err.message);
      setUser(null);
      setAuthToken(null);
      setTokenState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login handler
  const login = async (email, password) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await apiLogin(email, password);
      if (res.user && res.token) {
        setUser(res.user);
        setTokenState(res.token);
        return { success: true, user: res.user };
      }
      throw new Error("Invalid response format from login service");
    } catch (err) {
      setAuthError(err.message || "Failed to sign in. Please check your credentials.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await apiLogout();
    } catch (e) {
      console.warn("Logout error:", e);
    } finally {
      setUser(null);
      setTokenState(null);
      setAuthToken(null);
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isEmployee: user?.role === 'EMPLOYEE',
    isLoading,
    authError,
    login,
    logout,
    refreshUser: checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
