// src/services/api.ts
// ─────────────────────────────────────────────────────────────
//  SPAYE — Service API principal
// ─────────────────────────────────────────────────────────────

import { getBaseUrl, getApiUrl } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Cache pour les URLs
let cachedBaseURL: string | null = null;
let cachedApiURL: string | null = null;

/**
 * ✅ Nettoie une URL pour éviter les doubles protocoles
 */
const cleanUrl = (url: string): string => {
  if (!url) return 'https://astonish-uneaten-either.ngrok-free.dev';
  
  let cleaned = url.trim();
  cleaned = cleaned.replace(/\/+$/, '');
  
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    return cleaned;
  }
  
  return `https://${cleaned}`;
};

/**
 * ✅ Récupère l'URL de base
 */
export const getBaseURL = async (): Promise<string> => {
  if (cachedBaseURL) {
    return cachedBaseURL;
  }
  
  try {
    const url = await getBaseUrl();
    cachedBaseURL = cleanUrl(url);
    console.log(`📌 Base URL: ${cachedBaseURL}`);
    return cachedBaseURL;
  } catch (error) {
    console.error('❌ Erreur getBaseURL:', error);
    cachedBaseURL = 'https://astonish-uneaten-either.ngrok-free.dev';
    return cachedBaseURL;
  }
};

/**
 * ✅ Récupère l'URL de l'API
 */
export const getAPIURL = async (): Promise<string> => {
  if (cachedApiURL) {
    return cachedApiURL;
  }
  
  try {
    const baseUrl = await getBaseURL();
    cachedApiURL = `${baseUrl}/api`;
    console.log(`📌 API URL: ${cachedApiURL}`);
    return cachedApiURL;
  } catch (error) {
    console.error('❌ Erreur getAPIURL:', error);
    cachedApiURL = 'https://astonish-uneaten-either.ngrok-free.dev/api';
    return cachedApiURL;
  }
};

/**
 * ✅ Fonction de fetch avec gestion des erreurs
 */
export const apiFetch = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  try {
    const baseUrl = await getAPIURL();
    const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    console.log(`📡 ${options.method || 'GET'} ${url}`);
    
    const token = await AsyncStorage.getItem('token');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    };
    
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      let errorMessage = `Erreur HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // Ignorer
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Erreur apiFetch:', error);
    throw error;
  }
};

/**
 * ✅ Requête GET
 */
export const apiGet = async (endpoint: string, params?: Record<string, any>): Promise<any> => {
  let url = endpoint;
  if (params) {
    const queryString = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    if (queryString) {
      url += `${url.includes('?') ? '&' : '?'}${queryString}`;
    }
  }
  return apiFetch(url, { method: 'GET' });
};

/**
 * ✅ Requête POST
 */
export const apiPost = async (endpoint: string, data?: any): Promise<any> => {
  return apiFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * ✅ Requête PUT
 */
export const apiPut = async (endpoint: string, data?: any): Promise<any> => {
  return apiFetch(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * ✅ Requête DELETE
 */
export const apiDelete = async (endpoint: string): Promise<any> => {
  return apiFetch(endpoint, { method: 'DELETE' });
};

/**
 * ✅ Requête PATCH
 */
export const apiPatch = async (endpoint: string, data?: any): Promise<any> => {
  return apiFetch(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

/**
 * ✅ Upload d'un fichier
 */
export const uploadFile = async (file: any): Promise<{ url: string; fileName: string; fileSize: number; mimeType: string }> => {
  try {
    console.log('📤 Upload du fichier:', file.name || 'fichier');
    
    const baseUrl = await getBaseURL();
    const token = await AsyncStorage.getItem('token');
    
    const formData = new FormData();
    
    let fileData: any;
    
    if (Platform.OS === 'web') {
      fileData = file;
    } else {
      fileData = {
        uri: file.uri || file,
        name: file.name || 'file.jpg',
        type: file.type || 'image/jpeg',
      };
    }
    
    formData.append('file', fileData);
    
    const response = await fetch(`${baseUrl}/api/chat/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });
    
    if (!response.ok) {
      let errorMessage = `Erreur upload ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // Ignorer
      }
      throw new Error(errorMessage);
    }
    
    const result = await response.json();
    
    return {
      url: result.url || result.fileUrl || '',
      fileName: result.fileName || result.originalname || file.name || 'file',
      fileSize: result.fileSize || result.size || 0,
      mimeType: result.mimeType || result.type || file.type || 'application/octet-stream',
    };
  } catch (error) {
    console.error('❌ Erreur uploadFile:', error);
    throw error;
  }
};

/**
 * ✅ Vérifie la santé du backend
 */
export const checkHealth = async (): Promise<boolean> => {
  try {
    const baseUrl = await getBaseURL();
    const response = await fetch(`${baseUrl}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.ok;
  } catch (error) {
    console.warn('⚠️ Backend inaccessible:', error);
    return false;
  }
};

// ============================================================
// EXPORT PAR DÉFAUT
// ============================================================
export default {
  getBaseURL,
  getAPIURL,
  apiFetch,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  apiPatch,
  uploadFile,
  checkHealth,
};