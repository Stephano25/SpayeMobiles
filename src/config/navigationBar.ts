// src/config/navigationBar.ts
import { Platform, StatusBar } from 'react-native';

export const NAVIGATION_BAR = {
  androidHeight: 48,
  iosStatusBarHeight: 44,
  iosBottomSpace: 34,

  getStatusBarHeight: (): number => {
    if (Platform.OS === 'ios') {
      return 44;
    }
    return StatusBar.currentHeight || 30;
  },

  getBottomSpace: (): number => {
    if (Platform.OS === 'ios') {
      return 34;
    }
    return 0;
  },

  getBottomPadding: (): number => {
    if (Platform.OS === 'ios') {
      return NAVIGATION_BAR.getBottomSpace() + 20;
    }
    return NAVIGATION_BAR.androidHeight + 16;
  },

  getTopPadding: (): number => {
    return NAVIGATION_BAR.getStatusBarHeight() + 16;
  },
};

export const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 80 : 70;
export const BOTTOM_BUTTON_PADDING = Platform.OS === 'ios' ? 40 : 30;