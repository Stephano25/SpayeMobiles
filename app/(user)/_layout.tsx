import { Stack } from 'expo-router';
import { useTranslation } from '../../src/services/TranslationService';
import { useTheme } from '../../src/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, StatusBar, Platform } from 'react-native';
import { COLORS } from '../../src/config';

export default function UserLayout() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primary}
      />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { 
            backgroundColor: colors.background,
            paddingTop: insets.top || (Platform.OS === 'ios' ? 44 : 30),
            paddingBottom: insets.bottom || (Platform.OS === 'ios' ? 34 : 20),
          },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="wallet" />
        <Stack.Screen name="transactions" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="send-money" />
        <Stack.Screen name="receive-money" />
        <Stack.Screen name="mobile-money" />
        <Stack.Screen name="scan-pay" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="friends" />
        <Stack.Screen name="settings" />
      </Stack>
    </View>
  );
}