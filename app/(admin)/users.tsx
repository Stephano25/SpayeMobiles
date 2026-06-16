import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { AdminService } from '../../src/services/AdminService';
import { COLORS, formatAmount, getInitials } from '../../src/config';
import { router } from 'expo-router';

export default function AdminUsersScreen() {
  const { colors } = useTheme();
  const { showSuccess, showError } = useNotification();
  const [users, setUsers] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await AdminService.getAllUsers();
      setUsers(data);
    } catch (error) {
      showError('Erreur chargement');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const toggleStatus = async (userId: string, current: boolean) => {
    try {
      await AdminService.updateUserStatus(userId, !current);
      showSuccess(`Utilisateur ${!current ? 'activé' : 'désactivé'}`);
      load();
    } catch (error) {
      showError('Erreur');
    }
  };

  const deleteUser = (userId: string, name: string) => {
    Alert.alert('Supprimer', `Supprimer ${name} ?`, [
      { text: 'Annuler' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await AdminService.deleteUser(userId);
          showSuccess('Supprimé');
          load();
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Utilisateurs</Text>
        <View style={{ width: 40 }} />
      </View>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={[styles.userCard, { backgroundColor: colors.card }]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(item.firstName, item.lastName)}
              </Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>
                {item.firstName} {item.lastName}
              </Text>
              <Text>{item.email}</Text>
              <Text>Solde : {formatAmount(item.balance)} Ar</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => toggleStatus(item.id, item.isActive)}
                style={[
                  styles.statusBtn,
                  item.isActive ? styles.activeBtn : styles.inactiveBtn,
                ]}
              >
                <Text style={styles.statusText}>
                  {item.isActive ? 'Actif' : 'Inactif'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteUser(item.id, item.firstName)}>
                <Text style={styles.deleteBtn}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
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
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backText: { fontSize: 24, color: COLORS.white },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  userCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  info: { flex: 1 },
  name: { fontWeight: 'bold', fontSize: 16 },
  actions: { alignItems: 'flex-end', gap: 8 },
  statusBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  activeBtn: { backgroundColor: COLORS.success },
  inactiveBtn: { backgroundColor: COLORS.warning },
  statusText: { color: 'white', fontSize: 12 },
  deleteBtn: { fontSize: 20, color: COLORS.error, marginTop: 6 },
});