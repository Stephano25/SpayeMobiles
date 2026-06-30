import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from '../../src/services/TranslationService';
import { useTheme } from '../../src/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, StatusBar, Platform } from 'react-native';
import { COLORS } from '../../src/config';

// Import des écrans
import UserHome from './UserHome';
import WalletScreen from './wallet';
import TransactionsScreen from './transactions';
import ProfileScreen from './profile';
import SendMoneyScreen from './send-money';
import ReceiveMoneyScreen from './receive-money';
import MobileMoneyScreen from './mobile-money';
import ScanPayScreen from './scan-pay';
import ChatScreen from './chat';
import FriendsScreen from './friends';
import UserSettingsScreen from './settings';

const Stack = createNativeStackNavigator();

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
      <Stack.Navigator
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
        <Stack.Screen name="UserHome" component={UserHome} />
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
    </View>
  );
}