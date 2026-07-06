// src/config/index.ts
export * from './api';
export * from './colors';
export * from './navigationBar';

// =====================================================
// HELPERS
// =====================================================

export const formatAmount = (amount: number): string => {
  if (!amount && amount !== 0) return '0';
  return new Intl.NumberFormat('fr-MG').format(amount);
};

export const formatDate = (date: string | Date): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-MG');
};

export const formatTime = (date: string | Date): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('fr-MG', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateTime = (date: string | Date): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return `${d.toLocaleDateString('fr-MG')} ${d.toLocaleTimeString('fr-MG', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

export const formatRelativeTime = (date: string | Date): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const diffMs = Date.now() - d.getTime();
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
  if (!firstName && !lastName) return '?';
  const first = firstName ? firstName.charAt(0).toUpperCase() : '';
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  return first + last || '?';
};

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#3b82f6',
  '#ec4899', '#ef4444', '#06b6d4', '#14b8a6', '#84cc16', '#f97316',
];

export const getAvatarColor = (name: string): string => {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

// ✅ Ré-export des fonctions API
export { 
  getApiUrl,
  getSocketUrl,
  setBackendIp,
  getStoredIp,
  resetBackendIp,
  detectBackendIP,
} from './api';

// ✅ Ré-export des couleurs
export { COLORS, RADIUS, SPACING, FONT, SHADOW } from './colors';
export { NAVIGATION_BAR, TAB_BAR_HEIGHT, BOTTOM_BUTTON_PADDING } from './navigationBar';