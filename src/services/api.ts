// src/services/api.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '../config/api';

const DEFAULT_BASE_URL = 'http://192.168.188.135:3000';

class ApiService {
  private static instance: ApiService;
  private baseUrl: string = DEFAULT_BASE_URL;
  private isInitialized: boolean = false;

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    try {
      const url = await getApiUrl();
      // ✅ Correction: garder l'URL complète avec /api
      this.baseUrl = url.replace(/\/api$/, '');
      this.isInitialized = true;
      console.log('✅ API initialisée avec:', this.baseUrl);
    } catch (error) {
      console.error('❌ Erreur initialisation API:', error);
      this.baseUrl = DEFAULT_BASE_URL;
    }
  }

  private async getHeaders(): Promise<HeadersInit> {
    const token = await AsyncStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    await this.initialize();
    
    // ✅ Correction: l'endpoint doit commencer par /api
    const fullEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
    const url = `${this.baseUrl}${fullEndpoint}`;
    const headers = await this.getHeaders();
    
    console.log(`📡 ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erreur ${response.status}:`, errorText);
      
      if (response.status === 401) {
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.removeItem('user_data');
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.message || errorJson.error || `Erreur ${response.status}`);
      } catch {
        throw new Error(errorText || `Erreur ${response.status}`);
      }
    }

    const data = await response.json();
    return data;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export default ApiService.getInstance();