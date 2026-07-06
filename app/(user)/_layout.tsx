// app/(user)/_layout.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UserHome from './UserHome';
import ProfileScreen from './profile';
import WalletScreen from './wallet';
import TransactionsScreen from './transactions';
import UserSettingsScreen from './settings';
import ChatScreen from './chat';
import FriendsScreen from './friends';
import SendMoneyScreen from './send-money';
import ReceiveMoneyScreen from './receive-money';
import MobileMoneyScreen from './mobile-money';
import ScanPayScreen from './scan-pay';

const Stack = createNativeStackNavigator();

export default function UserLayout() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
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
    </Stack.Navigator>
  );
}