// app/(admin)/profile.tsx
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
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { COLORS, getInitials } from '../../src/config';
import { useNotification } from '../../src/context/NotificationContext';
import { User } from '../../src/types';

export default function AdminProfileScreen() {
  const { colors } = useTheme();
  const { user, updateProfile, logout } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigation = useNavigation();
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
      showSuccess('Profil administrateur mis à jour');
    } catch (error) {
      showError('Mise à jour échouée');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', style: 'destructive', onPress: logout }
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil Administrateur</Text>
        <TouchableOpacity onPress={() => setEditMode(!editMode)}>
          <Ionicons name={editMode ? 'close' : 'create-outline'} size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.avatarContainer}>
        <View style={[styles.avatarPlaceholder, { backgroundColor: COLORS.primary }]}>
          <Text style={styles.avatarText}>
            {getInitials(user?.firstName || '', user?.lastName || '')}
          </Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {editMode ? (
          <>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={form.firstName}
              onChangeText={(t) => setForm({ ...form, firstName: t })}
              placeholder="Prénom"
              placeholderTextColor={COLORS.gray400}
            />
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={form.lastName}
              onChangeText={(t) => setForm({ ...form, lastName: t })}
              placeholder="Nom"
              placeholderTextColor={COLORS.gray400}
            />
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={form.email}
              onChangeText={(t) => setForm({ ...form, email: t })}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={COLORS.gray400}
            />
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={form.phoneNumber}
              onChangeText={(t) => setForm({ ...form, phoneNumber: t })}
              placeholder="Téléphone"
              keyboardType="phone-pad"
              placeholderTextColor={COLORS.gray400}
            />
            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: COLORS.primary }]} 
              onPress={save} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.text }]}>Prénom :</Text>
              <Text style={[styles.value, { color: colors.text }]}>{user?.firstName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.text }]}>Nom :</Text>
              <Text style={[styles.value, { color: colors.text }]}>{user?.lastName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.text }]}>Email :</Text>
              <Text style={[styles.value, { color: colors.text }]}>{user?.email}</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.text }]}>Téléphone :</Text>
              <Text style={[styles.value, { color: colors.text }]}>{user?.phoneNumber || 'Non renseigné'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.text }]}>Rôle :</Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {user?.role === 'super_admin' ? 'Super Administrateur' : 'Administrateur'}
              </Text>
            </View>
          </>
        )}
      </View>

      <TouchableOpacity style={[styles.logoutButton, { backgroundColor: COLORS.error }]} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>
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
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white, flex: 1, marginLeft: 8 },
  avatarContainer: {
    alignSelf: 'center',
    marginTop: -30,
    marginBottom: 20,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: COLORS.white },
  card: { marginHorizontal: 20, padding: 20, borderRadius: 16, marginBottom: 20 },
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
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
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