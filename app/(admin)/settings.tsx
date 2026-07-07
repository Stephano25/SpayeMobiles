// app/(admin)/settings.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { AdminService, SystemSettings } from '../../src/services/AdminService';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, getInitials, getAvatarColor, formatAmount } from '../../src/config/colors';
import { useTranslation } from '../../src/services/TranslationService';
import { SafeScreen } from '../../src/components/SafeScreen';

// ✅ Thèmes et langues
const THEMES = [
  { value: 'light', icon: 'sunny-outline', label: 'Clair' },
  { value: 'dark', icon: 'moon-outline', label: 'Sombre' },
  { value: 'system', icon: 'phone-portrait-outline', label: 'Système' },
];

const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'mg', label: 'Malagasy', flag: '🇲🇬' },
];

export default function AdminSettingsScreen() {
  const { colors, theme, setTheme } = useTheme();
  const { user, logout, updateProfile } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { t, language, setLanguage } = useTranslation();
  const navigation = useNavigation();

  // États
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'payment' | 'system'>('general');

  // Profil
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    bio: user?.bio || '',
  });

  // Paramètres système
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      siteName: 'SPaye',
      siteUrl: 'https://spaye.com',
      adminEmail: 'admin@spaye.com',
      supportEmail: 'support@spaye.com',
      maintenanceMode: false,
      registrationEnabled: true,
      defaultUserRole: 'user',
      maxFileSize: 150,
      sessionTimeout: 30,
    },
    security: {
      twoFactorAuth: false,
      passwordMinLength: 8,
      passwordRequireUppercase: true,
      passwordRequireNumbers: true,
      passwordRequireSpecial: true,
      maxLoginAttempts: 5,
      lockoutDuration: 30,
      sessionTimeout: 60,
      requireEmailVerification: true,
      requirePhoneVerification: false,
    },
    payment: {
      minTransaction: 100,
      maxTransaction: 5000000,
      dailyTransferLimit: 5000000,
      monthlyTransferLimit: 50000000,
      mobileMoneyEnabled: true,
      mobileMoneyOperators: { airtel: true, orange: true, mvola: true },
      transferFees: { airtel: 0.5, orange: 0.5, mvola: 0.5, internal: 0 },
      currency: 'Ar',
    },
  });

  // Statistiques système
  const [systemStats, setSystemStats] = useState<any>({
    uptime: '0s',
    memoryUsage: '0 MB',
    activeSessions: 0,
    totalUsers: 0,
    totalTransactions: 0,
    databaseSize: '0 MB',
  });

  // Logs système
  const [logs, setLogs] = useState<any[]>([]);

  const loadSettings = async () => {
    try {
      const [settingsData, statsData, logsData] = await Promise.all([
        AdminService.getSettings(),
        AdminService.getSystemStats(),
        AdminService.getSystemLogs(),
      ]);
      setSettings(settingsData);
      setSystemStats(statsData);
      setLogs(logsData || []);
    } catch (error) {
      showError(t('error_loading'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSettings();
  };

  // ✅ Sauvegarde des paramètres généraux
  const saveGeneralSettings = async () => {
    setSaving(true);
    try {
      await AdminService.updateSettings(settings);
      showSuccess('Paramètres généraux sauvegardés');
    } catch {
      showError(t('error'));
    } finally {
      setSaving(false);
    }
  };

  // ✅ Sauvegarde des paramètres de sécurité
  const saveSecuritySettings = async () => {
    setSaving(true);
    try {
      await AdminService.updateSettings(settings);
      showSuccess('Paramètres de sécurité sauvegardés');
    } catch {
      showError(t('error'));
    } finally {
      setSaving(false);
    }
  };

  // ✅ Sauvegarde des paramètres de paiement
  const savePaymentSettings = async () => {
    setSaving(true);
    try {
      await AdminService.updateSettings(settings);
      showSuccess('Paramètres de paiement sauvegardés');
    } catch {
      showError(t('error'));
    } finally {
      setSaving(false);
    }
  };

  // ✅ Sauvegarde du profil
  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile(profileForm);
      setEditMode(false);
      showSuccess(t('success'));
    } catch {
      showError(t('error'));
    } finally {
      setSaving(false);
    }
  };

  // ✅ Changer la langue
  const changeLanguage = async (lang: string) => {
    await setLanguage(lang);
    showSuccess(t('success'));
  };

  // ✅ Déconnexion
  const handleLogout = () => {
    Alert.alert(
      t('logout'),
      t('confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('logout'), style: 'destructive', onPress: async () => { await logout(); } },
      ]
    );
  };

  const avatarGradient = getAvatarColor((user?.firstName || '') + (user?.lastName || ''));

  if (loading) {
    return (
      <SafeScreen backgroundColor={colors.background}>
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('loading')}</Text>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen backgroundColor={colors.background}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings')}</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutHeaderBtn}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={[styles.content, { backgroundColor: colors.background }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ✅ Carte Admin */}
        <View style={[styles.adminCard, { backgroundColor: colors.card }]}>
          <View style={styles.adminRow}>
            <View style={[styles.adminAvatar, { backgroundColor: avatarGradient }]}>
              <Text style={styles.adminAvatarText}>
                {getInitials(user?.firstName, user?.lastName)}
              </Text>
            </View>
            <View style={styles.adminInfo}>
              <Text style={[styles.adminName, { color: colors.text }]}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={[styles.adminEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
              <View style={[styles.adminRoleBadge, { 
                backgroundColor: user?.role === 'super_admin' ? COLORS.secondary : COLORS.primary 
              }]}>
                <Text style={styles.adminRoleText}>
                  {user?.role === 'super_admin' ? 'Super Administrateur' : 'Administrateur'}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.adminStatsRow}>
            <View style={styles.adminStat}>
              <Text style={[styles.adminStatValue, { color: colors.text }]}>
                {formatAmount(user?.balance || 0)}
              </Text>
              <Text style={[styles.adminStatLabel, { color: colors.textSecondary }]}>Solde</Text>
            </View>
            <View style={styles.adminStatDivider} />
            <View style={styles.adminStat}>
              <Text style={[styles.adminStatValue, { color: colors.text }]}>
                {settings.general.siteName}
              </Text>
              <Text style={[styles.adminStatLabel, { color: colors.textSecondary }]}>Site</Text>
            </View>
          </View>
        </View>

        {/* ✅ Tabs */}
        <View style={styles.tabsContainer}>
          {[
            { key: 'general', icon: 'settings-outline', label: 'Général' },
            { key: 'security', icon: 'shield-outline', label: 'Sécurité' },
            { key: 'payment', icon: 'card-outline', label: 'Paiement' },
            { key: 'system', icon: 'server-outline', label: 'Système' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabBtn,
                activeTab === tab.key && { borderBottomColor: COLORS.primary, borderBottomWidth: 2 },
              ]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Ionicons name={tab.icon as any} size={20} color={activeTab === tab.key ? COLORS.primary : colors.textSecondary} />
              <Text style={[
                styles.tabLabel,
                { color: activeTab === tab.key ? COLORS.primary : colors.textSecondary }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ✅ Onglet Général */}
        {activeTab === 'general' && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              <Ionicons name="settings-outline" size={16} color={COLORS.primary} /> Informations générales
            </Text>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Nom du site</Text>
              <TextInput
                style={[styles.settingInput, { color: colors.text, borderColor: colors.border }]}
                value={settings.general.siteName}
                onChangeText={(v) => setSettings({
                  ...settings,
                  general: { ...settings.general, siteName: v }
                })}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>URL du site</Text>
              <TextInput
                style={[styles.settingInput, { color: colors.text, borderColor: colors.border }]}
                value={settings.general.siteUrl}
                onChangeText={(v) => setSettings({
                  ...settings,
                  general: { ...settings.general, siteUrl: v }
                })}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Email admin</Text>
              <TextInput
                style={[styles.settingInput, { color: colors.text, borderColor: colors.border }]}
                value={settings.general.adminEmail}
                onChangeText={(v) => setSettings({
                  ...settings,
                  general: { ...settings.general, adminEmail: v }
                })}
                keyboardType="email-address"
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Email support</Text>
              <TextInput
                style={[styles.settingInput, { color: colors.text, borderColor: colors.border }]}
                value={settings.general.supportEmail}
                onChangeText={(v) => setSettings({
                  ...settings,
                  general: { ...settings.general, supportEmail: v }
                })}
                keyboardType="email-address"
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Rôle par défaut</Text>
              <View style={styles.roleSelector}>
                {['user', 'admin'].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.roleOption,
                      settings.general.defaultUserRole === r && { backgroundColor: COLORS.primary }
                    ]}
                    onPress={() => setSettings({
                      ...settings,
                      general: { ...settings.general, defaultUserRole: r }
                    })}
                  >
                    <Text style={[
                      styles.roleOptionText,
                      settings.general.defaultUserRole === r && { color: COLORS.white }
                    ]}>
                      {r === 'user' ? 'Utilisateur' : 'Admin'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Mode maintenance</Text>
              <Switch
                value={settings.general.maintenanceMode}
                onValueChange={(v) => setSettings({
                  ...settings,
                  general: { ...settings.general, maintenanceMode: v }
                })}
                trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Inscriptions ouvertes</Text>
              <Switch
                value={settings.general.registrationEnabled}
                onValueChange={(v) => setSettings({
                  ...settings,
                  general: { ...settings.general, registrationEnabled: v }
                })}
                trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: COLORS.primary }]}
              onPress={saveGeneralSettings}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.saveBtnText}>{t('save')}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ✅ Onglet Sécurité */}
        {activeTab === 'security' && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              <Ionicons name="shield-outline" size={16} color={COLORS.primary} /> Sécurité
            </Text>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Authentification 2FA</Text>
              <Switch
                value={settings.security.twoFactorAuth}
                onValueChange={(v) => setSettings({
                  ...settings,
                  security: { ...settings.security, twoFactorAuth: v }
                })}
                trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Longueur min. mot de passe</Text>
              <TextInput
                style={[styles.settingInputSmall, { color: colors.text, borderColor: colors.border }]}
                value={String(settings.security.passwordMinLength)}
                onChangeText={(v) => setSettings({
                  ...settings,
                  security: { ...settings.security, passwordMinLength: parseInt(v) || 8 }
                })}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Tentatives max</Text>
              <TextInput
                style={[styles.settingInputSmall, { color: colors.text, borderColor: colors.border }]}
                value={String(settings.security.maxLoginAttempts)}
                onChangeText={(v) => setSettings({
                  ...settings,
                  security: { ...settings.security, maxLoginAttempts: parseInt(v) || 5 }
                })}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Vérification email</Text>
              <Switch
                value={settings.security.requireEmailVerification}
                onValueChange={(v) => setSettings({
                  ...settings,
                  security: { ...settings.security, requireEmailVerification: v }
                })}
                trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: COLORS.primary }]}
              onPress={saveSecuritySettings}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.saveBtnText}>{t('save')}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ✅ Onglet Paiement */}
        {activeTab === 'payment' && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              <Ionicons name="card-outline" size={16} color={COLORS.primary} /> Paiement
            </Text>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Montant min.</Text>
              <TextInput
                style={[styles.settingInputSmall, { color: colors.text, borderColor: colors.border }]}
                value={String(settings.payment.minTransaction)}
                onChangeText={(v) => setSettings({
                  ...settings,
                  payment: { ...settings.payment, minTransaction: parseInt(v) || 100 }
                })}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Montant max.</Text>
              <TextInput
                style={[styles.settingInputSmall, { color: colors.text, borderColor: colors.border }]}
                value={String(settings.payment.maxTransaction)}
                onChangeText={(v) => setSettings({
                  ...settings,
                  payment: { ...settings.payment, maxTransaction: parseInt(v) || 5000000 }
                })}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Limite journalière</Text>
              <TextInput
                style={[styles.settingInputSmall, { color: colors.text, borderColor: colors.border }]}
                value={String(settings.payment.dailyTransferLimit)}
                onChangeText={(v) => setSettings({
                  ...settings,
                  payment: { ...settings.payment, dailyTransferLimit: parseInt(v) || 5000000 }
                })}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Mobile Money</Text>
              <Switch
                value={settings.payment.mobileMoneyEnabled}
                onValueChange={(v) => setSettings({
                  ...settings,
                  payment: { ...settings.payment, mobileMoneyEnabled: v }
                })}
                trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Opérateurs Mobile Money</Text>
              <View style={styles.operatorsRow}>
                {['airtel', 'orange', 'mvola'].map((op) => (
                  <TouchableOpacity
                    key={op}
                    style={[
                      styles.operatorToggle,
                      (settings.payment.mobileMoneyOperators as any)[op] && { backgroundColor: COLORS.primary }
                    ]}
                    onPress={() => setSettings({
                      ...settings,
                      payment: {
                        ...settings.payment,
                        mobileMoneyOperators: {
                          ...settings.payment.mobileMoneyOperators,
                          [op]: !(settings.payment.mobileMoneyOperators as any)[op],
                        }
                      }
                    })}
                  >
                    <Text style={[
                      styles.operatorToggleText,
                      (settings.payment.mobileMoneyOperators as any)[op] && { color: COLORS.white }
                    ]}>
                      {op === 'airtel' ? 'Airtel' : op === 'orange' ? 'Orange' : 'MVola'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: COLORS.primary }]}
              onPress={savePaymentSettings}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.saveBtnText}>{t('save')}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ✅ Onglet Système */}
        {activeTab === 'system' && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              <Ionicons name="server-outline" size={16} color={COLORS.primary} /> Système
            </Text>

            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.text }]}>Uptime</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{systemStats.uptime}</Text>
            </View>

            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.text }]}>Mémoire</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{systemStats.memoryUsage}</Text>
            </View>

            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.text }]}>Sessions actives</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{systemStats.activeSessions || 0}</Text>
            </View>

            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.text }]}>Utilisateurs</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{systemStats.totalUsers || 0}</Text>
            </View>

            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.text }]}>Transactions</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{systemStats.totalTransactions || 0}</Text>
            </View>

            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.text }]}>Base de données</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{systemStats.databaseSize || '0 MB'}</Text>
            </View>

            {/* Logs récents */}
            <Text style={[styles.cardTitle, { color: colors.text, marginTop: 16 }]}>
              <Ionicons name="list-outline" size={16} color={COLORS.primary} /> Logs récents
            </Text>
            {logs.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Aucun log</Text>
            ) : (
              logs.slice(0, 5).map((log, index) => (
                <View key={index} style={[styles.logItem, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.logMessage, { color: colors.text }]}>{log.message}</Text>
                  <Text style={[styles.logDate, { color: colors.textSecondary }]}>
                    {new Date(log.date).toLocaleString('fr-MG')}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* ✅ Thème et Langue (toujours visibles) */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            <Ionicons name="color-palette-outline" size={16} color={COLORS.primary} /> Apparence
          </Text>

          {/* Thème */}
          <Text style={[styles.sectionLabel, { color: colors.text }]}>Thème</Text>
          <View style={styles.themeRow}>
            {THEMES.map((th) => (
              <TouchableOpacity
                key={th.value}
                style={[
                  styles.themeBtn,
                  { backgroundColor: theme === th.value ? COLORS.primary + '18' : colors.background },
                  theme === th.value && { borderColor: COLORS.primary },
                ]}
                onPress={() => setTheme(th.value as any)}
              >
                <Ionicons name={th.icon as any} size={22} color={theme === th.value ? COLORS.primary : colors.textSecondary} />
                <Text style={[styles.themeLabel, { color: theme === th.value ? COLORS.primary : colors.textSecondary }]}>
                  {th.label}
                </Text>
                {theme === th.value && <View style={styles.activeDot} />}
              </TouchableOpacity>
            ))}
          </View>

          {/* Langue */}
          <Text style={[styles.sectionLabel, { color: colors.text, marginTop: 16 }]}>Langue</Text>
          <View style={styles.langRow}>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.langBtn,
                  language === lang.code && { backgroundColor: COLORS.primary + '18', borderColor: COLORS.primary },
                ]}
                onPress={() => changeLanguage(lang.code)}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <Text style={[styles.langLabel, { color: language === lang.code ? COLORS.primary : colors.text }]}>
                  {lang.label}
                </Text>
                {language === lang.code && (
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ✅ Déconnexion */}
        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: COLORS.error }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
          <Text style={styles.logoutText}>{t('logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  logoutHeaderBtn: { padding: 4 },
  content: { flex: 1, paddingHorizontal: 16, paddingBottom: 40 },
  
  // Admin Card
  adminCard: { marginTop: 16, padding: 16, borderRadius: 20 },
  adminRow: { flexDirection: 'row', alignItems: 'center' },
  adminAvatar: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  adminAvatarText: { color: COLORS.white, fontWeight: 'bold', fontSize: 18 },
  adminInfo: { flex: 1, marginLeft: 12 },
  adminName: { fontSize: 16, fontWeight: '700' },
  adminEmail: { fontSize: 13, marginTop: 2 },
  adminRoleBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginTop: 4 },
  adminRoleText: { color: COLORS.white, fontSize: 10, fontWeight: '600' },
  adminStatsRow: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: COLORS.gray200 },
  adminStat: { flex: 1, alignItems: 'center' },
  adminStatValue: { fontSize: 16, fontWeight: 'bold' },
  adminStatLabel: { fontSize: 11, marginTop: 2 },
  adminStatDivider: { width: 1, backgroundColor: COLORS.gray200 },
  
  // Tabs
  tabsContainer: { flexDirection: 'row', marginTop: 16, gap: 0 },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  
  // Cards
  card: { marginTop: 16, padding: 16, borderRadius: 20 },
  cardTitle: { fontSize: 14, fontWeight: '700', marginBottom: 16 },
  
  // Settings
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: COLORS.gray100 },
  settingLabel: { fontSize: 14, fontWeight: '500', flex: 1 },
  settingInput: { borderWidth: 1, borderRadius: 8, padding: 8, fontSize: 14, minWidth: 120, textAlign: 'right' },
  settingInputSmall: { borderWidth: 1, borderRadius: 8, padding: 8, fontSize: 14, width: 80, textAlign: 'center' },
  
  // Role selector
  roleSelector: { flexDirection: 'row', gap: 8 },
  roleOption: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: COLORS.gray200 },
  roleOptionText: { fontSize: 13, fontWeight: '500' },
  
  // Operators
  operatorsRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  operatorToggle: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: COLORS.gray200 },
  operatorToggleText: { fontSize: 13, fontWeight: '500' },
  
  // Stats
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: COLORS.gray100 },
  statLabel: { fontSize: 14, fontWeight: '500' },
  statValue: { fontSize: 14, fontWeight: '600' },
  
  // Logs
  logItem: { paddingVertical: 8, borderBottomWidth: 0.5 },
  logMessage: { fontSize: 13, fontWeight: '500' },
  logDate: { fontSize: 11, marginTop: 2 },
  
  // Theme & Language
  themeRow: { flexDirection: 'row', gap: 8 },
  themeBtn: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: 'transparent', gap: 6 },
  themeLabel: { fontSize: 12, fontWeight: '600' },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
  sectionLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  langRow: { gap: 8 },
  langBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.gray200 },
  langFlag: { fontSize: 20 },
  langLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  
  // Buttons
  saveBtn: { padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  saveBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 15 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, padding: 15, borderRadius: 16 },
  logoutText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  emptyText: { textAlign: 'center', paddingVertical: 16, fontSize: 14 },
});