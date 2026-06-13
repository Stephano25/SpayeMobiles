import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../src/context/AuthContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import { NotificationProvider } from '../src/context/NotificationContext';
import { COLORS } from '../src/config';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <StatusBar style="light" backgroundColor={COLORS.primary} />
            <Stack screenOptions={{ headerShown: false }} />
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}