import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS } from '../../src/config';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function UserSettingsScreen() {
  const { colors, theme, setTheme, isDark } = useTheme();
  const { logout } = useAuth();
  const [notif, setNotif] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            await logout();
            setLoading(false);
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Apparence</Text>

        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Thème</Text>
          <View style={styles.themeButtons}>
            <TouchableOpacity
              onPress={() => setTheme('light')}
              style={[styles.themeBtn, theme === 'light' && styles.activeTheme]}
            >
              <Text style={styles.themeEmoji}>☀️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTheme('dark')}
              style={[styles.themeBtn, theme === 'dark' && styles.activeTheme]}
            >
              <Text style={styles.themeEmoji}>🌙</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTheme('system')}
              style={[styles.themeBtn, theme === 'system' && styles.activeTheme]}
            >
              <Text style={styles.themeEmoji}>📱</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Notifications</Text>
          <Switch
            value={notif}
            onValueChange={setNotif}
            trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
            thumbColor={COLORS.white}
          />
        </View>

        {!isDark && <View style={styles.divider} />}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Informations</Text>
        <View style={styles.infoRow}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.gray500} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Version 1.0.0
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="server-outline" size={20} color={COLORS.gray500} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {isDark ? 'Thème sombre' : 'Thème clair'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, loading && styles.logoutDisabled]}
        onPress={handleLogout}
        disabled={loading}
      >
        <Ionicons name="exit-outline" size={20} color={COLORS.white} style={styles.logoutIcon} />
        <Text style={styles.logoutText}>{loading ? 'Déconnexion...' : 'Déconnexion'}</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 24, color: COLORS.white },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  card: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  rowLabel: { fontSize: 15, fontWeight: '500' },
  themeButtons: { flexDirection: 'row', gap: 8 },
  themeBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.gray100,
    width: 44,
    alignItems: 'center',
  },
  themeEmoji: { fontSize: 18 },
  activeTheme: { backgroundColor: COLORS.primary },
  divider: { height: 1, backgroundColor: COLORS.gray200, marginVertical: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
  infoText: { fontSize: 14 },
  logoutButton: {
    backgroundColor: COLORS.error,
    marginHorizontal: 20,
    marginTop: 24,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  logoutDisabled: { opacity: 0.6 },
  logoutIcon: { marginRight: 8 },
  logoutText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
});