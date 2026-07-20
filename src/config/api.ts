// src/config/api.ts
// ─────────────────────────────────────────────────────────────
//  SPAYE — Configuration API
// ─────────────────────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'backend_ip';
const DEFAULT_IP = 'astonish-uneaten-either.ngrok-free.dev'; // ✅ Sans https://
const DEFAULT_PORT = 3000;

let cachedBaseUrl: string | null = null;
let cachedApiUrl: string | null = null;
let cachedSocketUrl: string | null = null;

/**
 * ✅ Nettoie une URL pour éviter les doubles protocoles
 */
const cleanUrl = (url: string): string => {
  // Supprimer les espaces
  let cleaned = url.trim();
  
  // Si l'URL commence déjà par http:// ou https://, la retourner telle quelle
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    return cleaned;
  }
  
  // Sinon, ajouter https:// par défaut
  return `https://${cleaned}`;
};

/**
 * ✅ Récupère l'URL de base de l'API
 */
export const getBaseUrl = async (): Promise<string> => {
  if (cachedBaseUrl) return cachedBaseUrl;
  
  try {
    const storedIp = await AsyncStorage.getItem(STORAGE_KEY);
    if (storedIp) {
      cachedBaseUrl = cleanUrl(storedIp);
      console.log(`✅ Base URL depuis stockage: ${cachedBaseUrl}`);
      return cachedBaseUrl;
    }
  } catch (error) {
    console.warn('⚠️ Erreur lecture IP stockée:', error);
  }
  
  // Utiliser l'URL ngrok par défaut
  cachedBaseUrl = cleanUrl(DEFAULT_IP);
  console.log(`✅ Base URL par défaut: ${cachedBaseUrl}`);
  return cachedBaseUrl;
};

/**
 * ✅ Récupère l'URL de l'API
 */
export const getApiUrl = async (): Promise<string> => {
  if (cachedApiUrl) return cachedApiUrl;
  
  const baseUrl = await getBaseUrl();
  cachedApiUrl = `${baseUrl}/api`;
  console.log(`✅ API URL: ${cachedApiUrl}`);
  return cachedApiUrl;
};

/**
 * ✅ Récupère l'URL du socket
 */
export const getSocketUrl = async (): Promise<string> => {
  if (cachedSocketUrl) return cachedSocketUrl;
  
  const baseUrl = await getBaseUrl();
  cachedSocketUrl = baseUrl;
  console.log(`✅ Socket URL: ${cachedSocketUrl}`);
  return cachedSocketUrl;
};

/**
 * ✅ Définit l'IP du backend
 */
export const setBackendIp = async (ip: string): Promise<void> => {
  try {
    const cleanIp = cleanUrl(ip);
    await AsyncStorage.setItem(STORAGE_KEY, cleanIp);
    cachedBaseUrl = null;
    cachedApiUrl = null;
    cachedSocketUrl = null;
    console.log(`✅ IP backend définie: ${cleanIp}`);
  } catch (error) {
    console.error('❌ Erreur sauvegarde IP:', error);
  }
};

/**
 * ✅ Récupère l'IP stockée
 */
export const getStoredIp = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

/**
 * ✅ Réinitialise l'IP du backend
 */
export const resetBackendIp = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    cachedBaseUrl = null;
    cachedApiUrl = null;
    cachedSocketUrl = null;
    console.log('✅ IP backend réinitialisée');
  } catch (error) {
    console.error('❌ Erreur réinitialisation IP:', error);
  }
};

/**
 * ✅ Détecte automatiquement l'IP du backend
 */
export const detectBackendIP = async (): Promise<string | null> => {
  try {
    const storedIp = await getStoredIp();
    if (storedIp) {
      console.log(`✅ IP stockée trouvée: ${storedIp}`);
      return storedIp;
    }
    
    // Essayer l'URL ngrok par défaut
    const defaultUrl = cleanUrl(DEFAULT_IP);
    try {
      const response = await fetch(`${defaultUrl}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        await setBackendIp(DEFAULT_IP);
        console.log(`✅ Backend détecté: ${defaultUrl}`);
        return DEFAULT_IP;
      }
    } catch (e) {
      console.warn('⚠️ Backend par défaut inaccessible:', e);
    }
    
    // Essayer les IPs locales
    const localIps = ['192.168.188.135', '192.168.1.100', 'localhost', '10.0.2.2'];
    for (const ip of localIps) {
      try {
        const testUrl = `http://${ip}:${DEFAULT_PORT}/api/health`;
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (response.ok) {
          await setBackendIp(ip);
          console.log(`✅ Backend détecté: http://${ip}`);
          return ip;
        }
      } catch (e) {
        continue;
      }
    }
  } catch (error) {
    console.warn('⚠️ Détection IP automatique échouée:', error);
  }
  
  return null;
};

/**
 * ✅ Vérifie si le backend est accessible
 */
export const checkBackendHealth = async (baseUrl?: string): Promise<boolean> => {
  try {
    const url = baseUrl || await getBaseUrl();
    const clean = cleanUrl(url);
    const response = await fetch(`${clean}/api/health`, {
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
  getBaseUrl,
  getApiUrl,
  getSocketUrl,
  setBackendIp,
  getStoredIp,
  resetBackendIp,
  detectBackendIP,
  checkBackendHealth,
};