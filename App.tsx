import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { COLORS } from './src/config';

// Import des écrans
import LoginScreen from './app/(auth)/login';
import RegisterScreen from './app/(auth)/register';
import IPConfigScreen from './app/(auth)/ip-config';
import UserHome from './app/(user)/index';
import AdminHome from './app/(admin)/index';
import WalletScreen from './app/(user)/wallet';
import TransactionsScreen from './app/(user)/transactions';
import ProfileScreen from './app/(user)/profile';
import SendMoneyScreen from './app/(user)/send-money';
import ReceiveMoneyScreen from './app/(user)/receive-money';
import MobileMoneyScreen from './app/(user)/mobile-money';
import ScanPayScreen from './app/(user)/scan-pay';
import ChatScreen from './app/(user)/chat';
import FriendsScreen from './app/(user)/friends';
import UserSettingsScreen from './app/(user)/settings';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <NotificationProvider>
            <AuthProvider>
              <StatusBar style="light" backgroundColor={COLORS.primary} />
              <NavigationContainer>
                <Stack.Navigator
                  screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                  }}
                  initialRouteName="Login"
                >
                  <Stack.Screen name="Login" component={LoginScreen} />
                  <Stack.Screen name="Register" component={RegisterScreen} />
                  <Stack.Screen name="IPConfig" component={IPConfigScreen} />
                  <Stack.Screen name="UserHome" component={UserHome} />
                  <Stack.Screen name="AdminHome" component={AdminHome} />
                  <Stack.Screen name="Wallet" component={WalletScreen} />
                  <Stack.Screen name="Transactions" component={TransactionsScreen} />
                  <Stack.Screen name="Profile" component={ProfileScreen} />
                  <Stack.Screen name="SendMoney" component={SendMoneyScreen} />
                  <Stack.Screen name="ReceiveMoney" component={ReceiveMoneyScreen} />
                  <Stack.Screen name="MobileMoney" component={MobileMoneyScreen} />
                  <Stack.Screen name="ScanPay" component={ScanPayScreen} />
                  <Stack.Screen name="Chat" component={ChatScreen} />
                  <Stack.Screen name="Friends" component={FriendsScreen} />
                  <Stack.Screen name="Settings" component={UserSettingsScreen} />
                </Stack.Navigator>
              </NavigationContainer>
            </AuthProvider>
          </NotificationProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}