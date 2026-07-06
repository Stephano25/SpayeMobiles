// src/config/navigationBar.ts
import { Platform } from 'react-native';

export const NAVIGATION_BAR = {
  height: Platform.OS === 'ios' ? 44 : 56,
  backgroundColor: 'transparent',
  tintColor: '#ffffff',
};

export const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 83 : 56;

export const BOTTOM_BUTTON_PADDING = Platform.OS === 'ios' ? 24 : 16;

export const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : 24;