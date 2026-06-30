import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { COLORS, getInitials } from '../../src/config';
import { User } from '../../src/types';

export default function AdminProfileScreen() {
  const { colors } = useTheme();
  const { user, updateProfile, logout } = useAuth();
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
      Alert.alert('Succès', 'Profil administrateur mis à jour');
    } catch (error) {
      Alert.alert('Erreur', 'Mise à jour échouée');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil Administrateur</Text>
        <TouchableOpacity onPress={() => setEditMode(!editMode)}>
          <Text style={styles.editButton}>{editMode ? 'Annuler' : '✏️'}</Text>
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
              style={styles.input}
              value={form.firstName}
              onChangeText={(t) => setForm({ ...form, firstName: t })}
              placeholder="Prénom"
            />
            <TextInput
              style={styles.input}
              value={form.lastName}
              onChangeText={(t) => setForm({ ...form, lastName: t })}
              placeholder="Nom"
            />
            <TextInput
              style={styles.input}
              value={form.email}
              onChangeText={(t) => setForm({ ...form, email: t })}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              value={form.phoneNumber}
              onChangeText={(t) => setForm({ ...form, phoneNumber: t })}
              placeholder="Téléphone"
              keyboardType="phone-pad"
            />
            <TouchableOpacity style={styles.saveButton} onPress={save} disabled={loading}>
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.row}>
              <Text style={styles.label}>Prénom :</Text> {user?.firstName}
            </Text>
            <Text style={styles.row}>
              <Text style={styles.label}>Nom :</Text> {user?.lastName}
            </Text>
            <Text style={styles.row}>
              <Text style={styles.label}>Email :</Text> {user?.email}
            </Text>
            <Text style={styles.row}>
              <Text style={styles.label}>Téléphone :</Text> {user?.phoneNumber || 'Non renseigné'}
            </Text>
            <Text style={styles.row}>
              <Text style={styles.label}>Rôle :</Text>{' '}
              {user?.role === 'super_admin' ? 'Super Administrateur' : 'Administrateur'}
            </Text>
          </>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
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
  backText: { fontSize: 24, color: COLORS.white },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  editButton: { fontSize: 20, color: COLORS.white },
  avatarContainer: {
    alignSelf: 'center',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -30,
    marginBottom: 20,
  },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: COLORS.white },
  card: { marginHorizontal: 20, padding: 20, borderRadius: 16, marginBottom: 20 },
  row: { fontSize: 16, marginVertical: 8 },
  label: { fontWeight: 'bold' },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  saveButton: { backgroundColor: COLORS.primary, padding: 14, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { color: 'white', fontWeight: 'bold' },
  logoutButton: {
    backgroundColor: COLORS.error,
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40,
  },
  logoutText: { color: 'white', fontWeight: 'bold' },
});