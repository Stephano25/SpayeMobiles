// src/services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '../config/api';

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
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  apiInstance.interceptors.response.use(
    (response: any) => response,
    async (error: any) => {
      if (error.response?.status === 401) {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
      }
      return Promise.reject(error);
    }
  );

  return apiInstance;
};

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