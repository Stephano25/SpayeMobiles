import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { COLORS, formatAmount, getInitials } from '../../src/config';
import { User } from '../../src/types';
import { SafeScreen } from '../../src/components/SafeScreen';
import { useTranslation } from '../../src/services/TranslationService';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, updateProfile, logout } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { t } = useTranslation();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Partial<User>>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
  });
  const [loading, setLoading] = useState(false);

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

  return (
    <SafeScreen backgroundColor={colors.background}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile')}</Text>
        <TouchableOpacity onPress={() => setEditMode(!editMode)}>
          <Ionicons name={editMode ? 'close' : 'create-outline'} size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>
          {getInitials(user?.firstName || '', user?.lastName || '')}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {editMode ? (
          <>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={form.firstName}
              onChangeText={(t) => setForm({ ...form, firstName: t })}
              placeholder={t('first_name')}
              placeholderTextColor={COLORS.gray400}
            />
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={form.lastName}
              onChangeText={(t) => setForm({ ...form, lastName: t })}
              placeholder={t('last_name')}
              placeholderTextColor={COLORS.gray400}
            />
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={form.email}
              onChangeText={(t) => setForm({ ...form, email: t })}
              placeholder={t('email')}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={COLORS.gray400}
            />
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={form.phoneNumber}
              onChangeText={(t) => setForm({ ...form, phoneNumber: t })}
              placeholder={t('phone')}
              keyboardType="phone-pad"
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
              <Text style={[styles.value, { color: colors.text }]}>{user?.firstName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.text }]}>{t('last_name')} :</Text>
              <Text style={[styles.value, { color: colors.text }]}>{user?.lastName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.text }]}>{t('email')} :</Text>
              <Text style={[styles.value, { color: colors.text }]}>{user?.email}</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.text }]}>{t('phone')} :</Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {user?.phoneNumber || t('not_specified')}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.text }]}>{t('balance')} :</Text>
              <Text style={[styles.value, { color: COLORS.primary, fontWeight: 'bold' }]}>
                {formatAmount(user?.balance || 0)} Ar
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.text }]}>QR Code :</Text>
              <Text style={[styles.value, { color: colors.text }]}>{user?.qrCode}</Text>
            </View>
          </>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
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
    marginBottom: 10,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  avatarContainer: {
    alignSelf: 'center',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
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
  saveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  logoutButton: {
    backgroundColor: COLORS.error,
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});