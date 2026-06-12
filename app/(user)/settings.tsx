import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS } from '../../src/config';
import { router } from 'expo-router';

export default function UserSettingsScreen() {
  const { colors, theme, setTheme, isDark } = useTheme();
  const { logout } = useAuth();
  const [notif, setNotif] = useState(true);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres</Text><View style={{ width: 40 }} />
      </View>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={styles.sectionTitle}>Apparence</Text>
        <View style={styles.row}><Text>Thème</Text><View style={styles.themeButtons}>
          <TouchableOpacity onPress={() => setTheme('light')} style={[styles.themeBtn, theme === 'light' && styles.activeTheme]}><Text>☀️</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setTheme('dark')} style={[styles.themeBtn, theme === 'dark' && styles.activeTheme]}><Text>🌙</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setTheme('system')} style={[styles.themeBtn, theme === 'system' && styles.activeTheme]}><Text>📱</Text></TouchableOpacity>
        </View></View>
        <View style={styles.row}><Text>Notifications</Text><Switch value={notif} onValueChange={setNotif} /></View>
      </View>
      <TouchableOpacity style={styles.logoutButton} onPress={logout}><Text style={styles.logoutText}>Déconnexion</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  backText: { fontSize: 24, color: COLORS.white },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  card: { marginHorizontal: 20, marginTop: 20, padding: 20, borderRadius: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12 },
  themeButtons: { flexDirection: 'row', gap: 12 },
  themeBtn: { padding: 8, borderRadius: 20, backgroundColor: COLORS.gray100, width: 44, alignItems: 'center' },
  activeTheme: { backgroundColor: COLORS.primary },
  logoutButton: { backgroundColor: COLORS.error, marginHorizontal: 20, marginTop: 30, padding: 14, borderRadius: 12, alignItems: 'center' },
  logoutText: { color: 'white', fontWeight: 'bold' },
});