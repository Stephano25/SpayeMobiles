// app/(admin)/_layout.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminDashboard from './index';
import AdminUsersScreen from './users';
import AdminTransactionsScreen from './transactions';
import AdminAdminsScreen from './admins';
import AdminCreateScreen from './admins/create';
import AdminSettingsScreen from './settings';
import AdminStatsScreen from './stats';
import AdminProfileScreen from './profile';

const Stack = createNativeStackNavigator();

export default function AdminLayout() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminHome" component={AdminDashboard} />
      <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
      <Stack.Screen name="AdminTransactions" component={AdminTransactionsScreen} />
      <Stack.Screen name="AdminAdmins" component={AdminAdminsScreen} />
      <Stack.Screen name="AdminCreate" component={AdminCreateScreen} />
      <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} />
      <Stack.Screen name="AdminStats" component={AdminStatsScreen} />
      <Stack.Screen name="AdminProfile" component={AdminProfileScreen} />
    </Stack.Navigator>
  );
}