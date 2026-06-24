import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../src/context/AuthContext';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { NotificationProvider } from '../src/context/NotificationContext';
import { COLORS } from '../src/config';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { TranslationService } from '../src/services/TranslationService';

// Initialize translation service early
function TranslationInit() {
  useEffect(() => {
    TranslationService.getInstance().init();
  }, []);
  return null;
}

function ThemedStack() {
  const { isDark, colors } = useTheme();
  return (
    <>
      <StatusBar
        style={isDark ? 'light' : 'light'}
        backgroundColor={COLORS.primary}
      />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <NotificationProvider>
            <AuthProvider>
              <TranslationInit />
              <ThemedStack />
            </AuthProvider>
          </NotificationProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}