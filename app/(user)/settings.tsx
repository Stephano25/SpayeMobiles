import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useNotification } from '../../src/context/NotificationContext';
import { AuthService } from '../../src/services/AuthService';
import { COLORS, getStoredIp, setBackendIp, getApiUrl } from '../../src/config';

export default function UserSettingsScreen() {
  const { colors, theme, setTheme, isDark } = useTheme();
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [notif, setNotif] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showIPConfig, setShowIPConfig] = useState(false);
  const [ipAddress, setIpAddress] = useState('');
  const [currentIp, setCurrentIp] = useState('');

  // Charger l'IP actuelle
  React.useEffect(() => {
    loadCurrentIp();
  }, []);

  const loadCurrentIp = async () => {
    const stored = await getStoredIp();
    const apiUrl = await getApiUrl();
    setCurrentIp(apiUrl);
    if (stored) setIpAddress(stored);
  };

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

  const handleChangePassword = () => {
    Alert.alert(
      'Changer le mot de passe',
      'Cette fonctionnalité sera disponible dans une prochaine version.',
      [{ text: 'OK' }]
    );
  };

  const handleSaveIp = async () => {
    if (!ipAddress.trim()) {
      showError('Veuillez entrer une adresse IP');
      return;
    }
    try {
      await setBackendIp(ipAddress.trim());
      showSuccess('IP mise à jour avec succès !');
      setShowIPConfig(false);
      loadCurrentIp();
    } catch (error) {
      showError('Erreur lors de la mise à jour de l\'IP');
    }
  };

  const menuSections = [
    {
      title: 'Apparence',
      icon: 'color-palette-outline',
      items: [
        {
          label: 'Thème',
          value: theme === 'light' ? '☀️ Clair' : theme === 'dark' ? '🌙 Sombre' : '📱 Système',
          onPress: () => {
            const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
            setTheme(nextTheme as any);
          },
        },
        {
          label: 'Notifications',
          value: notif ? 'Activées' : 'Désactivées',
          onPress: () => setNotif(!notif),
        },
      ],
    },
    {
      title: 'Sécurité',
      icon: 'shield-outline',
      items: [
        {
          label: 'Changer le mot de passe',
          value: '',
          onPress: handleChangePassword,
        },
      ],
    },
    {
      title: 'Configuration',
      icon: 'settings-outline',
      items: [
        {
          label: 'IP du serveur',
          value: showIPConfig ? '✏️' : 'Voir / Modifier',
          onPress: () => setShowIPConfig(!showIPConfig),
        },
      ],
    },
    {
      title: 'Informations',
      icon: 'information-circle-outline',
      items: [
        {
          label: 'Version',
          value: '1.0.0',
          onPress: () => {},
        },
        {
          label: 'Compte',
          value: user?.email || '',
          onPress: () => {},
        },
      ],
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Section IP Config */}
      {showIPConfig && (
        <View style={[styles.ipCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.ipLabel, { color: colors.text }]}>Adresse IP du serveur</Text>
          <Text style={[styles.ipCurrent, { color: colors.textSecondary }]}>
            Actuelle: {currentIp}
          </Text>
          <View style={styles.ipRow}>
            <TextInput
              style={[styles.ipInput, { color: colors.text, backgroundColor: colors.background }]}
              placeholder="192.168.188.135"
              placeholderTextColor={COLORS.gray400}
              value={ipAddress}
              onChangeText={setIpAddress}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.ipSaveBtn} onPress={handleSaveIp}>
              <Text style={styles.ipSaveText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Menu sections */}
      {menuSections.map((section, index) => (
        <View key={index} style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name={section.icon as any} size={20} color={COLORS.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
          </View>
          {section.items.map((item, itemIndex) => (
            <TouchableOpacity
              key={itemIndex}
              style={[
                styles.menuItem,
                itemIndex === section.items.length - 1 && styles.menuItemLast,
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
              <View style={styles.menuRight}>
                {item.value && (
                  <Text style={[styles.menuValue, { color: colors.textSecondary }]}>
                    {item.value}
                  </Text>
                )}
                <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      {/* Bouton déconnexion */}
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
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },

  ipCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  ipLabel: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  ipCurrent: { fontSize: 12, marginBottom: 12 },
  ipRow: { flexDirection: 'row', gap: 8 },
  ipInput: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  ipSaveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    justifyContent: 'center',
  },
  ipSaveText: { color: COLORS.white, fontWeight: '600' },

  section: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginLeft: 10 },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuLabel: { fontSize: 14 },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuValue: { fontSize: 13 },

  logoutButton: {
    backgroundColor: COLORS.error,
    marginHorizontal: 16,
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