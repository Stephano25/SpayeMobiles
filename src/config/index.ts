import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { storage } from '../utils/storage';

// =====================================================
// CONFIGURATION - DÉTECTION AUTOMATIQUE
// =====================================================

let cachedApiUrl: string | null = null;
let cachedSocketUrl: string | null = null;

export const detectBackendIP = async (): Promise<string | null> => {
  try {
    const savedIp = await storage.getItem<string>('backend_ip');
    if (savedIp && savedIp.trim()) {
      console.log(`📡 IP déjà stockée: ${savedIp}`);
      return savedIp;
    }

    const ipsToTest = [
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
      '10.0.2.2',
      '10.0.3.2',
      'localhost',
      '127.0.0.1',
    ];

    console.log(`🔍 Test de ${ipsToTest.length} IP possibles...`);

    for (const testIP of ipsToTest) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch(`http://${testIP}:3000/api/health`, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' },
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log(`✅ Backend trouvé à l'IP: ${testIP}`);
          await storage.setItem('backend_ip', testIP);
          return testIP;
        }
      } catch (error) {
        continue;
      }
    }

    console.log('❌ Aucun backend trouvé sur le réseau');
    return null;
  } catch (error) {
    console.error('❌ Erreur détection backend:', error);
    return null;
  }
};

export const getApiUrl = async (): Promise<string> => {
  if (cachedApiUrl) return cachedApiUrl;

  try {
    const savedIp = await storage.getItem<string>('backend_ip');
    if (savedIp && savedIp.trim()) {
      cachedApiUrl = `http://${savedIp.trim()}:3000/api`;
      console.log(`📡 API URL (stockée): ${cachedApiUrl}`);
      return cachedApiUrl;
    }

    const detectedIp = await detectBackendIP();
    if (detectedIp) {
      cachedApiUrl = `http://${detectedIp}:3000/api`;
      console.log(`📡 API URL (détectée): ${cachedApiUrl}`);
      return cachedApiUrl;
    }

    if (Platform.OS === 'android' && !Constants.isDevice) {
      cachedApiUrl = 'http://10.0.2.2:3000/api';
      console.log(`📡 API URL (émulateur Android): ${cachedApiUrl}`);
      return cachedApiUrl;
    }

    if (Platform.OS === 'ios' && !Constants.isDevice) {
      cachedApiUrl = 'http://localhost:3000/api';
      console.log(`📡 API URL (émulateur iOS): ${cachedApiUrl}`);
      return cachedApiUrl;
    }

    console.warn('⚠️ Aucune IP trouvée');
    return '';
  } catch (error) {
    console.error('❌ Erreur getApiUrl:', error);
    return '';
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
    await storage.removeItem('backend_ip');
  } else {
    await storage.setItem('backend_ip', ip.trim());
  }
  cachedApiUrl = null;
  cachedSocketUrl = null;
  console.log(`✅ IP du backend mise à jour: ${ip || 'réinitialisée'}`);
};

export const getStoredIp = async (): Promise<string | null> => {
  try {
    return await storage.getItem<string>('backend_ip');
  } catch {
    return null;
  }
};

export const resetBackendIp = async (): Promise<void> => {
  await storage.removeItem('backend_ip');
  cachedApiUrl = null;
  cachedSocketUrl = null;
  console.log('✅ IP du backend réinitialisée');
};

// =====================================================
// COULEURS ET STYLES
// =====================================================

export const COLORS = {
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  primaryLight: '#eef2ff',
  secondary: '#8b5cf6',
  secondaryDark: '#7c3aed',
  secondaryLight: '#ede9fe',
  success: '#10b981',
  successLight: '#d1fae5',
  error: '#ef4444',
  errorLight: '#fee2e2',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  info: '#3b82f6',
  infoLight: '#dbeafe',
  white: '#ffffff',
  black: '#000000',
  background: '#f8fafc',
  surface: '#ffffff',
  border: '#e2e8f0',
  text: '#0f172a',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',
  gray50: '#f8fafc',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray300: '#cbd5e1',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1e293b',
  gray900: '#0f172a',
};

export const RADIUS = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, full: 999,
};

export const SPACING = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32,
};

export const FONT = {
  size: { xs: 11, sm: 13, base: 15, md: 16, lg: 18, xl: 22, xxl: 28, huge: 34 },
  weight: { regular: '400' as const, medium: '500' as const, semibold: '600' as const, bold: '700' as const, extrabold: '800' as const },
};

export const SHADOW = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 8 },
};

// =====================================================
// HELPERS
// =====================================================

export const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('fr-MG').format(amount ?? 0);
};

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('fr-MG');
};

export const formatTime = (date: string | Date): string => {
  return new Date(date).toLocaleTimeString('fr-MG', { hour: '2-digit', minute: '2-digit' });
};

export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date);
  return `${d.toLocaleDateString('fr-MG')} ${d.toLocaleTimeString('fr-MG', { hour: '2-digit', minute: '2-digit' })}`;
};

export const formatRelativeTime = (date: string | Date): string => {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  if (diffH < 24) return `il y a ${diffH} h`;
  if (diffD < 7) return `il y a ${diffD} j`;
  return formatDate(date);
};

export const getInitials = (firstName?: string, lastName?: string): string => {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
};

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#ef4444', '#06b6d4', '#14b8a6', '#84cc16', '#f97316'];

export const getAvatarColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

export default {
  getApiUrl,
  getSocketUrl,
  setBackendIp,
  getStoredIp,
  resetBackendIp,
  detectBackendIP,
  COLORS,
  RADIUS,
  SPACING,
  FONT,
  SHADOW,
  formatAmount,
  formatDate,
  formatTime,
  formatDateTime,
  formatRelativeTime,
  getInitials,
  getAvatarColor,
};