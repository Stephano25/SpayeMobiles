import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useNotification } from '../../src/context/NotificationContext';
import { AuthService } from '../../src/services/AuthService';
import { getStoredIp, setBackendIp, getApiUrl } from '../../src/config';
import { COLORS, getInitials } from '../../src/config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../../src/services/TranslationService';

// Types
interface Settings {
  general: {
    autoplayVideos: boolean;
    nsfwFilter: boolean;
  };
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    friendRequests: boolean;
    comments: boolean;
    likes: boolean;
    messages: boolean;
    mentions: boolean;
    groupActivities: boolean;
    dailyDigest: 'never' | 'daily' | 'weekly';
  };
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    postVisibility: 'public' | 'friends' | 'only_me';
    showLastSeen: boolean;
    showOnlineStatus: boolean;
    allowFriendRequests: boolean;
    allowMessagesFromNonFriends: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    loginAlerts: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    fontSize: 'small' | 'medium' | 'large';
    language: string;
    compactMode: boolean;
  };
}

// Langues disponibles
const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'mg', label: 'Malagasy', flag: '🇲🇬' },
];

// Thèmes disponibles
const THEMES = [
  { value: 'light', label: 'Clair', icon: 'sunny-outline' },
  { value: 'dark', label: 'Sombre', icon: 'moon-outline' },
  { value: 'system', label: 'Système', icon: 'phone-portrait-outline' },
];

