import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/config';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../../src/services/TranslationService';
import { useTheme } from '../../src/context/ThemeContext';

export default function UserLayout() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  const tabBarHeight = Platform.OS === 'ios' ? 80 + insets.bottom : 64;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: isDark ? COLORS.gray600 : COLORS.gray400,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0,
          height: tabBarHeight,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom + 8 : 10,
          paddingTop: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.3 : 0.06,
          shadowRadius: 16,
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? {
              backgroundColor: COLORS.primary + '18',
              borderRadius: 10,
              padding: 4,
            } : {}}>
              <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: t('wallet'),
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? {
              backgroundColor: COLORS.primary + '18',
              borderRadius: 10,
              padding: 4,
            } : {}}>
              <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: t('transactions'),
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? {
              backgroundColor: COLORS.primary + '18',
              borderRadius: 10,
              padding: 4,
            } : {}}>
              <Ionicons name={focused ? 'swap-horizontal' : 'swap-horizontal-outline'} size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? {
              backgroundColor: COLORS.primary + '18',
              borderRadius: 10,
              padding: 4,
            } : {}}>
              <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
            </View>
          ),
        }}
      />
      {/* Hidden screens */}
      <Tabs.Screen name="send-money" options={{ href: null }} />
      <Tabs.Screen name="receive-money" options={{ href: null }} />
      <Tabs.Screen name="mobile-money" options={{ href: null }} />
      <Tabs.Screen name="scan-pay" options={{ href: null }} />
      <Tabs.Screen name="chat" options={{ href: null }} />
      <Tabs.Screen name="friends" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}