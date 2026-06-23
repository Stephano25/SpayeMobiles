import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

export const useSafeArea = () => {
  const insets = useSafeAreaInsets();

  return {
    top: insets.top || (Platform.OS === 'ios' ? 44 : 30),
    bottom: insets.bottom || (Platform.OS === 'ios' ? 34 : 20),
    left: insets.left || 0,
    right: insets.right || 0,
    // Pour les tab bars
    bottomTab: insets.bottom + 60 || (Platform.OS === 'ios' ? 80 : 70),
    // Pour les boutons en bas de page
    bottomButton: insets.bottom + 16 || (Platform.OS === 'ios' ? 50 : 40),
  };
};