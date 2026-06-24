import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../src/context/AuthContext';
import { ThemeProvider } from '../src/context/ThemeContext';
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

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <NotificationProvider>
            <AuthProvider>
              <TranslationInit />
              <StatusBar style="light" backgroundColor={COLORS.primary} />
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: 'slide_from_right',
                }}
              >
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(user)" />
                <Stack.Screen name="(admin)" />
                <Stack.Screen name="index" />
              </Stack>
            </AuthProvider>
          </NotificationProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}