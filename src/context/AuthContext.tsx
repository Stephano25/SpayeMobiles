// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { storage } from '../utils/storage';
import api from '../services/api';
import { AuthService } from '../services/AuthService';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber?: string;
  }) => Promise<void>;
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

let navigateTo: ((route: string) => void) | null = null;

export const setNavigateTo = (navigate: (route: string) => void) => {
  navigateTo = navigate;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const storedToken = await storage.getItem<string>('token');
      const userData = await storage.getItem<User>('user');
      if (storedToken && userData) {
        setUser(userData);
        setToken(storedToken);
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await AuthService.login(email, password);
      const { access_token, user: userData } = res;
      await AuthService.saveSession(access_token, userData);
      setToken(access_token);
      setUser(userData);
      const isAdmin = userData.role === 'admin' || userData.role === 'super_admin';
      if (navigateTo) {
        navigateTo(isAdmin ? 'Admin' : 'User');
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber?: string;
  }) => {
    try {
      const res = await AuthService.register(data);
      const { access_token, user: userData } = res;
      await AuthService.saveSession(access_token, userData);
      setToken(access_token);
      setUser(userData);
      if (navigateTo) {
        navigateTo('User');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await AuthService.logout();
    setUser(null);
    setToken(null);
    if (navigateTo) {
      navigateTo('Auth');
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    const updatedUser = await AuthService.updateProfile(data);
    setUser(updatedUser);
  };

  const getToken = () => token;

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, register, logout, updateProfile, getToken }}
    >
      {children}
    </AuthContext.Provider>
  );
};