import api from './api';
import { storage } from '../utils/storage';
import { User, LoginResponse } from '../types';

export const AuthService = {
  /**
   * Connexion utilisateur
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  /**
   * Inscription utilisateur
   */
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

  /**
   * Récupérer le profil de l'utilisateur connecté
   */
  async getProfile(): Promise<User> {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  /**
   * Changer le mot de passe
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/auth/change-password', { currentPassword, newPassword });
  },

  /**
   * Déconnexion : suppression du token et de l'utilisateur
   */
  async logout(): Promise<void> {
    await storage.removeItem('token');
    await storage.removeItem('user');
    delete api.defaults.headers.Authorization;
  },

  /**
   * Sauvegarder la session (token + utilisateur) après login/register
   */
  async saveSession(token: string, user: User): Promise<void> {
    await storage.setItem('token', token);
    await storage.setItem('user', user);
    api.defaults.headers.Authorization = `Bearer ${token}`;
  },

  /**
   * Récupérer le token stocké
   */
  async getToken(): Promise<string | null> {
    return storage.getItem<string>('token');
  },

  /**
   * Récupérer l'utilisateur stocké
   */
  async getUser(): Promise<User | null> {
    return storage.getItem<User>('user');
  },

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  },

  /**
   * Vérifier si l'utilisateur est administrateur
   */
  async isAdmin(): Promise<boolean> {
    const user = await this.getUser();
    return user?.role === 'admin' || user?.role === 'super_admin';
  },

  /**
   * Mettre à jour le profil utilisateur
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put('/users/profile', data);
    const updatedUser = response.data;
    await storage.setItem('user', updatedUser);
    return updatedUser;
  },

  /**
   * Uploader une photo de profil
   */
  async uploadProfilePicture(formData: FormData): Promise<{ profilePictureUrl: string }> {
    const response = await api.post('/users/upload-profile-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Supprimer la photo de profil
   */
  async deleteProfilePicture(): Promise<void> {
    await api.delete('/users/profile-picture');
    const user = await this.getUser();
    if (user) {
      user.profilePicture = undefined;
      await storage.setItem('user', user);
    }
  },

  /**
   * Rafraîchir les informations utilisateur depuis le serveur
   */
  async refreshUser(): Promise<User> {
    const user = await this.getProfile();
    await storage.setItem('user', user);
    return user;
  },
};