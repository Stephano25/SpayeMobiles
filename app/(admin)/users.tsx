// app/(admin)/users.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Switch,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { AdminService } from '../../src/services/AdminService';
import { COLORS, formatAmount, getInitials, getAvatarColor } from '../../src/config/colors';
import { User } from '../../src/types';

export default function AdminUsersScreen() {
  const { colors } = useTheme();
  const { showSuccess, showError } = useNotification();
  const navigation = useNavigation();
  const [users, setUsers] = useState<User[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await AdminService.getAllUsers();
      setUsers(data);
    } catch (error) {
      showError('Erreur chargement des utilisateurs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
  };

  const toggleStatus = async (userId: string, current: boolean) => {
    try {
      await AdminService.updateUserStatus(userId, !current);
      showSuccess(`Utilisateur ${!current ? 'activé' : 'désactivé'}`);
      await loadUsers();
    } catch (error) {
      showError('Erreur lors de la mise à jour');
    }
  };

  const deleteUser = (userId: string, name: string) => {
    Alert.alert(
      'Supprimer',
      `Voulez-vous vraiment supprimer ${name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await AdminService.deleteUser(userId);
              showSuccess('Utilisateur supprimé');
              await loadUsers();
            } catch (error) {
              showError('Erreur lors de la suppression');
            }
          },
        },
      ]
    );
  };

  const filteredUsers = users.filter(user =>
    `${user.firstName} ${user.lastName} ${user.email}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const renderUser = ({ item }: { item: User }) => (
    <View style={[styles.userCard, { backgroundColor: colors.card }]}>
      <View style={[styles.avatarContainer, { backgroundColor: getAvatarColor(item.firstName + item.lastName) }]}>
        <Text style={styles.avatarText}>
          {getInitials(item.firstName, item.lastName)}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: colors.text }]}>
          {item.firstName} {item.lastName}
        </Text>
        <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
          {item.email}
        </Text>
        <Text style={[styles.userBalance, { color: COLORS.primary }]}>
          {formatAmount(item.balance || 0)} Ar
        </Text>
      </View>
      <View style={styles.userActions}>
        <View style={styles.statusRow}>
          <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
            {item.isActive ? 'Actif' : 'Inactif'}
          </Text>
          <Switch
            value={item.isActive}
            onValueChange={() => toggleStatus(item.id, item.isActive)}
            trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
            thumbColor={COLORS.white}
          />
        </View>
        
        {/* ✅ Seulement le bouton Supprimer (les autres sont dans le dashboard) */}
        <TouchableOpacity
          style={[styles.deleteBtn, { backgroundColor: COLORS.error + '18' }]}
          onPress={() => deleteUser(item.id, item.firstName)}
        >
          <Ionicons name="trash-outline" size={18} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Utilisateurs</Text>
        <Text style={styles.headerCount}>{users.length}</Text>
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.card }]}>
        <Ionicons name="search" size={20} color={COLORS.gray400} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Rechercher un utilisateur..."
          placeholderTextColor={COLORS.gray400}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={COLORS.gray400} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: 'bold', color: COLORS.white, marginLeft: 8 },
  headerCount: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, marginLeft: 8 },
  listContent: { padding: 16, paddingBottom: 30 },
  userCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '600' },
  userEmail: { fontSize: 13, marginTop: 2 },
  userBalance: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  userActions: { alignItems: 'flex-end', gap: 6 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusLabel: { fontSize: 12 },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, marginTop: 12 },
});