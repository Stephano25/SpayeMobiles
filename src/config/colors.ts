// src/config/colors.ts
// ─────────────────────────────────────────────────────────────
//  SPAYE — Couleurs et Helpers
// ─────────────────────────────────────────────────────────────

// ============================================================
// COULEURS
// ============================================================
export const COLORS = {
  // Couleurs principales
  primary: '#6366f1',
  primaryLight: '#818cf8',
  primaryDark: '#4f46e5',
  secondary: '#8b5cf6',
  
  // Fond et surface
  background: '#0f0f14',
  surface: '#16161e',
  surface2: '#1e1e2a',
  surface3: '#2a2a3a',
  
  // Texte
  text: '#e2e8f0',
  text2: '#cbd5e1',
  text3: '#94a3b8',
  text4: '#64748b',
  text5: '#475569',
  
  // Bordures
  border: 'rgba(255,255,255,0.07)',
  borderLight: 'rgba(255,255,255,0.12)',
  borderDark: 'rgba(255,255,255,0.04)',
  
  // Status
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  
  // Neutres
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  
  // Gris
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
  
  // Effets
  glassShadow: 'rgba(10, 6, 30, 0.55)',
  glassBorder: 'rgba(255,255,255,0.22)',
  glassFill: 'rgba(255,255,255,0.10)',
  glassFillStrong: 'rgba(255,255,255,0.16)',
  
  // Accents
  accentA: '#7c6bf0',
  accentB: '#5b8ce0',
  
  // Couleurs d'avatar
  avatarColors: [
    '#7c3aed', '#6d28d9', '#4f46e5', '#0891b2',
    '#0d9488', '#059669', '#d97706', '#dc2626',
    '#db2777', '#9333ea', '#2563eb', '#0ea5e9',
  ],
};

// ============================================================
// RAYONS - CORRIGÉ : EXPORT NOMÉ
// ============================================================
export const RADIUS = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
  full: 9999,
  
  // Alias pour compatibilité
  card: 16,
  button: 12,
  input: 8,
  circle: 9999,
};

// ============================================================
// ESPACEMENTS - EXPORT NOMÉ
// ============================================================
export const SPACING = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  '4xl': 32,
  '5xl': 40,
  '6xl': 48,
};

// ============================================================
// TYPOGRAPHIE - EXPORT NOMÉ
// ============================================================
export const FONT = {
  // Familles
  family: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    light: 'Inter_300Light',
    thin: 'Inter_100Thin',
    black: 'Inter_900Black',
  },
  
  // Tailles
  size: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 28,
    '5xl': 32,
    '6xl': 40,
    '7xl': 48,
  },
  
  // Poids
  weight: {
    thin: '100' as const,
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
    black: '900' as const,
  },
  
  // Alias
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  light: 'Inter_300Light',
  thin: 'Inter_100Thin',
  black: 'Inter_900Black',
  
  // Interlignes
  lineHeight: {
    none: 1,
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
};

// ============================================================
// OMBRES - EXPORT NOMÉ
// ============================================================
export const SHADOW = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  '2xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 16,
  },
  glass: {
    shadowColor: 'rgba(10, 6, 30, 0.55)',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.55,
    shadowRadius: 60,
    elevation: 24,
  },
};

// ============================================================
// HELPERS - TOUTES LES FONCTIONS
// ============================================================

/**
 * Formate un timestamp en heure:minute
 */
export const formatTime = (date: Date | string | undefined): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Formate un montant en Ar
 */
export const formatAmount = (amount: number): string => {
  if (!amount && amount !== 0) return '0 Ar';
  return `${amount.toLocaleString('fr-FR')} Ar`;
};

/**
 * Formate une date complète
 */
export const formatDate = (date: Date | string | undefined): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Formate une date et heure
 */
export const formatDateTime = (date: Date | string | undefined): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Récupère les initiales d'un nom
 */
export const getInitials = (firstName?: string, lastName?: string): string => {
  if (!firstName && !lastName) return '?';
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || '?';
};

/**
 * Couleur d'avatar basée sur le nom
 */
export const getAvatarColor = (name: string = ''): string => {
  if (!name) return COLORS.primary;
  
  const colors = COLORS.avatarColors || [
    '#7c3aed', '#6d28d9', '#4f46e5', '#0891b2',
    '#0d9488', '#059669', '#d97706', '#dc2626',
    '#db2777', '#9333ea', '#2563eb', '#0ea5e9',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Formate une taille de fichier
 */
export const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

/**
 * Détermine le type de fichier
 */
export const getFileType = (url: string = '', name: string = ''): 'image' | 'video' | 'audio' | 'document' => {
  const ext = (name.split('.').pop() || url.split('.').pop() || '').toLowerCase();
  
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
  const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'flv', 'wmv'];
  const audioExts = ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac', 'wma'];
  
  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  if (audioExts.includes(ext)) return 'audio';
  return 'document';
};

/**
 * Détermine si c'est une image
 */
export const isImageFile = (url: string = '', name: string = ''): boolean => {
  return getFileType(url, name) === 'image';
};

/**
 * Détermine si c'est une vidéo
 */
export const isVideoFile = (url: string = '', name: string = ''): boolean => {
  return getFileType(url, name) === 'video';
};

/**
 * Détermine si c'est un audio
 */
export const isAudioFile = (url: string = '', name: string = ''): boolean => {
  return getFileType(url, name) === 'audio';
};

/**
 * Icône pour un type de fichier
 */
export const getFileIcon = (fileName?: string): string => {
  if (!fileName) return 'document-text-outline';
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const icons: Record<string, string> = {
    pdf: 'document-text-outline',
    doc: 'document-text-outline',
    docx: 'document-text-outline',
    xls: 'grid-outline',
    xlsx: 'grid-outline',
    ppt: 'presentation-outline',
    pptx: 'presentation-outline',
    zip: 'folder-outline',
    rar: 'folder-outline',
    txt: 'document-text-outline',
    csv: 'grid-outline',
  };
  return icons[ext] || 'document-outline';
};

// ============================================================
// DESIGN TOKENS POUR CHAT (T)
// ============================================================
export const T = {
  bg:        COLORS.background || '#0f0f14',
  surface:   COLORS.surface || '#16161e',
  surface2:  COLORS.surface2 || '#1e1e2a',
  border:    COLORS.border || 'rgba(255,255,255,0.07)',
  text:      COLORS.text || '#e2e8f0',
  text2:     COLORS.text2 || '#cbd5e1',
  text3:     COLORS.text3 || '#94a3b8',
  text4:     COLORS.text4 || '#64748b',
  primary:   COLORS.primary || '#6366f1',
  primaryLt: COLORS.primaryLight || 'rgba(99,102,241,0.15)',
  violet:    '#a78bfa',
  success:   COLORS.success || '#10b981',
  error:     COLORS.error || '#ef4444',
  warning:   COLORS.warning || '#f59e0b',
  white:     COLORS.white || '#ffffff',
  avatarColors: COLORS.avatarColors || [
    '#7c3aed','#6d28d9','#4f46e5','#0891b2',
    '#0d9488','#059669','#d97706','#dc2626','#db2777','#9333ea',
  ],
};

// ============================================================
// EXPORT PAR DÉFAUT
// ============================================================
export default {
  COLORS,
  RADIUS,
  SPACING,
  FONT,
  SHADOW,
  T,
  formatTime,
  formatAmount,
  formatDate,
  formatDateTime,
  getInitials,
  getAvatarColor,
  formatFileSize,
  getFileType,
  isImageFile,
  isVideoFile,
  isAudioFile,
  getFileIcon,
};