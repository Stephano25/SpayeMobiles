// app/(user)/settings.tsx
// ─────────────────────────────────────────────────────────────
//  SPAYE · User Settings — Version corrigée
//  ✅ Traduction complète avec useTranslation
// ─────────────────────────────────────────────────────────────

import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useNotification } from '../../src/context/NotificationContext';
import { COLORS, getInitials, getAvatarColor } from '../../src/config/colors';
import { useTranslation } from '../../src/services/TranslationService';
import { SafeScreen } from '../../src/components/SafeScreen';

const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'mg', label: 'Malagasy', flag: '🇲🇬' },
];

const THEMES = [
  { value: 'light', icon: 'sunny-outline' },
  { value: 'dark', icon: 'moon-outline' },
  { value: 'system', icon: 'phone-portrait-outline' },
];

export default function UserSettingsScreen() {
  const { colors, theme, setTheme } = useTheme();
  const { user, logout, updateProfile } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { t, language, setLanguage } = useTranslation();
  const navigation = useNavigation();

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    bio: user?.bio || '',
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

  const changeLanguage = async (lang: string) => {
    await setLanguage(lang);
    showSuccess(t('success'));
  };

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

  return (
    <SafeScreen backgroundColor={colors.background}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings')}</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={[styles.content, { backgroundColor: colors.background }]}>
        <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: avatarGradient }]}>
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

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('profile')}</Text>
          {editMode ? (
            <>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                value={profileForm.firstName}
                onChangeText={v => setProfileForm({ ...profileForm, firstName: v })}
                placeholder={t('first_name')}
                placeholderTextColor={COLORS.gray400}
              />
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                value={profileForm.lastName}
                onChangeText={v => setProfileForm({ ...profileForm, lastName: v })}
                placeholder={t('last_name')}
                placeholderTextColor={COLORS.gray400}
              />
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                value={profileForm.email}
                onChangeText={v => setProfileForm({ ...profileForm, email: v })}
                placeholder={t('email')}
                placeholderTextColor={COLORS.gray400}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                value={profileForm.phoneNumber}
                onChangeText={v => setProfileForm({ ...profileForm, phoneNumber: v })}
                placeholder={t('phone')}
                placeholderTextColor={COLORS.gray400}
                keyboardType="phone-pad"
              />
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                value={profileForm.bio}
                onChangeText={v => setProfileForm({ ...profileForm, bio: v })}
                placeholder={t('bio')}
                placeholderTextColor={COLORS.gray400}
                multiline
                numberOfLines={3}
              />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                <TouchableOpacity
                  style={[styles.btn, { flex: 1, backgroundColor: colors.background }]}
                  onPress={() => setEditMode(false)}
                >
                  <Text style={{ color: colors.text, fontWeight: '600' }}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, { flex: 1, backgroundColor: COLORS.primary }]}
                  onPress={saveProfile}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={{ color: '#fff', fontWeight: '600' }}>{t('save')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: COLORS.primary }]}
              onPress={() => setEditMode(true)}
            >
              <Ionicons name="create-outline" size={16} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '600' }}>{t('edit_profile')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('language')}</Text>
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
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('theme')}</Text>
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

        <View style={[styles.card, { backgroundColor: colors.card }]}>
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

        <View style={[styles.card, { backgroundColor: colors.card }]}>
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

        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: COLORS.error }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>{t('logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  content: { flex: 1, paddingHorizontal: 16, paddingBottom: 40 },
  profileCard: { marginTop: 16, padding: 16, borderRadius: 20 },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  profileName: { fontSize: 16, fontWeight: '700' },
  profileEmail: { fontSize: 13, marginTop: 2 },
  card: { marginTop: 16, padding: 16, borderRadius: 20 },
  cardTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 16, opacity: 0.5 },
  input: { borderRadius: 12, padding: 12, marginBottom: 10, fontSize: 15, borderWidth: 1, borderColor: COLORS.gray200 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 8, marginTop: 4 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: COLORS.gray100 },
  settingLabel: { fontSize: 14, fontWeight: '500', flex: 1 },
  langRow: { gap: 8 },
  langBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.gray200 },
  langFlag: { fontSize: 20 },
  langLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  themeRow: { flexDirection: 'row', gap: 8 },
  themeBtn: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: 'transparent', gap: 6 },
  themeLabel: { fontSize: 12, fontWeight: '600' },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    padding: 15,
    borderRadius: 16,
  },
  logoutText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});