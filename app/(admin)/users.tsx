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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { AdminService } from '../../src/services/AdminService';
import { COLORS, formatAmount, getInitials } from '../../src/config/colors';
import { User } from '../../src/types';

export default function AdminUsersScreen() {
  const { colors } = useTheme();
  const { showSuccess, showError } = useNotification();
  const navigation = useNavigation();
  const [users, setUsers] = useState<User[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

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

  const handleDeposit = async () => {
    if (!selectedUser || !amount || parseFloat(amount) <= 0) {
      showError('Montant invalide');
      return;
    }

    try {
      await AdminService.depositMoney(
        selectedUser.id,
        parseFloat(amount),
        description || `Dépôt administrateur`
      );
      showSuccess(`Dépôt de ${formatAmount(parseFloat(amount))} Ar effectué`);
      setShowDepositModal(false);
      setSelectedUser(null);
      setAmount('');
      setDescription('');
      await loadUsers();
    } catch (error) {
      showError('Erreur lors du dépôt');
    }
  };

  const handleWithdraw = async () => {
    if (!selectedUser || !amount || parseFloat(amount) <= 0) {
      showError('Montant invalide');
      return;
    }

    if (parseFloat(amount) > (selectedUser.balance || 0)) {
      showError('Solde insuffisant');
      return;
    }

    try {
      await AdminService.withdrawMoney(
        selectedUser.id,
        parseFloat(amount),
        description || `Retrait administrateur`
      );
      showSuccess(`Retrait de ${formatAmount(parseFloat(amount))} Ar effectué`);
      setShowWithdrawModal(false);
      setSelectedUser(null);
      setAmount('');
      setDescription('');
      await loadUsers();
    } catch (error) {
      showError('Erreur lors du retrait');
    }
  };

  const filteredUsers = users.filter(user =>
    `${user.firstName} ${user.lastName} ${user.email}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const renderUser = ({ item }: { item: User }) => (
    <View style={[styles.userCard, { backgroundColor: colors.card }]}>
      <View style={styles.avatarContainer}>
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
          {formatAmount(item.balance)} Ar
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
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.success + '18' }]}
            onPress={() => {
              setSelectedUser(item);
              setShowDepositModal(true);
            }}
          >
            <Ionicons name="add" size={20} color={COLORS.success} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.error + '18' }]}
            onPress={() => {
              setSelectedUser(item);
              setShowWithdrawModal(true);
            }}
            disabled={(item.balance || 0) < 100}
          >
            <Ionicons name="remove" size={20} color={COLORS.error} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.error + '18' }]}
            onPress={() => deleteUser(item.id, item.firstName)}
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>
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

      {/* Modal Dépôt */}
      <Modal
        visible={showDepositModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDepositModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Dépôt - {selectedUser?.firstName} {selectedUser?.lastName}
              </Text>
              <TouchableOpacity onPress={() => setShowDepositModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
              Solde actuel: {formatAmount(selectedUser?.balance || 0)} Ar
            </Text>

            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Montant (Ar)"
              placeholderTextColor={COLORS.gray400}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Description (optionnelle)"
              placeholderTextColor={COLORS.gray400}
              value={description}
              onChangeText={setDescription}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setShowDepositModal(false)}
              >
                <Text style={styles.modalBtnCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={handleDeposit}
              >
                <Text style={styles.modalBtnConfirmText}>Déposer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Retrait */}
      <Modal
        visible={showWithdrawModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWithdrawModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Retrait - {selectedUser?.firstName} {selectedUser?.lastName}
              </Text>
              <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
              Solde actuel: {formatAmount(selectedUser?.balance || 0)} Ar
            </Text>

            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Montant (Ar)"
              placeholderTextColor={COLORS.gray400}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Description (optionnelle)"
              placeholderTextColor={COLORS.gray400}
              value={description}
              onChangeText={setDescription}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setShowWithdrawModal(false)}
              >
                <Text style={styles.modalBtnCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={handleWithdraw}
              >
                <Text style={styles.modalBtnConfirmText}>Retirer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: COLORS.primary,
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
  actionButtons: { flexDirection: 'row', gap: 6 },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, marginTop: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalLabel: { fontSize: 14, marginBottom: 16 },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: COLORS.gray100 },
  modalBtnCancelText: { color: COLORS.gray600, fontWeight: '600' },
  modalBtnConfirm: { backgroundColor: COLORS.primary },
  modalBtnConfirmText: { color: COLORS.white, fontWeight: '600' },
});