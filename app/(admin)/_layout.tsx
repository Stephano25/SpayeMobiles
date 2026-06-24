import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/config';
import { Platform, View } from 'react-native';
import { useTranslation } from '../../src/services/TranslationService';
import { useTheme } from '../../src/context/ThemeContext';

export default function AdminLayout() {
  // useTranslation subscribes to languageEvents → re-renders when language changes
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: isDark ? COLORS.gray600 : COLORS.gray400,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
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
          title: t('dashboard'),
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? {
              backgroundColor: COLORS.primary + '18',
              borderRadius: 10,
              padding: 4,
            } : {}}>
              <Ionicons name={focused ? 'grid' : 'grid-outline'} size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: t('users'),
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? {
              backgroundColor: COLORS.primary + '18',
              borderRadius: 10,
              padding: 4,
            } : {}}>
              <Ionicons name={focused ? 'people' : 'people-outline'} size={size} color={color} />
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
      <Tabs.Screen name="stats" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}