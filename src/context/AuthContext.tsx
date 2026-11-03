import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, UserRole } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<User>;
  register: (payload: {
    username: string;
    email: string;
    password: string;
    role: string;
    first_name?: string;
    last_name?: string;
  }) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const userData = await authApi.getMe();
      setUser(userData);
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    refreshUser();

    const handleAuthLogout = () => {
      logout();
    };

    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, [refreshUser, logout]);

  const login = async (username: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await authApi.login({ username, password });
      localStorage.setItem('access_token', response.access);
      localStorage.setItem('refresh_token', response.refresh);
      setUser(response.user);
      return response.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: {
    username: string;
    email: string;
    password: string;
    role: string;
    first_name?: string;
    last_name?: string;
  }): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await authApi.register(payload);
      localStorage.setItem('access_token', response.access);
      localStorage.setItem('refresh_token', response.refresh);
      setUser(response.user);
      return response.user;
    } finally {
      setIsLoading(false);
    }
  };

  const role: UserRole | null = user?.role || null;
  const isAuthenticated = Boolean(user && localStorage.getItem('access_token'));

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
