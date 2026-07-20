// src/services/AuthService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiGet, apiPost, apiPut, apiPatch } from './api';

const STORAGE_KEYS = {
  TOKEN: '@spaye_token',
  USER: '@spaye_user',
};

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token?: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'user' | 'admin' | 'super_admin';
    isActive: boolean;
    balance?: number;
    qrCode?: string;
    phoneNumber?: string;
    profilePicture?: string;
    language?: string;
  };
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  language?: string;
}

class AuthService {
  private static instance: AuthService;
  private currentUser: LoginResponse['user'] | null = null;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // ============================================================
  // AUTHENTIFICATION
  // ============================================================

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await apiPost<LoginResponse>('/auth/login', credentials);
      
      console.log('🔐 Login response:', response);
      
      const token = response.access_token || response.token;
      if (token) {
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
        this.currentUser = response.user;
        console.log('✅ Utilisateur stocké:', response.user.email);
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur login:', error);
      throw error;
    }
  }

  async register(data: RegisterData): Promise<LoginResponse> {
    try {
      const response = await apiPost<LoginResponse>('/auth/register', data);
      
      const token = response.access_token || response.token;
      if (token) {
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
        this.currentUser = response.user;
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur register:', error);
      throw error;
    }
  }

  // ============================================================
  // UTILISATEUR - AVEC LOGS POUR DEBUG
  // ============================================================

  async getCurrentUser(): Promise<LoginResponse['user'] | null> {
    // ✅ Vérifier en mémoire d'abord
    if (this.currentUser) {
      console.log('👤 Utilisateur en mémoire:', this.currentUser.email);
      return this.currentUser;
    }
    
    try {
      // ✅ Vérifier dans le stockage
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      console.log('📦 Données utilisateur dans AsyncStorage:', userData ? '✅ Présent' : '❌ Absent');
      
      if (userData) {
        this.currentUser = JSON.parse(userData);
        console.log('👤 Utilisateur chargé depuis stockage:', this.currentUser.email);
        return this.currentUser;
      }
      
      console.log('⚠️ Aucun utilisateur trouvé dans le stockage');
      return null;
    } catch (error) {
      console.error('❌ Erreur getCurrentUser:', error);
      return null;
    }
  }

  // ✅ Récupérer l'ID de l'utilisateur connecté
  async getCurrentUserId(): Promise<string | null> {
    const user = await this.getCurrentUser();
    return user?.id || null;
  }

  async getToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      console.log('🔑 Token présent:', token ? '✅ Oui' : '❌ Non');
      return token;
    } catch (error) {
      console.error('❌ Erreur getToken:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    console.log('🔓 Déconnexion effectuée');
  }

  // ✅ Vérifier et rafraîchir l'utilisateur
  async refreshUser(): Promise<LoginResponse['user'] | null> {
    try {
      const token = await this.getToken();
      if (!token) {
        console.log('⚠️ Pas de token pour refresh');
        return null;
      }
      
      const response = await apiGet('/users/me');
      if (response) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response));
        this.currentUser = response;
        console.log('🔄 Utilisateur rafraîchi:', response.email);
        return response;
      }
      return null;
    } catch (error) {
      console.error('❌ Erreur refreshUser:', error);
      return null;
    }
  }

  // ============================================================
  // PROFIL
  // ============================================================

  async updateProfile(data: any): Promise<any> {
    try {
      const response = await apiPut('/users/profile', data);
      if (response) {
        if (this.currentUser) {
          this.currentUser = { ...this.currentUser, ...response };
        }
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response));
      }
      return response;
    } catch (error) {
      console.error('❌ Erreur updateProfile:', error);
      throw error;
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await apiPost('/auth/change-password', { 
        currentPassword, 
        newPassword 
      });
    } catch (error) {
      console.error('❌ Erreur changement mot de passe:', error);
      throw error;
    }
  }

  async changeLanguage(language: string): Promise<any> {
    try {
      const response = await apiPatch('/auth/language', { language });
      if (response && this.currentUser) {
        this.currentUser.language = language;
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(this.currentUser));
      }
      return response;
    } catch (error) {
      console.error('❌ Erreur changeLanguage:', error);
      throw error;
    }
  }

  async getLanguage(): Promise<string> {
    try {
      const response = await apiGet('/auth/language');
      return response?.language || 'fr';
    } catch {
      return 'fr';
    }
  }

  // ✅ Vérifier si l'utilisateur est admin
  async isAdmin(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.role === 'admin' || user?.role === 'super_admin';
  }

  // ✅ Nettoyer les données
  async clearAll(): Promise<void> {
    this.currentUser = null;
    await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  }
}

// ✅ Exporter une instance unique
const authService = AuthService.getInstance();
export default authService;

// ✅ Exporter les fonctions nommées
export const getCurrentUser = authService.getCurrentUser.bind(authService);
export const getCurrentUserId = authService.getCurrentUserId.bind(authService);
export const getToken = authService.getToken.bind(authService);
export const isAuthenticated = authService.isAuthenticated.bind(authService);
export const logout = authService.logout.bind(authService);
export const login = authService.login.bind(authService);
export const register = authService.register.bind(authService);
export const updateProfile = authService.updateProfile.bind(authService);
export const changePassword = authService.changePassword.bind(authService);
export const changeLanguage = authService.changeLanguage.bind(authService);
export const getLanguage = authService.getLanguage.bind(authService);
export const isAdmin = authService.isAdmin.bind(authService);
export const refreshUser = authService.refreshUser.bind(authService);