// app/(admin)/admins.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { AdminService } from '../../src/services/AdminService';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, getInitials } from '../../src/config/colors';

export default function AdminAdminsScreen() {
  const { colors } = useTheme();
  const { showSuccess, showError } = useNotification();
  const { getCurrentUser } = useAuth();
  const navigation = useNavigation();
  const [admins, setAdmins] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const currentUser = getCurrentUser();

  useEffect(() => {
    if (currentUser?.role !== 'super_admin') {
      showError('Accès réservé aux Super Administrateurs');
      navigation.goBack();
      return;
    }
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      const data = await AdminService.getAdmins();
      setAdmins(data);
    } catch (error) {
      showError('Erreur chargement des administrateurs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAdmins();
  };

  const toggleStatus = async (adminId: string, current: boolean) => {
    try {
      await AdminService.updateUserStatus(adminId, !current);
      showSuccess(`Administrateur ${!current ? 'activé' : 'désactivé'}`);
      await loadAdmins();
    } catch (error) {
      showError('Erreur lors de la mise à jour');
    }
  };

  const deleteAdmin = (admin: any) => {
    if (admin.id === currentUser?.id) {
      showError('Vous ne pouvez pas vous supprimer vous-même');
      return;
    }

    Alert.alert(
      'Supprimer',
      `Voulez-vous vraiment supprimer ${admin.firstName} ${admin.lastName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await AdminService.deleteAdmin(admin.id);
              showSuccess('Administrateur supprimé');
              await loadAdmins();
            } catch (error) {
              showError('Erreur lors de la suppression');
            }
          },
        },
      ]
    );
  };

  const renderAdmin = ({ item }: { item: any }) => (
    <View style={[styles.adminCard, { backgroundColor: colors.card }]}>
      <View style={styles.adminAvatar}>
        <Text style={styles.avatarText}>
          {getInitials(item.firstName, item.lastName)}
        </Text>
      </View>
      <View style={styles.adminInfo}>
        <Text style={[styles.adminName, { color: colors.text }]}>
          {item.firstName} {item.lastName}
        </Text>
        <Text style={[styles.adminEmail, { color: colors.textSecondary }]}>
          {item.email}
        </Text>
        <View style={styles.adminMeta}>
          <View style={[styles.roleBadge, { 
            backgroundColor: item.role === 'super_admin' ? '#7c3aed' : '#f59e0b' 
          }]}>
            <Text style={styles.roleBadgeText}>
              {item.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </Text>
          </View>
          <Text style={[styles.adminDate, { color: colors.textSecondary }]}>
            {new Date(item.createdAt).toLocaleDateString('fr-MG')}
          </Text>
        </View>
      </View>
      <View style={styles.adminActions}>
        <Switch
          value={item.isActive}
          onValueChange={() => toggleStatus(item.id, item.isActive)}
          trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
          thumbColor={COLORS.white}
        />
        <TouchableOpacity
          style={[styles.deleteBtn, { backgroundColor: COLORS.error + '18' }]}
          onPress={() => deleteAdmin(item)}
          disabled={item.id === currentUser?.id}
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
        <Text style={styles.headerTitle}>Administrateurs</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AdminCreate' as never)}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={admins}
        keyExtractor={(item) => item.id}
        renderItem={renderAdmin}
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
            <Ionicons name="shield-outline" size={48} color={COLORS.gray400} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Aucun administrateur
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
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white, flex: 1, marginLeft: 8 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: { padding: 16, paddingBottom: 30 },
  adminCard: {
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
  adminAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  adminInfo: { flex: 1 },
  adminName: { fontSize: 15, fontWeight: '600' },
  adminEmail: { fontSize: 13, marginTop: 2 },
  adminMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  roleBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '600',
  },
  adminDate: { fontSize: 11 },
  adminActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
});