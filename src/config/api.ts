// src/config/api.ts
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

let cachedApiUrl: string | null = null;
let cachedSocketUrl: string | null = null;

const DEFAULT_DOCKER_IP = 'host.docker.internal';

// ✅ Utiliser AsyncStorage directement au lieu de storage
const getItem = async (key: string): Promise<any> => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const setItem = async (key: string, value: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

const removeItem = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch {}
};

const testConnection = async (ip: string): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch(`http://${ip}:3000/api/health`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
      method: 'GET',
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
};

export const detectBackendIP = async (): Promise<string | null> => {
  try {
    const savedIp = await getItem('backend_ip');
    if (savedIp && savedIp.trim()) {
      const isValid = await testConnection(savedIp.trim());
      if (isValid) {
        console.log(`📡 IP stockée valide: ${savedIp}`);
        return savedIp.trim();
      }
    }

    const ipsToTest = [
      DEFAULT_DOCKER_IP,
      '10.0.2.2',
      '10.0.3.2',
      'localhost',
      '127.0.0.1',
      '192.168.188.135',
      '192.168.188.1',
      '192.168.1.100',
      '192.168.1.101',
      '192.168.1.102',
      '192.168.1.103',
      '192.168.1.104',
      '192.168.1.105',
      '192.168.1.106',
      '192.168.1.107',
      '192.168.1.108',
      '192.168.1.109',
      '192.168.1.110',
      '192.168.0.100',
      '192.168.0.101',
      '192.168.0.102',
      '10.0.0.100',
      '10.0.0.101',
      '172.20.10.1',
      '172.20.10.2',
    ];

    for (const testIP of ipsToTest) {
      const isValid = await testConnection(testIP);
      if (isValid) {
        console.log(`✅ Backend trouvé à l'IP: ${testIP}`);
        await setItem('backend_ip', testIP);
        return testIP;
      }
    }

    console.log('❌ Aucun backend trouvé');
    return null;
  } catch (error) {
    console.error('❌ Erreur détection backend:', error);
    return null;
  }
};

export const getApiUrl = async (): Promise<string> => {
  if (cachedApiUrl) return cachedApiUrl;

  try {
    const savedIp = await getItem('backend_ip');
    if (savedIp && savedIp.trim()) {
      const isValid = await testConnection(savedIp.trim());
      if (isValid) {
        cachedApiUrl = `http://${savedIp.trim()}:3000/api`;
        return cachedApiUrl;
      }
    }

    const detectedIp = await detectBackendIP();
    if (detectedIp) {
      cachedApiUrl = `http://${detectedIp}:3000/api`;
      return cachedApiUrl;
    }

    if (Platform.OS === 'android' && !Constants.isDevice) {
      cachedApiUrl = 'http://10.0.2.2:3000/api';
      return cachedApiUrl;
    }

    if (Platform.OS === 'ios' && !Constants.isDevice) {
      cachedApiUrl = 'http://localhost:3000/api';
      return cachedApiUrl;
    }

    cachedApiUrl = `http://${DEFAULT_DOCKER_IP}:3000/api`;
    return cachedApiUrl;
  } catch (error) {
    console.error('❌ Erreur getApiUrl:', error);
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3000/api';
    }
    return `http://${DEFAULT_DOCKER_IP}:3000/api`;
  }
};

export const getSocketUrl = async (): Promise<string> => {
  if (cachedSocketUrl) return cachedSocketUrl;
  try {
    const apiUrl = await getApiUrl();
    cachedSocketUrl = apiUrl ? apiUrl.replace('/api', '') : '';
    return cachedSocketUrl;
  } catch {
    cachedSocketUrl = '';
    return cachedSocketUrl;
  }
};

export const setBackendIp = async (ip: string): Promise<void> => {
  if (!ip || !ip.trim()) {
    await removeItem('backend_ip');
  } else {
    await setItem('backend_ip', ip.trim());
  }
  cachedApiUrl = null;
  cachedSocketUrl = null;
};

export const getStoredIp = async (): Promise<string | null> => {
  try {
    return await getItem('backend_ip');
  } catch {
    return null;
  }
};

export const resetBackendIp = async (): Promise<void> => {
  await removeItem('backend_ip');
  cachedApiUrl = null;
  cachedSocketUrl = null;
};

export const ApiService = {
  getApiUrl,
  getSocketUrl,
  setBackendIp,
  getStoredIp,
  resetBackendIp,
  detectBackendIP,
};