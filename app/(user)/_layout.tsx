import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/config';

export default function UserLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: COLORS.primary, tabBarInactiveTintColor: COLORS.gray400 }}>
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: ({color,size}) => <Ionicons name="home-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="wallet" options={{ title: 'Portefeuille', tabBarIcon: ({color,size}) => <Ionicons name="wallet-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: ({color,size}) => <Ionicons name="person-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="send-money" options={{ href: null }} />
      <Tabs.Screen name="receive-money" options={{ href: null }} />
      <Tabs.Screen name="mobile-money" options={{ href: null }} />
      <Tabs.Screen name="scan-pay" options={{ href: null }} />
      <Tabs.Screen name="transactions" options={{ href: null }} />
      <Tabs.Screen name="chat" options={{ href: null }} />
      <Tabs.Screen name="friends" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}