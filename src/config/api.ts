// src/config/api.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

let cachedApiUrl: string | null = null;

const DEFAULT_IP = '192.168.188.135';

export const getStoredIp = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('backend_ip');
  } catch {
    return null;
  }
};

export const setBackendIp = async (ip: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('backend_ip', ip);
    cachedApiUrl = null;
  } catch {}
};

export const testConnection = async (ip: string): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`http://${ip}:3000/api/health`, {
      signal: controller.signal,
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
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
    const savedIp = await getStoredIp();
    if (savedIp && savedIp.trim()) {
      const isValid = await testConnection(savedIp.trim());
      if (isValid) {
        console.log(`✅ IP stockée valide: ${savedIp}`);
        return savedIp.trim();
      }
    }

    const ipsToTest = [
      '192.168.188.135',
      '192.168.1.100',
      '192.168.1.101',
      '192.168.0.100',
      '10.0.2.2',
      '10.0.3.2',
      'localhost',
      '127.0.0.1',
    ];

    for (const testIP of ipsToTest) {
      const isValid = await testConnection(testIP);
      if (isValid) {
        console.log(`✅ Backend trouvé à l'IP: ${testIP}`);
        await setBackendIp(testIP);
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
    const savedIp = await getStoredIp();
    if (savedIp && savedIp.trim()) {
      const isValid = await testConnection(savedIp.trim());
      if (isValid) {
        cachedApiUrl = `http://${savedIp.trim()}:3000/api`;
        console.log(`📍 API URL: ${cachedApiUrl}`);
        return cachedApiUrl;
      }
    }

    const detectedIp = await detectBackendIP();
    if (detectedIp) {
      cachedApiUrl = `http://${detectedIp}:3000/api`;
      return cachedApiUrl;
    }

    cachedApiUrl = `http://${DEFAULT_IP}:3000/api`;
    console.log(`📍 API URL (fallback): ${cachedApiUrl}`);
    return cachedApiUrl;
  } catch (error) {
    console.error('❌ Erreur getApiUrl:', error);
    return `http://${DEFAULT_IP}:3000/api`;
  }
};

export const resetBackendIp = async (): Promise<void> => {
  await AsyncStorage.removeItem('backend_ip');
  cachedApiUrl = null;
};