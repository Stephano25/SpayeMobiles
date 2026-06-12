import { Tabs } from 'expo-router';
import { COLORS } from '../../src/config';

export default function UserLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: COLORS.primary }}>
      <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="wallet" options={{ title: 'Portefeuille' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
      {/* Ajoutez les autres routes masquées si nécessaire */}
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