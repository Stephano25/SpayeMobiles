// src/config/index.ts
export * from './api';
export * from './colors';
export * from './navigationBar';

// =====================================================
// HELPERS
// =====================================================

export { 
  formatAmount,
  formatDate,
  formatDateTime,
  getInitials,
  getAvatarColor,
  COLORS,
  RADIUS,
  SPACING,
  FONT,
  SHADOW,
} from './colors';

export { 
  getApiUrl,
  getSocketUrl,
  setBackendIp,
  getStoredIp,
  resetBackendIp,
  detectBackendIP,
} from './api';

export { 
  NAVIGATION_BAR,
  TAB_BAR_HEIGHT,
  BOTTOM_BUTTON_PADDING,
  STATUS_BAR_HEIGHT,
} from './navigationBar';