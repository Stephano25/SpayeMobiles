// src/config/navigationBar.ts
// ─────────────────────────────────────────────────────────────
//  SPAYE — Configuration de la barre de navigation
// ─────────────────────────────────────────────────────────────

import { Platform } from 'react-native';

export const NAVIGATION_BAR = {
  height: Platform.OS === 'ios' ? 44 : 56,
  backgroundColor: '#16161e',
  titleColor: '#e2e8f0',
  backColor: '#e2e8f0',
};

export const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 83 : 60;

export const BOTTOM_BUTTON_PADDING = Platform.OS === 'ios' ? 34 : 16;

export const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : 0;

export default {
  NAVIGATION_BAR,
  TAB_BAR_HEIGHT,
  BOTTOM_BUTTON_PADDING,
  STATUS_BAR_HEIGHT,
};