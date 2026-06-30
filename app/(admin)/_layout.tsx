import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from '../../src/services/TranslationService';
import { useTheme } from '../../src/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, StatusBar, Platform } from 'react-native';
import { COLORS } from '../../src/config';

// Import des écrans Admin
import AdminDashboard from './index';
import AdminUsersScreen from './users';
import AdminTransactionsScreen from './transactions';
import AdminProfileScreen from './profile';
import AdminStatsScreen from './stats';
import AdminSettingsScreen from './settings';

const Stack = createNativeStackNavigator();

export default function AdminLayout() {
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
        <Stack.Screen name="AdminHome" component={AdminDashboard} />
        <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
        <Stack.Screen name="AdminTransactions" component={AdminTransactionsScreen} />
        <Stack.Screen name="AdminProfile" component={AdminProfileScreen} />
        <Stack.Screen name="AdminStats" component={AdminStatsScreen} />
        <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} />
      </Stack.Navigator>
    </View>
  );
}