import axios from 'axios';
import { API_URL } from '../config';
import { storage } from '../utils/storage';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use(async (config) => {
  const token = await storage.getItem<string>('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.removeItem('token');
      await storage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;