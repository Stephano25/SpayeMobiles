// src/services/AuthService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
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
  };
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
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
      
      if (response.access_token) {
        await AsyncStorage.setItem('auth_token', response.access_token);
        await AsyncStorage.setItem('user_data', JSON.stringify(response.user));
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
      
      if (response.access_token) {
        await AsyncStorage.setItem('auth_token', response.access_token);
        await AsyncStorage.setItem('user_data', JSON.stringify(response.user));
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
      const userData = await AsyncStorage.getItem('user_data');
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
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_data');
  }

  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('auth_token');
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
      await AsyncStorage.setItem('user_data', JSON.stringify(response));
      this.currentUser = response;
      return response;
    } catch (error) {
      console.error('❌ Erreur updateProfile:', error);
      throw error;
    }
  }

  async getApiUrl(): Promise<string> {
    const { getApiUrl } = await import('../config/api');
    return getApiUrl();
  }
}

const authService = AuthService.getInstance();
export default authService;