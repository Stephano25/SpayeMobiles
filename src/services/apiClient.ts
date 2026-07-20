// src/services/apiClient.ts
import { getApiUrl } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  requiresAuth?: boolean;
}

export const apiClient = async (endpoint: string, options: ApiOptions = {}) => {
  const {
    method = 'GET',
    headers = {},
    body,
    requiresAuth = true,
  } = options;

  const apiUrl = await getApiUrl();
  const url = `${apiUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // ✅ Headers de base
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // ✅ Ajouter le token si nécessaire
  if (requiresAuth) {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const finalHeaders = { ...defaultHeaders, ...headers };

  const config: RequestInit = {
    method,
    headers: finalHeaders,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  console.log(`📡 ${method} ${url}`);

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    // ✅ Gestion des erreurs 401
    if (response.status === 401) {
      console.log('⏰ Token expiré, déconnexion...');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      throw new Error('Session expirée, veuillez vous reconnecter');
    }

    if (!response.ok) {
      throw new Error(data.message || `Erreur ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`❌ Erreur API ${endpoint}:`, error);
    throw error;
  }
};

// ✅ Helpers pour les méthodes HTTP
export const api = {
  get: (endpoint: string, options?: Omit<ApiOptions, 'method' | 'body'>) =>
    apiClient(endpoint, { ...options, method: 'GET' }),
  
  post: (endpoint: string, body?: any, options?: Omit<ApiOptions, 'method'>) =>
    apiClient(endpoint, { ...options, method: 'POST', body }),
  
  put: (endpoint: string, body?: any, options?: Omit<ApiOptions, 'method'>) =>
    apiClient(endpoint, { ...options, method: 'PUT', body }),
  
  patch: (endpoint: string, body?: any, options?: Omit<ApiOptions, 'method'>) =>
    apiClient(endpoint, { ...options, method: 'PATCH', body }),
  
  delete: (endpoint: string, options?: Omit<ApiOptions, 'method'>) =>
    apiClient(endpoint, { ...options, method: 'DELETE' }),
};