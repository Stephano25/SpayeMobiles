// Utilisez l'IP récupérée depuis ipconfig (Wi-Fi)
export const API_URL = 'http://192.168.188.135:3000/api';
export const SOCKET_URL = 'http://192.168.188.135:3000';

export const COLORS = {
  primary: '#667eea',
  primaryDark: '#5a67d8',
  secondary: '#764ba2',
  secondaryDark: '#6b46c1',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  white: '#ffffff',
  black: '#000000',
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

export const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('fr-MG').format(amount);
};

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('fr-MG');
};

export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date);
  return `${d.toLocaleDateString('fr-MG')} ${d.toLocaleTimeString('fr-MG')}`;
};

export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`;
};