import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../src/context/AuthContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import { NotificationProvider } from '../src/context/NotificationContext';
import { COLORS } from '../src/config';
import { useColorScheme } from 'react-native';

function StatusBarManager() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <StatusBar
      style={isDark ? 'light' : 'dark'}
      backgroundColor={isDark ? '#1a1a2e' : COLORS.primary}
    />
  );
}

export default function RootLayout() {
  // Try/catch pour éviter l'erreur keep awake
  try {
    // Tentative d'import dynamique
    // const { useKeepAwake } = require('expo-keep-awake');
    // useKeepAwake();
  } catch (error) {
    console.warn('KeepAwake non disponible, continuer...');
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <StatusBarManager />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: COLORS.background },
              }}
            />
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}