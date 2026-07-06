// App.tsx
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import * as Linking from 'expo-linking';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, setNavigateTo, useAuth } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { COLORS } from './src/config/colors';
import { detectBackendIP } from './src/config/api';

// ✅ Import des écrans directement (sans layouts)
import LoginScreen from './app/(auth)/login';
import RegisterScreen from './app/(auth)/register';
import UserHome from './app/(user)/UserHome';
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
import AdminUsersScreen from './app/(admin)/users';
import AdminTransactionsScreen from './app/(admin)/transactions';
import AdminAdminsScreen from './app/(admin)/admins';
import AdminCreateScreen from './app/(admin)/admins/create';
import AdminSettingsScreen from './app/(admin)/settings';
import AdminStatsScreen from './app/(admin)/stats';
import AdminProfileScreen from './app/(admin)/profile';
import AdminDepositScreen from './app/(admin)/deposit';
import AdminWithdrawScreen from './app/(admin)/withdraw';

const Stack = createNativeStackNavigator();

// ✅ Configuration des liens pour le deep linking
const linking = {
  prefixes: [Linking.createURL('/'), 'spaye://'],
  config: {
    screens: {
      Login: 'login',
      Register: 'register',
      UserHome: 'home',
      AdminHome: 'admin',
      Profile: 'profile',
      Wallet: 'wallet',
      Transactions: 'transactions',
      Settings: 'settings',
      Chat: 'chat/:userId?',
      Friends: 'friends',
      SendMoney: 'send-money',
      ReceiveMoney: 'receive-money',
      MobileMoney: 'mobile-money',
      ScanPay: 'scan-pay',
      AdminUsers: 'admin/users',
      AdminTransactions: 'admin/transactions',
      AdminAdmins: 'admin/admins',
      AdminCreate: 'admin/admins/create',
      AdminSettings: 'admin/settings',
      AdminStats: 'admin/stats',
      AdminProfile: 'admin/profile',
    },
  },
};

function RootNavigator() {
  const navigationRef = useNavigationContainerRef();
  const { isLoading, user } = useAuth();

  useEffect(() => {
    setNavigateTo((routeName: string) => {
      // @ts-ignore
      navigationRef.current?.navigate(routeName);
    });
  }, [navigationRef]);

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: COLORS.primary }} />;
  }

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
        initialRouteName={user ? (user.role === 'admin' || user.role === 'super_admin' ? 'AdminHome' : 'UserHome') : 'Login'}
      >
        {/* Auth Screens */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        
        {/* User Screens */}
        <Stack.Screen name="UserHome" component={UserHome} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Wallet" component={WalletScreen} />
        <Stack.Screen name="Transactions" component={TransactionsScreen} />
        <Stack.Screen name="Settings" component={UserSettingsScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Friends" component={FriendsScreen} />
        <Stack.Screen name="SendMoney" component={SendMoneyScreen} />
        <Stack.Screen name="ReceiveMoney" component={ReceiveMoneyScreen} />
        <Stack.Screen name="MobileMoney" component={MobileMoneyScreen} />
        <Stack.Screen name="ScanPay" component={ScanPayScreen} />
        
        {/* Admin Screens */}
        <Stack.Screen name="AdminHome" component={AdminHome} />
        <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
        <Stack.Screen name="AdminTransactions" component={AdminTransactionsScreen} />
        <Stack.Screen name="AdminAdmins" component={AdminAdminsScreen} />
        <Stack.Screen name="AdminCreate" component={AdminCreateScreen} />
        <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} />
        <Stack.Screen name="AdminStats" component={AdminStatsScreen} />
        <Stack.Screen name="AdminProfile" component={AdminProfileScreen} />
        <Stack.Screen name="AdminDeposit" component={AdminDepositScreen} />
        <Stack.Screen name="AdminWithdraw" component={AdminWithdrawScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    detectBackendIP().catch(console.error);
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <NotificationProvider>
            <AuthProvider>
              <StatusBar style="light" backgroundColor={COLORS.primary} />
              <RootNavigator />
            </AuthProvider>
          </NotificationProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}