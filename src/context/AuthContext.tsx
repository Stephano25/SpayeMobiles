import React, { createContext, useState, useContext, useEffect } from 'react';
import { storage } from '../utils/storage';
import api from '../services/api';
import { User, LoginResponse } from '../types';
import { router } from 'expo-router';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { firstName: string; lastName: string; email: string; password: string; phoneNumber?: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const storedToken = await storage.getItem<string>('token');
    const userData = await storage.getItem<User>('user');
    if (storedToken && userData) {
      setUser(userData);
      setToken(storedToken);
      api.defaults.headers.Authorization = `Bearer ${storedToken}`;
    }
    setIsLoading(false);
  };

  const login = async (email: string, password: string) => {
    const res = await api.post<LoginResponse>('/auth/login', { email, password });
    const { access_token, user: userData } = res.data;
    await storage.setItem('token', access_token);
    await storage.setItem('user', userData);
    api.defaults.headers.Authorization = `Bearer ${access_token}`;
    setToken(access_token);
    setUser(userData);
    const isAdmin = userData.role === 'admin' || userData.role === 'super_admin';
    router.replace(isAdmin ? '/(admin)' : '/(user)');
  };

  const register = async (data: { firstName: string; lastName: string; email: string; password: string; phoneNumber?: string }) => {
    const res = await api.post<LoginResponse>('/auth/register', data);
    const { access_token, user: userData } = res.data;
    await storage.setItem('token', access_token);
    await storage.setItem('user', userData);
    api.defaults.headers.Authorization = `Bearer ${access_token}`;
    setToken(access_token);
    setUser(userData);
    router.replace('/(user)');
  };

  const logout = async () => {
    await storage.removeItem('token');
    await storage.removeItem('user');
    delete api.defaults.headers.Authorization;
    setUser(null);
    setToken(null);
    router.replace('/(auth)/login');
  };

  const updateProfile = async (data: Partial<User>) => {
    const response = await api.put<User>('/users/profile', data);
    const updatedUser = response.data;
    await storage.setItem('user', updatedUser);
    setUser(updatedUser);
  };

  const getToken = () => token;

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateProfile, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};