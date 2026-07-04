import React, { useEffect } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, setNavigateTo } from '../src/context/AuthContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import { NotificationProvider } from '../src/context/NotificationContext';
import { COLORS } from '../src/config';
import { TranslationService } from '../src/services/TranslationService';

// Import des Layouts
import AuthLayout from './(auth)/_layout';
import UserLayout from './(user)/_layout';
import AdminLayout from './(admin)/_layout';

const Stack = createNativeStackNavigator();

function TranslationInit() {
  useEffect(() => {
    TranslationService.getInstance().init();
  }, []);
  return null;
}

function RootNavigator() {
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    if (navigationRef) {
      // ✅ Enregistrer la fonction de navigation
      setNavigateTo((routeName: string) => {
        navigationRef.navigate(routeName as never);
      });
    }
  }, [navigationRef]);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
        initialRouteName="Auth"
      >
        <Stack.Screen name="Auth" component={AuthLayout} />
        <Stack.Screen name="User" component={UserLayout} />
        <Stack.Screen name="Admin" component={AdminLayout} />
      </Stack.Navigator>
    </NavigationContainer>
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
              <StatusBar style="light" backgroundColor={COLORS.primary} />
              <RootNavigator />
            </AuthProvider>
          </NotificationProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}