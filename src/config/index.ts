import Constants from 'expo-constants';

// Récupérer l'IP depuis les extra de app.json
const API_URL = Constants.expoConfig?.extra?.API_URL || 'http://192.168.188.135:3000/api';
const SOCKET_URL = Constants.expoConfig?.extra?.SOCKET_URL || 'http://192.168.188.135:3000';

export { API_URL, SOCKET_URL };

export const COLORS = {
  primary: '#667eea',
  primaryDark: '#5a67d8',
  primaryLight: '#EEF0FE',
  secondary: '#764ba2',
  secondaryDark: '#6b46c1',
  secondaryLight: '#F3EBFB',
  success: '#10b981',
  successLight: '#D1FAE5',
  error: '#ef4444',
  errorLight: '#FEE2E2',
  warning: '#f59e0b',
  warningLight: '#FEF3C7',
  info: '#3b82f6',
  infoLight: '#DBEAFE',
  white: '#ffffff',
  black: '#000000',
  background: '#f9fafb',
  surface: '#ffffff',
  border: '#e5e7eb',
  text: '#111827',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
};

export const GRADIENTS = {
  primary: [COLORS.primary, COLORS.secondary] as const,
  success: [COLORS.success, '#34d399'] as const,
  dark: [COLORS.gray800, COLORS.gray900] as const,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FONT = {
  size: {
    xs: 12,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    huge: 34,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
};

export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
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

export const formatCompact = (amount: number): string => {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)} k`;
  return amount.toString();
};

export const getInitials = (firstName?: string, lastName?: string): string => {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
};

const AVATAR_COLORS = ['#667eea', '#764ba2', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#ef4444', '#06b6d4'];
export const getAvatarColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};