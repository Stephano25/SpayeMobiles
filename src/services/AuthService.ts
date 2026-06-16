import api from './api';
import { storage } from '../utils/storage';
import { User, LoginResponse } from '../types';

export const AuthService = {
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
    await storage.removeItem('token');
    await storage.removeItem('user');
    delete api.defaults.headers.Authorization;
  },

  async saveSession(token: string, user: User): Promise<void> {
    await storage.setItem('token', token);
    await storage.setItem('user', user);
    api.defaults.headers.Authorization = `Bearer ${token}`;
  },

  async getToken(): Promise<string | null> {
    return storage.getItem<string>('token');
  },

  async getUser(): Promise<User | null> {
    return storage.getItem<User>('user');
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
    await storage.setItem('user', updatedUser);
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
      await storage.setItem('user', user);
    }
  },

  async refreshUser(): Promise<User> {
    const user = await this.getProfile();
    await storage.setItem('user', user);
    return user;
  },
};