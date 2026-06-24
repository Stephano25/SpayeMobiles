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

const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'mg', label: 'Malagasy', flag: '🇲🇬' },
];

const THEMES = [
  { value: 'light' as const, icon: 'sunny-outline' },
  { value: 'dark' as const, icon: 'moon-outline' },
  { value: 'system' as const, icon: 'phone-portrait-outline' },
];

export default function UserSettingsScreen() {
  const { colors, theme, setTheme, isDark } = useTheme();
  const { user, logout, updateProfile } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { t, language, setLanguage } = useTranslation();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showIPConfig, setShowIPConfig] = useState(false);
  const [ipAddress, setIpAddress] = useState('');
  const [currentIp, setCurrentIp] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [notifSettings, setNotifSettings] = useState({
    email: true,
    push: true,
    sms: false,
    friendRequests: true,
    messages: true,
  });
  const [privacySettings, setPrivacySettings] = useState({
    showLastSeen: true,
    showOnlineStatus: true,
    allowFriendRequests: true,
  });
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    loginAlerts: true,
  });

  useEffect(() => {
    loadIp();
  }, []);

  const loadIp = async () => {
    const stored = await getStoredIp();
    const apiUrl = await getApiUrl();
    setCurrentIp(apiUrl);
    if (stored) setIpAddress(stored);
  };

  const changeLanguage = async (lang: string) => {
    await setLanguage(lang);
    showSuccess(t('success'));
  };

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
    } catch {
      showError(t('error'));
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSaveIp = async () => {
    if (!ipAddress.trim()) return;
    try {
      await setBackendIp(ipAddress.trim());
      showSuccess(t('success'));
      setShowIPConfig(false);
      loadIp();
    } catch {
      showError(t('error'));
    }
  };

  const handleLogout = () => {
    Alert.alert(t('logout'), t('confirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('logout'), style: 'destructive', onPress: async () => { await logout(); } },
    ]);
  };

  const tabs = [
    { label: t('general'), icon: 'settings-outline' },
    { label: t('profile'), icon: 'person-outline' },
    { label: t('security'), icon: 'shield-outline' },
    { label: t('privacy'), icon: 'eye-outline' },
    { label: t('notifications'), icon: 'notifications-outline' },
    { label: t('appearance'), icon: 'color-palette-outline' },
  ];

  const bottomPadding = insets.bottom > 0 ? insets.bottom + 100 : 40;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings')}</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: COLORS.primary }]}>
              <Text style={styles.avatarText}>{getInitials(user?.firstName, user?.lastName)}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* IP Config Toggle */}
        <TouchableOpacity
          style={[styles.ipToggle, { backgroundColor: colors.card }]}
          onPress={() => setShowIPConfig(!showIPConfig)}
        >
          <View style={styles.ipLeft}>
            <Ionicons name="server-outline" size={18} color={COLORS.primary} />
            <Text style={[styles.ipLabel, { color: colors.text }]}>Config IP</Text>
            <Text style={[styles.ipCurrent, { color: colors.textSecondary }]} numberOfLines={1}>
              {currentIp || '—'}
            </Text>
          </View>
          <Ionicons name={showIPConfig ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.gray400} />
        </TouchableOpacity>

        {showIPConfig && (
          <View style={[styles.ipCard, { backgroundColor: colors.card }]}>
            <View style={styles.ipRow}>
              <TextInput
                style={[styles.ipInput, { color: colors.text, backgroundColor: colors.background }]}
                placeholder="192.168.x.x"
                placeholderTextColor={COLORS.gray400}
                value={ipAddress}
                onChangeText={setIpAddress}
                keyboardType="numeric"
              />
              <TouchableOpacity style={styles.ipSaveBtn} onPress={handleSaveIp}>
                <Text style={styles.ipSaveTxt}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {tabs.map((tab, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.tab, activeTab === i && styles.tabActive]}
              onPress={() => setActiveTab(i)}
            >
              <Ionicons name={tab.icon as any} size={14} color={activeTab === i ? COLORS.primary : COLORS.gray400} />
              <Text style={[styles.tabLabel, { color: activeTab === i ? COLORS.primary : COLORS.gray400 }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tab Content */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {/* General */}
          {activeTab === 0 && (
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t('general')}</Text>
              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Lecture auto vidéos</Text>
                <Switch value={true} trackColor={{ false: COLORS.gray300, true: COLORS.primary }} thumbColor={COLORS.white} />
              </View>
            </View>
          )}

          {/* Profile */}
          {activeTab === 1 && (
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t('profile')}</Text>
              {editMode ? (
                <>
                  <TextInput style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                    value={profileForm.firstName} onChangeText={v => setProfileForm({ ...profileForm, firstName: v })}
                    placeholder={t('first_name')} placeholderTextColor={COLORS.gray400} />
                  <TextInput style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                    value={profileForm.lastName} onChangeText={v => setProfileForm({ ...profileForm, lastName: v })}
                    placeholder={t('last_name')} placeholderTextColor={COLORS.gray400} />
                  <TextInput style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                    value={profileForm.email} onChangeText={v => setProfileForm({ ...profileForm, email: v })}
                    placeholder={t('email')} placeholderTextColor={COLORS.gray400} keyboardType="email-address" autoCapitalize="none" />
                  <TextInput style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                    value={profileForm.phoneNumber} onChangeText={v => setProfileForm({ ...profileForm, phoneNumber: v })}
                    placeholder={t('phone')} placeholderTextColor={COLORS.gray400} keyboardType="phone-pad" />
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                    <TouchableOpacity style={[styles.btn, { flex: 1, backgroundColor: colors.background }]} onPress={() => setEditMode(false)}>
                      <Text style={{ color: colors.text, fontWeight: '600' }}>{t('cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, { flex: 1, backgroundColor: COLORS.primary }]} onPress={saveProfile} disabled={saving}>
                      {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>{t('save')}</Text>}
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <TouchableOpacity style={[styles.btn, { backgroundColor: COLORS.primary }]} onPress={() => setEditMode(true)}>
                  <Ionicons name="create-outline" size={16} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '600' }}>{t('profile')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Security */}
          {activeTab === 2 && (
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t('security')}</Text>
              <Text style={[styles.subTitle, { color: colors.textSecondary }]}>{t('change_password')}</Text>
              <TextInput style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                value={passwordForm.currentPassword} onChangeText={v => setPasswordForm({ ...passwordForm, currentPassword: v })}
                placeholder={t('current_password')} placeholderTextColor={COLORS.gray400} secureTextEntry />
              <TextInput style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                value={passwordForm.newPassword} onChangeText={v => setPasswordForm({ ...passwordForm, newPassword: v })}
                placeholder={t('new_password')} placeholderTextColor={COLORS.gray400} secureTextEntry />
              <TextInput style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                value={passwordForm.confirmPassword} onChangeText={v => setPasswordForm({ ...passwordForm, confirmPassword: v })}
                placeholder={t('confirm_password')} placeholderTextColor={COLORS.gray400} secureTextEntry />
              <TouchableOpacity style={[styles.btn, { backgroundColor: COLORS.primary }]} onPress={changePassword} disabled={changingPassword}>
                {changingPassword ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>{t('change_password')}</Text>}
              </TouchableOpacity>
              <View style={styles.divider} />
              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>{t('two_factor_auth')}</Text>
                <Switch value={securitySettings.twoFactorAuth}
                  onValueChange={v => setSecuritySettings({ ...securitySettings, twoFactorAuth: v })}
                  trackColor={{ false: COLORS.gray300, true: COLORS.primary }} thumbColor={COLORS.white} />
              </View>
              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>{t('login_alerts')}</Text>
                <Switch value={securitySettings.loginAlerts}
                  onValueChange={v => setSecuritySettings({ ...securitySettings, loginAlerts: v })}
                  trackColor={{ false: COLORS.gray300, true: COLORS.primary }} thumbColor={COLORS.white} />
              </View>
            </View>
          )}

          {/* Privacy */}
          {activeTab === 3 && (
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t('privacy')}</Text>
              {[
                { key: 'showLastSeen', label: t('show_last_seen') },
                { key: 'showOnlineStatus', label: t('show_online_status') },
                { key: 'allowFriendRequests', label: t('allow_friend_requests') },
              ].map(item => (
                <View key={item.key} style={styles.settingRow}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>{item.label}</Text>
                  <Switch
                    value={(privacySettings as any)[item.key]}
                    onValueChange={v => setPrivacySettings({ ...privacySettings, [item.key]: v })}
                    trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
                    thumbColor={COLORS.white}
                  />
                </View>
              ))}
            </View>
          )}

          {/* Notifications */}
          {activeTab === 4 && (
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t('notifications')}</Text>
              {[
                { key: 'email', label: t('email_notifications') },
                { key: 'push', label: t('push_notifications') },
                { key: 'sms', label: t('sms_notifications') },
                { key: 'friendRequests', label: t('friend_request_notifications') },
                { key: 'messages', label: t('message_notifications') },
              ].map(item => (
                <View key={item.key} style={styles.settingRow}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>{item.label}</Text>
                  <Switch
                    value={(notifSettings as any)[item.key]}
                    onValueChange={v => setNotifSettings({ ...notifSettings, [item.key]: v })}
                    trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
                    thumbColor={COLORS.white}
                  />
                </View>
              ))}
            </View>
          )}

          {/* Appearance */}
          {activeTab === 5 && (
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t('appearance')}</Text>

              {/* Language */}
              <Text style={[styles.subTitle, { color: colors.textSecondary }]}>{t('language')}</Text>
              <View style={styles.langRow}>
                {LANGUAGES.map(lang => (
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

              <View style={styles.divider} />

              {/* Theme */}
              <Text style={[styles.subTitle, { color: colors.textSecondary }]}>{t('theme')}</Text>
              <View style={styles.themeRow}>
                {THEMES.map(th => (
                  <TouchableOpacity
                    key={th.value}
                    style={[
                      styles.themeBtn,
                      { backgroundColor: theme === th.value ? COLORS.primary + '18' : colors.background },
                      theme === th.value && { borderColor: COLORS.primary },
                    ]}
                    onPress={() => setTheme(th.value)}
                  >
                    <Ionicons name={th.icon as any} size={22} color={theme === th.value ? COLORS.primary : colors.textSecondary} />
                    <Text style={[styles.themeLabel, { color: theme === th.value ? COLORS.primary : colors.textSecondary }]}>
                      {t(th.value)}
                    </Text>
                    {theme === th.value && <View style={styles.activeDot} />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>{t('logout')}</Text>
        </TouchableOpacity>
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
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  content: { flex: 1 },
  profileCard: { margin: 16, padding: 16, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  profileName: { fontSize: 16, fontWeight: '700' },
  profileEmail: { fontSize: 13, marginTop: 2 },
  ipToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, padding: 14, borderRadius: 14, marginBottom: 4,
  },
  ipLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  ipLabel: { fontSize: 14, fontWeight: '600' },
  ipCurrent: { fontSize: 12, flex: 1 },
  ipCard: { marginHorizontal: 16, marginBottom: 8, padding: 14, borderRadius: 14 },
  ipRow: { flexDirection: 'row', gap: 8 },
  ipInput: { flex: 1, padding: 10, borderRadius: 10, fontSize: 14, borderWidth: 1, borderColor: COLORS.gray200 },
  ipSaveBtn: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: COLORS.primary, borderRadius: 10, justifyContent: 'center' },
  ipSaveTxt: { color: '#fff', fontWeight: '700' },
  tabsScroll: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 20, backgroundColor: COLORS.gray100,
  },
  tabActive: { backgroundColor: COLORS.primary + '18' },
  tabLabel: { fontSize: 12, fontWeight: '600' },
  card: { marginHorizontal: 16, marginTop: 8, padding: 20, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 16, opacity: 0.5 },
  subTitle: { fontSize: 13, fontWeight: '600', marginBottom: 10, marginTop: 4 },
  input: { borderRadius: 12, padding: 12, marginBottom: 10, fontSize: 15, borderWidth: 1, borderColor: COLORS.gray200 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 8, marginTop: 4 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: COLORS.gray100 },
  settingLabel: { fontSize: 14, fontWeight: '500', flex: 1 },
  divider: { height: 1, backgroundColor: COLORS.gray100, marginVertical: 16 },
  langRow: { gap: 8 },
  langBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.gray200,
  },
  langFlag: { fontSize: 20 },
  langLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  themeRow: { flexDirection: 'row', gap: 8 },
  themeBtn: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: 'transparent', gap: 6 },
  themeLabel: { fontSize: 12, fontWeight: '600' },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.error, marginHorizontal: 16, padding: 15, borderRadius: 16,
    marginTop: 16, marginBottom: 8,
  },
  logoutText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});