// src/services/AuthService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

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

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>('/auth/login', credentials);
      
      const token = response.access_token || response.token;
      if (token) {
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(response.user));
        this.currentUser = response.user;
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur login:', error);
      throw error;
    }
  }

  async register(data: RegisterData): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>('/auth/register', data);
      
      const token = response.access_token || response.token;
      if (token) {
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(response.user));
        this.currentUser = response.user;
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur register:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<LoginResponse['user'] | null> {
    if (this.currentUser) return this.currentUser;
    
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        this.currentUser = JSON.parse(userData);
        return this.currentUser;
      }
    } catch (error) {
      console.error('❌ Erreur getCurrentUser:', error);
    }
    return null;
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  }

  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('token');
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await api.post('/auth/change-password', { 
        currentPassword, 
        newPassword 
      });
    } catch (error) {
      console.error('❌ Erreur changement mot de passe:', error);
      throw error;
    }
  }

  async updateProfile(data: any): Promise<any> {
    try {
      const response = await api.put('/users/profile', data);
      if (response) {
        await AsyncStorage.setItem('user', JSON.stringify(response));
        this.currentUser = response;
      }
      return response;
    } catch (error) {
      console.error('❌ Erreur updateProfile:', error);
      throw error;
    }
  }

  async changeLanguage(language: string): Promise<any> {
    try {
      const response = await api.patch('/auth/language', { language });
      if (response && this.currentUser) {
        this.currentUser.language = language;
        await AsyncStorage.setItem('user', JSON.stringify(this.currentUser));
      }
      return response;
    } catch (error) {
      console.error('❌ Erreur changeLanguage:', error);
      throw error;
    }
  }

  async getLanguage(): Promise<string> {
    try {
      const response = await api.get('/auth/language');
      return response?.language || 'fr';
    } catch {
      return 'fr';
    }
  }
}

const authService = AuthService.getInstance();
export default authService;