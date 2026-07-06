// src/services/AuthService.ts
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginResponse } from '../types';
import { getApiUrl } from '../config/api';

export const AuthService = {
  getApiUrl: async (): Promise<string> => {
    return await getApiUrl();
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber?: string;
  }): Promise<LoginResponse> {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/auth/change-password', { currentPassword, newPassword });
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  },

  async saveSession(token: string, user: User): Promise<void> {
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
  },

  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('token');
  },

  async getUser(): Promise<User | null> {
    const userJson = await AsyncStorage.getItem('user');
    if (!userJson) return null;
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  },

  async isAdmin(): Promise<boolean> {
    const user = await this.getUser();
    return user?.role === 'admin' || user?.role === 'super_admin';
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put('/users/profile', data);
    const updatedUser = response.data;
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    return updatedUser;
  },

  async uploadProfilePicture(formData: FormData): Promise<{ profilePictureUrl: string }> {
    const response = await api.post('/users/upload-profile-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async deleteProfilePicture(): Promise<void> {
    await api.delete('/users/profile-picture');
    const user = await this.getUser();
    if (user) {
      user.profilePicture = undefined;
      await AsyncStorage.setItem('user', JSON.stringify(user));
    }
  },

  async refreshUser(): Promise<User> {
    const user = await this.getProfile();
    await AsyncStorage.setItem('user', JSON.stringify(user));
    return user;
  },

  async handleGoogleCallback(token: string): Promise<User> {
    await AsyncStorage.setItem('token', token);
    try {
      const user = await this.getProfile();
      await AsyncStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Erreur récupération profil Google:', error);
      throw error;
    }
  },
};