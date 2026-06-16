import axios from 'axios';
import { getApiUrl } from '../config';
import { storage } from '../utils/storage';

let apiInstance: any = null;

export const getApi = async () => {
  if (apiInstance) return apiInstance;

  const baseURL = await getApiUrl();
  
  apiInstance = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
  });

  apiInstance.interceptors.request.use(async (config: any) => {
    const token = await storage.getItem<string>('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  apiInstance.interceptors.response.use(
    (response: any) => response,
    async (error: any) => {
      if (error.response?.status === 401) {
        await storage.removeItem('token');
        await storage.removeItem('user');
      }
      return Promise.reject(error);
    }
  );

  return apiInstance;
};

// Compatibilité avec le code existant
const api = {
  get: async (...args: any[]) => {
    const instance = await getApi();
    return instance.get(...args);
  },
  post: async (...args: any[]) => {
    const instance = await getApi();
    return instance.post(...args);
  },
  put: async (...args: any[]) => {
    const instance = await getApi();
    return instance.put(...args);
  },
  patch: async (...args: any[]) => {
    const instance = await getApi();
    return instance.patch(...args);
  },
  delete: async (...args: any[]) => {
    const instance = await getApi();
    return instance.delete(...args);
  },
};

export default api;