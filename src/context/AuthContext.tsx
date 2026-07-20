// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '../config/api';

// ✅ Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  profilePicture?: string;
  balance: number;
  qrCode: string;
  role: 'user' | 'admin' | 'super_admin';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  bio?: string;
  isGoogleUser?: boolean;
  language: string;
  friends: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  loginWithToken: (token: string, userData: User) => Promise<void>;
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
  refreshUser: () => Promise<void>;
  // ✅ Méthodes supplémentaires pour compatibilité
  loadCurrentUser: () => Promise<User | null>;
  getCurrentUserId: () => Promise<string | null>;
}

// ✅ Création du contexte
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ✅ Hook personnalisé
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

// ✅ Provider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Charger l'utilisateur au démarrage
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('user'),
      ]);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        console.log('✅ Utilisateur chargé depuis le stockage');
        
        // ✅ Vérifier que le token est toujours valide
        await refreshUser();
      }
    } catch (error) {
      console.error('❌ Erreur chargement utilisateur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Récupérer l'utilisateur courant (synchrone)
  const getCurrentUser = (): User | null => {
    return user;
  };

  // ✅ Récupérer l'ID de l'utilisateur courant
  const getCurrentUserId = async (): Promise<string | null> => {
    return user?.id || null;
  };

  // ✅ Charger l'utilisateur depuis le stockage (asynchrone)
  const loadCurrentUser = async (): Promise<User | null> => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        return parsedUser;
      }
      return null;
    } catch (error) {
      console.error('❌ Erreur loadCurrentUser:', error);
      return null;
    }
  };

  const getToken = async (): Promise<string | null> => {
    if (token) return token;
    const storedToken = await AsyncStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      return storedToken;
    }
    return null;
  };

  // ✅ Rafraîchir l'utilisateur
  const refreshUser = async () => {
    try {
      const currentToken = await getToken();
      if (!currentToken) {
        console.log('⚠️ Pas de token pour refresh');
        return;
      }

      const apiUrl = await getApiUrl();
      const response = await fetch(`${apiUrl}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        console.log('✅ Utilisateur rafraîchi');
      } else if (response.status === 401) {
        // ✅ Token expiré - Déconnexion
        console.log('⏰ Token expiré, déconnexion...');
        await logout();
      }
    } catch (error) {
      console.error('❌ Erreur refreshUser:', error);
    }
  };

  // ✅ Login avec email/mot de passe
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const apiUrl = await getApiUrl();

      console.log(`🔐 Tentative de connexion: ${email}`);

      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur de connexion');
      }

      console.log(`✅ Connexion réussie: ${data.user.email}`);

      // ✅ Sauvegarder le token et l'utilisateur
      await AsyncStorage.setItem('token', data.access_token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));

      setToken(data.access_token);
      setUser(data.user);

      // ✅ Redirection selon le rôle
      if (navigateTo) {
        const isAdmin = data.user.role === 'admin' || data.user.role === 'super_admin';
        navigateTo(isAdmin ? 'AdminHome' : 'UserHome');
      }

      return data;
    } catch (error) {
      console.error('❌ Erreur login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Login avec token (pour Google OAuth)
  const loginWithToken = async (token: string, userData: User) => {
    try {
      setIsLoading(true);
      console.log(`🔑 Connexion avec token pour: ${userData.email}`);

      // ✅ Sauvegarder le token et l'utilisateur
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      setToken(token);
      setUser(userData);

      console.log('✅ Connexion avec token réussie');

      // ✅ Redirection selon le rôle
      if (navigateTo) {
        const isAdmin = userData.role === 'admin' || userData.role === 'super_admin';
        navigateTo(isAdmin ? 'AdminHome' : 'UserHome');
      }
    } catch (error) {
      console.error('❌ Erreur loginWithToken:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Inscription
  const register = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber?: string;
  }) => {
    try {
      setIsLoading(true);
      const apiUrl = await getApiUrl();

      console.log(`📝 Inscription: ${data.email}`);

      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erreur lors de l\'inscription');
      }

      console.log(`✅ Inscription réussie: ${result.user.email}`);

      // ✅ Sauvegarder le token et l'utilisateur
      await AsyncStorage.setItem('token', result.access_token);
      await AsyncStorage.setItem('user', JSON.stringify(result.user));

      setToken(result.access_token);
      setUser(result.user);

      // ✅ Redirection vers l'accueil
      if (navigateTo) {
        navigateTo('UserHome');
      }

      return result;
    } catch (error) {
      console.error('❌ Erreur register:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Déconnexion
  const logout = async () => {
    try {
      console.log('🚪 Déconnexion');
      
      // ✅ Supprimer les données locales
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      
      setToken(null);
      setUser(null);

      // ✅ Redirection vers la page de connexion
      if (navigateTo) {
        navigateTo('Login');
      }
    } catch (error) {
      console.error('❌ Erreur logout:', error);
      throw error;
    }
  };

  // ✅ Mise à jour du profil
  const updateProfile = async (data: Partial<User>) => {
    try {
      setIsLoading(true);
      const apiUrl = await getApiUrl();
      const currentToken = await getToken();

      if (!currentToken) {
        throw new Error('Non authentifié');
      }

      const response = await fetch(`${apiUrl}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
        },
        body: JSON.stringify(data),
      });

      const updatedUser = await response.json();

      if (!response.ok) {
        throw new Error(updatedUser.message || 'Erreur lors de la mise à jour');
      }

      console.log('✅ Profil mis à jour');

      // ✅ Mettre à jour l'utilisateur local
      const newUser = { ...user, ...updatedUser } as User;
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);

      return newUser;
    } catch (error) {
      console.error('❌ Erreur updateProfile:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        loginWithToken,
        register,
        logout,
        updateProfile,
        getToken,
        getCurrentUser,
        refreshUser,
        // ✅ Méthodes supplémentaires
        loadCurrentUser,
        getCurrentUserId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Exports pour compatibilité avec AuthService
export const getCurrentUser = () => {
  const context = useContext(AuthContext);
  return context?.getCurrentUser() || null;
};

export const getCurrentUserId = async () => {
  const context = useContext(AuthContext);
  return context?.getCurrentUserId() || null;
};

export const getToken = async () => {
  const context = useContext(AuthContext);
  return context?.getToken() || null;
};

export const logout = async () => {
  const context = useContext(AuthContext);
  if (context) await context.logout();
};