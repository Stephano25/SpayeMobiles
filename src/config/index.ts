// src/config/index.ts
// ─────────────────────────────────────────────────────────────
//  SPAYE — Configuration centrale
// ─────────────────────────────────────────────────────────────

// ============================================================
// EXPORT DE TOUT DEPUIS colors.ts
// ============================================================
export {
  // Couleurs
  COLORS,
  RADIUS,
  SPACING,
  FONT,
  SHADOW,
  T,
  
  // Helpers
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
} from './colors';

// ============================================================
// EXPORT DEPUIS api.ts - AVEC getBaseUrl
// ============================================================
export {
  getBaseUrl,        // ✅ AJOUTÉ
  getApiUrl,
  getSocketUrl,
  setBackendIp,
  getStoredIp,
  resetBackendIp,
  detectBackendIP,
  checkBackendHealth,
} from './api';

// ============================================================
// EXPORT DEPUIS navigationBar.ts
// ============================================================
export {
  NAVIGATION_BAR,
  TAB_BAR_HEIGHT,
  BOTTOM_BUTTON_PADDING,
  STATUS_BAR_HEIGHT,
} from './navigationBar';

// ============================================================
// EXPORT PAR DÉFAUT
// ============================================================
import * as colors from './colors';
import * as api from './api';
import * as navigationBar from './navigationBar';

export default {
  ...colors,
  ...api,
  ...navigationBar,
};