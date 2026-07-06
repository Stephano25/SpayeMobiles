// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/AuthService';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  getToken: () => Promise<string | null>;
  getCurrentUser: () => User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// ✅ Fonction de navigation globale
let navigateTo: ((route: string) => void) | null = null;

export const setNavigateTo = (navigate: (route: string) => void) => {
  navigateTo = navigate;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentUser = (): User | null => {
    return user;
  };

  const getToken = async (): Promise<string | null> => {
    return await AsyncStorage.getItem('auth_token');
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      setUser(response.user);
      
      // ✅ Utiliser navigateTo pour changer de route après login
      const isAdmin = response.user.role === 'admin' || response.user.role === 'super_admin';
      if (navigateTo) {
        navigateTo(isAdmin ? 'AdminHome' : 'UserHome');
      }
      return response;
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
      const response = await authService.register(data);
      setUser(response.user);
      if (navigateTo) {
        navigateTo('UserHome');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    if (navigateTo) {
      navigateTo('Login');
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        isLoading, 
        login, 
        register, 
        logout, 
        updateProfile, 
        getToken,
        getCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};