export default function UserSettingsScreen() {
  const { colors, theme, setTheme, isDark } = useTheme();
  const { user, logout, updateProfile } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { t, language, setLanguage } = useTranslation();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [settings, setSettings] = useState<Settings>({
    general: { autoplayVideos: true, nsfwFilter: true },
    notifications: {
      email: true, push: true, sms: false,
      friendRequests: true, comments: true, likes: true,
      messages: true, mentions: true, groupActivities: true,
      dailyDigest: 'daily'
    },
    privacy: {
      profileVisibility: 'friends',
      postVisibility: 'friends',
      showLastSeen: true,
      showOnlineStatus: true,
      allowFriendRequests: true,
      allowMessagesFromNonFriends: false
    },
    security: { twoFactorAuth: false, sessionTimeout: 30, loginAlerts: true },
    appearance: { theme: 'light', fontSize: 'medium', language: 'fr', compactMode: false }
  });

  // État pour le profil
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    bio: '',
  });
  const [editMode, setEditMode] = useState(false);

  // État pour le mot de passe
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // État pour l'IP
  const [showIPConfig, setShowIPConfig] = useState(false);
  const [ipAddress, setIpAddress] = useState('');
  const [currentIp, setCurrentIp] = useState('');

  // Charger les paramètres
  useEffect(() => {
    loadSettings();
    loadCurrentIp();
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        bio: (user as any).bio || '',
      });
    }
  }, [user]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const savedSettings = await getStoredSettings();
      if (savedSettings) {
        setSettings(prev => ({ ...prev, ...savedSettings }));
      }
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentIp = async () => {
    const stored = await getStoredIp();
    const apiUrl = await getApiUrl();
    setCurrentIp(apiUrl);
    if (stored) setIpAddress(stored);
  };

  const getStoredSettings = async (): Promise<Settings | null> => {
    try {
      return null;
    } catch {
      return null;
    }
  };

  const saveSettings = async (newSettings: Settings) => {
    try {
      setSettings(newSettings);
      showSuccess(t('save'));
    } catch (error) {
      showError(t('error'));
    }
  };

  const updateAppearanceSettings = (key: keyof Settings['appearance'], value: any) => {
    const newSettings = { ...settings, appearance: { ...settings.appearance, [key]: value } };
    setSettings(newSettings);
    saveSettings(newSettings);
    if (key === 'theme') {
      setTheme(value as any);
    }
  };

  // 🔥 Changer la langue avec traduction
  const changeLanguage = async (langCode: string) => {
    await setLanguage(langCode);
    updateAppearanceSettings('language', langCode);
    showSuccess(t('success'));
  };

  const changeTheme = (themeValue: 'light' | 'dark' | 'system') => {
    updateAppearanceSettings('theme', themeValue);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email,
        phoneNumber: profileForm.phoneNumber,
      });
      setEditMode(false);
      showSuccess(t('success'));
    } catch (error) {
      showError(t('error'));
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError(t('error'));
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showError(t('error'));
      return;
    }

    setChangingPassword(true);
    try {
      await AuthService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      showSuccess(t('success'));
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      showError(t('error'));
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSaveIp = async () => {
    if (!ipAddress.trim()) {
      showError(t('error'));
      return;
    }
    try {
      await setBackendIp(ipAddress.trim());
      showSuccess(t('success'));
      setShowIPConfig(false);
      loadCurrentIp();
    } catch (error) {
      showError(t('error'));
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('logout'),
      t('confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  // Onglets avec traduction
  const tabs = [
    { label: t('general'), icon: 'settings-outline' },
    { label: t('profile'), icon: 'person-outline' },
    { label: t('security'), icon: 'shield-outline' },
    { label: t('privacy'), icon: 'eye-outline' },
    { label: t('notifications'), icon: 'notifications-outline' },
    { label: t('appearance'), icon: 'color-palette-outline' },
  ];

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('loading')}</Text>
      </View>
    );
  }

  // 🔥 Calcul du padding bottom pour éviter que le contenu soit caché
  const bottomPadding = insets.bottom > 0 ? insets.bottom + 100 : 40;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings')}</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={[styles.content, { backgroundColor: colors.background }]}
        contentContainerStyle={{ 
          paddingBottom: bottomPadding,
          paddingHorizontal: 0,
        }}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Profil utilisateur (carte d'en-tête) */}
        <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
          <View style={styles.profileContent}>
            <View style={[styles.profileAvatar, { backgroundColor: COLORS.primary }]}>
              <Text style={styles.profileAvatarText}>
                {getInitials(user?.firstName, user?.lastName)}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                {user?.email}
              </Text>
              {user?.phoneNumber && (
                <Text style={[styles.profilePhone, { color: colors.textSecondary }]}>
                  {user.phoneNumber}
                </Text>
              )}
              <TouchableOpacity
                style={styles.editProfileBtn}
                onPress={() => setEditMode(!editMode)}
              >
                <Ionicons name="create-outline" size={16} color={COLORS.primary} />
                <Text style={styles.editProfileText}>{editMode ? t('cancel') : t('profile')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Mode édition du profil */}
          {editMode && (
            <View style={styles.editForm}>
              <TextInput
                style={[styles.editInput, { color: colors.text, backgroundColor: colors.background }]}
                placeholder={t('first_name')}
                placeholderTextColor={COLORS.gray400}
                value={profileForm.firstName}
                onChangeText={(v) => setProfileForm({ ...profileForm, firstName: v })}
              />
              <TextInput
                style={[styles.editInput, { color: colors.text, backgroundColor: colors.background }]}
                placeholder={t('last_name')}
                placeholderTextColor={COLORS.gray400}
                value={profileForm.lastName}
                onChangeText={(v) => setProfileForm({ ...profileForm, lastName: v })}
              />
              <TextInput
                style={[styles.editInput, { color: colors.text, backgroundColor: colors.background }]}
                placeholder={t('email')}
                placeholderTextColor={COLORS.gray400}
                value={profileForm.email}
                onChangeText={(v) => setProfileForm({ ...profileForm, email: v })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={[styles.editInput, { color: colors.text, backgroundColor: colors.background }]}
                placeholder={t('phone')}
                placeholderTextColor={COLORS.gray400}
                value={profileForm.phoneNumber}
                onChangeText={(v) => setProfileForm({ ...profileForm, phoneNumber: v })}
                keyboardType="phone-pad"
              />
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={saveProfile}
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
        </View>

        {/* Section IP Config */}
        <TouchableOpacity
          style={[styles.ipToggle, { backgroundColor: colors.card }]}
          onPress={() => setShowIPConfig(!showIPConfig)}
        >
          <View style={styles.ipToggleLeft}>
            <Ionicons name="server-outline" size={20} color={COLORS.primary} />
            <Text style={[styles.ipToggleText, { color: colors.text }]}>Configuration IP</Text>
          </View>
          <Ionicons name={showIPConfig ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.gray400} />
        </TouchableOpacity>

        {showIPConfig && (
          <View style={[styles.ipCard, { backgroundColor: colors.card }]}>
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

        {/* Onglets */}
        <View style={styles.tabsContainer}>
          {tabs.map((tab, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.tabBtn, activeTab === index && styles.tabBtnActive]}
              onPress={() => setActiveTab(index)}
            >
              <Ionicons
                name={tab.icon as any}
                size={18}
                color={activeTab === index ? COLORS.primary : COLORS.gray400}
              />
              <Text style={[
                styles.tabLabel,
                { color: activeTab === index ? COLORS.primary : COLORS.gray400 }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Contenu des onglets */}
        <View style={styles.tabContent}>
          {/* Onglet Général */}
          {activeTab === 0 && (
            <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('general')}</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Préférences de l'application
              </Text>

              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Lecture auto des vidéos</Text>
                <Switch
                  value={settings.general.autoplayVideos}
                  onValueChange={(v) => {
                    const newSettings = { ...settings, general: { ...settings.general, autoplayVideos: v } };
                    setSettings(newSettings);
                    saveSettings(newSettings);
                  }}
                  trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
                />
              </View>

              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Filtrer les contenus sensibles</Text>
                <Switch
                  value={settings.general.nsfwFilter}
                  onValueChange={(v) => {
                    const newSettings = { ...settings, general: { ...settings.general, nsfwFilter: v } };
                    setSettings(newSettings);
                    saveSettings(newSettings);
                  }}
                  trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
                />
              </View>
            </View>
          )}

          {/* Onglet Profil */}
          {activeTab === 1 && (
            <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile')}</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                {t('profile')}
              </Text>
              <TouchableOpacity
                style={styles.editProfileFullBtn}
                onPress={() => setEditMode(!editMode)}
              >
                <Ionicons name="create-outline" size={20} color={COLORS.white} />
                <Text style={styles.editProfileFullText}>
                  {editMode ? t('cancel') : t('profile')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Onglet Sécurité */}
          {activeTab === 2 && (
            <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('security')}</Text>

              <Text style={[styles.subSectionTitle, { color: colors.text }]}>{t('password')}</Text>

              <TextInput
                style={[styles.passwordInput, { color: colors.text, backgroundColor: colors.background }]}
                placeholder={t('current_password')}
                placeholderTextColor={COLORS.gray400}
                secureTextEntry={!showPassword}
                value={passwordForm.currentPassword}
                onChangeText={(v) => setPasswordForm({ ...passwordForm, currentPassword: v })}
              />
              <TextInput
                style={[styles.passwordInput, { color: colors.text, backgroundColor: colors.background }]}
                placeholder={t('new_password')}
                placeholderTextColor={COLORS.gray400}
                secureTextEntry={!showNewPassword}
                value={passwordForm.newPassword}
                onChangeText={(v) => setPasswordForm({ ...passwordForm, newPassword: v })}
              />
              <TextInput
                style={[styles.passwordInput, { color: colors.text, backgroundColor: colors.background }]}
                placeholder={t('confirm_password')}
                placeholderTextColor={COLORS.gray400}
                secureTextEntry={!showConfirmPassword}
                value={passwordForm.confirmPassword}
                onChangeText={(v) => setPasswordForm({ ...passwordForm, confirmPassword: v })}
              />

              <TouchableOpacity
                style={[styles.passwordChangeBtn, changingPassword && styles.saveBtnDisabled]}
                onPress={changePassword}
                disabled={changingPassword}
              >
                {changingPassword ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.passwordChangeText}>{t('change_password')}</Text>
                )}
              </TouchableOpacity>

              <View style={styles.divider} />

              <View style={styles.settingRow}>
                <View>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>{t('two_factor_auth')}</Text>
                  <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                    Sécurisez votre compte avec une double authentification
                  </Text>
                </View>
                <Switch
                  value={settings.security.twoFactorAuth}
                  onValueChange={(v) => {
                    const newSettings = { ...settings, security: { ...settings.security, twoFactorAuth: v } };
                    setSettings(newSettings);
                    saveSettings(newSettings);
                  }}
                  trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
                />
              </View>

              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>{t('login_alerts')}</Text>
                <Switch
                  value={settings.security.loginAlerts}
                  onValueChange={(v) => {
                    const newSettings = { ...settings, security: { ...settings.security, loginAlerts: v } };
                    setSettings(newSettings);
                    saveSettings(newSettings);
                  }}
                  trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
                />
              </View>
            </View>
          )}

          {/* Onglet Confidentialité */}
          {activeTab === 3 && (
            <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('privacy')}</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Qui peut voir votre contenu ?
              </Text>

              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>{t('show_last_seen')}</Text>
                <Switch
                  value={settings.privacy.showLastSeen}
                  onValueChange={(v) => {
                    const newSettings = { ...settings, privacy: { ...settings.privacy, showLastSeen: v } };
                    setSettings(newSettings);
                    saveSettings(newSettings);
                  }}
                  trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
                />
              </View>

              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>{t('show_online_status')}</Text>
                <Switch
                  value={settings.privacy.showOnlineStatus}
                  onValueChange={(v) => {
                    const newSettings = { ...settings, privacy: { ...settings.privacy, showOnlineStatus: v } };
                    setSettings(newSettings);
                    saveSettings(newSettings);
                  }}
                  trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
                />
              </View>

              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>{t('allow_friend_requests')}</Text>
                <Switch
                  value={settings.privacy.allowFriendRequests}
                  onValueChange={(v) => {
                    const newSettings = { ...settings, privacy: { ...settings.privacy, allowFriendRequests: v } };
                    setSettings(newSettings);
                    saveSettings(newSettings);
                  }}
                  trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
                />
              </View>
            </View>
          )}

          {/* Onglet Notifications */}
          {activeTab === 4 && (
            <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('notifications')}</Text>

              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>{t('email_notifications')}</Text>
                <Switch
                  value={settings.notifications.email}
                  onValueChange={(v) => {
                    const newSettings = { ...settings, notifications: { ...settings.notifications, email: v } };
                    setSettings(newSettings);
                    saveSettings(newSettings);
                  }}
                  trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
                />
              </View>

              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>{t('push_notifications')}</Text>
                <Switch
                  value={settings.notifications.push}
                  onValueChange={(v) => {
                    const newSettings = { ...settings, notifications: { ...settings.notifications, push: v } };
                    setSettings(newSettings);
                    saveSettings(newSettings);
                  }}
                  trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
                />
              </View>

              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>{t('sms_notifications')}</Text>
                <Switch
                  value={settings.notifications.sms}
                  onValueChange={(v) => {
                    const newSettings = { ...settings, notifications: { ...settings.notifications, sms: v } };
                    setSettings(newSettings);
                    saveSettings(newSettings);
                  }}
                  trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
                />
              </View>

              <View style={styles.divider} />

              <Text style={[styles.subSectionTitle, { color: colors.text }]}>Types de notifications</Text>

              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>{t('friend_request_notifications')}</Text>
                <Switch
                  value={settings.notifications.friendRequests}
                  onValueChange={(v) => {
                    const newSettings = { ...settings, notifications: { ...settings.notifications, friendRequests: v } };
                    setSettings(newSettings);
                    saveSettings(newSettings);
                  }}
                  trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
                />
              </View>

              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>{t('message_notifications')}</Text>
                <Switch
                  value={settings.notifications.messages}
                  onValueChange={(v) => {
                    const newSettings = { ...settings, notifications: { ...settings.notifications, messages: v } };
                    setSettings(newSettings);
                    saveSettings(newSettings);
                  }}
                  trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
                />
              </View>
            </View>
          )}

          {/* Onglet Apparence - Changement de thème et langue */}
          {activeTab === 5 && (
            <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('appearance')}</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Personnalisez l'apparence de l'application
              </Text>

              {/* Changement de Langue */}
              <Text style={[styles.subSectionTitle, { color: colors.text, marginTop: 12 }]}>
                {t('language')}
              </Text>
              <View style={styles.languageContainer}>
                {LANGUAGES.map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.languageBtn,
                      settings.appearance.language === lang.code && styles.languageBtnActive,
                      { borderColor: settings.appearance.language === lang.code ? COLORS.primary : COLORS.gray200 }
                    ]}
                    onPress={() => changeLanguage(lang.code)}
                  >
                    <Text style={styles.languageFlag}>{lang.flag}</Text>
                    <Text style={[
                      styles.languageLabel,
                      { color: settings.appearance.language === lang.code ? COLORS.primary : colors.text }
                    ]}>
                      {lang.label}
                    </Text>
                    {settings.appearance.language === lang.code && (
                      <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.divider} />

              {/* Changement de Thème */}
              <Text style={[styles.subSectionTitle, { color: colors.text }]}>
                {t('theme')}
              </Text>
              <View style={styles.themeContainer}>
                {THEMES.map((t) => (
                  <TouchableOpacity
                    key={t.value}
                    style={[
                      styles.themeBtn,
                      settings.appearance.theme === t.value && styles.themeBtnActive,
                      { 
                        backgroundColor: settings.appearance.theme === t.value 
                          ? COLORS.primary + '20' 
                          : colors.background 
                      }
                    ]}
                    onPress={() => changeTheme(t.value as any)}
                  >
                    <Ionicons 
                      name={t.icon as any} 
                      size={24} 
                      color={settings.appearance.theme === t.value ? COLORS.primary : colors.text} 
                    />
                    <Text style={[
                      styles.themeLabel,
                      { color: settings.appearance.theme === t.value ? COLORS.primary : colors.text }
                    ]}>
                      {t.label}
                    </Text>
                    {settings.appearance.theme === t.value && (
                      <View style={styles.themeActiveDot} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.divider} />

              {/* Mode compact */}
              <View style={styles.settingRow}>
                <View>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>{t('compact_mode')}</Text>
                  <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                    Afficher plus d'informations en réduisant les espacements
                  </Text>
                </View>
                <Switch
                  value={settings.appearance.compactMode}
                  onValueChange={(v) => {
                    const newSettings = { ...settings, appearance: { ...settings.appearance, compactMode: v } };
                    setSettings(newSettings);
                    saveSettings(newSettings);
                  }}
                  trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
                />
              </View>

              <View style={styles.settingRow}>
                <View>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>{t('font_size')}</Text>
                  <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                    Ajustez la taille du texte
                  </Text>
                </View>
                <View style={styles.fontSizeContainer}>
                  {['small', 'medium', 'large'].map((size) => (
                    <TouchableOpacity
                      key={size}
                      style={[
                        styles.fontSizeBtn,
                        settings.appearance.fontSize === size && styles.fontSizeBtnActive
                      ]}
                      onPress={() => {
                        const newSettings = { 
                          ...settings, 
                          appearance: { ...settings.appearance, fontSize: size as any } 
                        };
                        setSettings(newSettings);
                        saveSettings(newSettings);
                      }}
                    >
                      <Text style={[
                        styles.fontSizeLabel,
                        { 
                          fontSize: size === 'small' ? 12 : size === 'medium' ? 16 : 20,
                          color: settings.appearance.fontSize === size ? COLORS.primary : colors.text
                        }
                      ]}>
                        {size === 'small' ? 'A' : size === 'medium' ? 'A' : 'A'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* 🔥 GRAND ESPACE EN BAS POUR QUE LES BOUTONS NE SOIENT PAS CACHÉS */}
        <View style={{ height: bottomPadding }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  loadingText: { marginTop: 12, fontSize: 14 },
  content: { flex: 1 },

  // ── PROFIL ──
  profileCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  profileContent: { flexDirection: 'row', alignItems: 'center' },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: { color: COLORS.white, fontWeight: 'bold', fontSize: 22 },
  profileInfo: { marginLeft: 12, flex: 1 },
  profileName: { fontSize: 17, fontWeight: 'bold' },
  profileEmail: { fontSize: 13, marginTop: 2 },
  profilePhone: { fontSize: 13, marginTop: 1 },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  editProfileText: { color: COLORS.primary, fontSize: 13, fontWeight: '500' },
  editForm: { marginTop: 12 },
  editInput: {
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: COLORS.white, fontWeight: '600', fontSize: 15 },

  // ── IP CONFIG ──
  ipToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
  },
  ipToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ipToggleText: { fontSize: 14, fontWeight: '500' },
  ipCard: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
  },
  ipCurrent: { fontSize: 13, marginBottom: 8 },
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

  // ── TABS ──
  tabsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 16,
    marginTop: 16,
    gap: 4,
    backgroundColor: COLORS.gray100,
    borderRadius: 12,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  tabBtnActive: { backgroundColor: COLORS.white },
  tabLabel: { fontSize: 11, fontWeight: '500' },

  tabContent: { paddingHorizontal: 16, paddingTop: 12 },

  // ── SETTINGS CARDS ──
  settingsCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, marginBottom: 16 },
  subSectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 12 },

  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  settingLabel: { fontSize: 14, fontWeight: '500', flex: 1 },
  settingDesc: { fontSize: 12, marginTop: 2, color: COLORS.gray500 },

  divider: { height: 1, backgroundColor: COLORS.gray200, marginVertical: 12 },

  // ── PASSWORD ──
  passwordInput: {
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  passwordChangeBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  passwordChangeText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },

  editProfileFullBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  editProfileFullText: { color: COLORS.white, fontWeight: '600', fontSize: 15 },

  // ── LANGUE ──
  languageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  languageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
    flex: 1,
    minWidth: '30%',
    justifyContent: 'center',
  },
  languageBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  languageFlag: { fontSize: 20 },
  languageLabel: { fontSize: 14, fontWeight: '500' },

  // ── THÈME ──
  themeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  themeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 4,
  },
  themeBtnActive: {
    borderColor: COLORS.primary,
  },
  themeLabel: { fontSize: 13, fontWeight: '500', marginTop: 4 },
  themeActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 4,
  },

  // ── TAILLE DE POLICE ──
  fontSizeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  fontSizeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  fontSizeBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  fontSizeLabel: {
    fontWeight: '600',
  },
});