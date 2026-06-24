import { Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Configuration pour la barre de navigation
export const NAVIGATION_BAR = {
  // Hauteur de la barre de navigation Android
  androidHeight: 48,
  // Hauteur de la barre de statut (iOS)
  iosStatusBarHeight: 44,
  // Espace en bas pour les appareils avec notch (iOS)
  iosBottomSpace: 34,
  
  // Fonction pour obtenir la hauteur de la barre de statut
  getStatusBarHeight: (): number => {
    if (Platform.OS === 'ios') {
      return 44; // iPhone X et plus récents
    }
    return StatusBar.currentHeight || 30;
  },
  
  // Fonction pour obtenir l'espace en bas
  getBottomSpace: (): number => {
    if (Platform.OS === 'ios') {
      return 34; // iPhone X et plus récents
    }
    return 0;
  },
  
  // Padding total en bas
  getBottomPadding: (): number => {
    if (Platform.OS === 'ios') {
      return NAVIGATION_BAR.getBottomSpace() + 20;
    }
    return NAVIGATION_BAR.androidHeight + 16;
  },
  
  // Padding total en haut
  getTopPadding: (): number => {
    return NAVIGATION_BAR.getStatusBarHeight() + 16;
  },
};

// Pour les écrans avec tab bar
export const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 80 : 70;

// Pour les boutons en bas de page
export const BOTTOM_BUTTON_PADDING = Platform.OS === 'ios' ? 40 : 30;