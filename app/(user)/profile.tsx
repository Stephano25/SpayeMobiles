// app/(user)/profile.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { COLORS, formatAmount, getInitials, getAvatarColor } from '../../src/config/colors';
import { SafeScreen } from '../../src/components/SafeScreen';
import { useTranslation } from '../../src/services/TranslationService';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, updateProfile, logout } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    bio: user?.bio || '',
  });
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      await updateProfile(form);
      setEditMode(false);
      showSuccess(t('success'));
    } catch (error) {
      showError(t('error'));
    } finally {
      setLoading(false);
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

  const avatarGradient = getAvatarColor((user?.firstName || '') + (user?.lastName || ''));

  return (
    <SafeScreen backgroundColor={colors.background}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile')}</Text>
        <TouchableOpacity onPress={() => setEditMode(!editMode)}>
          <Ionicons name={editMode ? 'close' : 'create-outline'} size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.avatarContainer}>
        {user?.profilePicture && !imageError ? (
          <Image
            source={{ uri: user.profilePicture }}
            style={styles.avatar}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: avatarGradient }]}>
            <Text style={styles.avatarText}>{getInitials(user?.firstName, user?.lastName)}</Text>
          </View>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {editMode ? (
          <>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={form.firstName}
              onChangeText={(text) => setForm({ ...form, firstName: text })}
              placeholder={t('first_name')}
              placeholderTextColor={COLORS.gray400}
            />
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={form.lastName}
              onChangeText={(text) => setForm({ ...form, lastName: text })}
              placeholder={t('last_name')}
              placeholderTextColor={COLORS.gray400}
            />
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
              placeholder={t('email')}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={COLORS.gray400}
            />
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={form.phoneNumber}
              onChangeText={(text) => setForm({ ...form, phoneNumber: text })}
              placeholder={t('phone')}
              keyboardType="phone-pad"
              placeholderTextColor={COLORS.gray400}
            />
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={form.bio}
              onChangeText={(text) => setForm({ ...form, bio: text })}
              placeholder={t('bio')}
              multiline
              numberOfLines={3}
              placeholderTextColor={COLORS.gray400}
            />
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveBtnDisabled]}
              onPress={save}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.saveButtonText}>{t('save')}</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.text }]}>{t('first_name')} :</Text>
              <Text style={[styles.value, { color: colors.text }]}>{user?.firstName || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.text }]}>{t('last_name')} :</Text>
              <Text style={[styles.value, { color: colors.text }]}>{user?.lastName || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.text }]}>{t('email')} :</Text>
              <Text style={[styles.value, { color: colors.text }]}>{user?.email || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.text }]}>{t('phone')} :</Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {user?.phoneNumber || t('not_specified')}
              </Text>
            </View>
            {user?.bio && (
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.text }]}>{t('bio')} :</Text>
                <Text style={[styles.value, { color: colors.text }]}>{user.bio}</Text>
              </View>
            )}
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.text }]}>{t('balance')} :</Text>
              <Text style={[styles.value, { color: COLORS.primary, fontWeight: 'bold' }]}>
                {formatAmount(user?.balance || 0)} Ar
              </Text>
            </View>
            {user?.qrCode && (
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.text }]}>QR Code :</Text>
                <Text style={[styles.value, { color: colors.text }]}>{user.qrCode}</Text>
              </View>
            )}
          </>
        )}
      </View>

      <TouchableOpacity style={[styles.logoutButton, { backgroundColor: COLORS.error }]} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
        <Text style={styles.logoutText}>{t('logout')}</Text>
      </TouchableOpacity>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: COLORS.white },
  card: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray200,
  },
  label: { fontSize: 15, fontWeight: '600' },
  value: { fontSize: 15, textAlign: 'right', flex: 1, marginLeft: 10 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
  logoutButton: {
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
});