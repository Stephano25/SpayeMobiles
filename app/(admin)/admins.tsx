// app/(admin)/admins.tsx
// ─────────────────────────────────────────────────────────────
//  SPAYE · Admin Admins Screen
//  ✅ Correction : clés uniques pour les éléments de liste
//  ✅ Correction : routes de navigation
// ─────────────────────────────────────────────────────────────

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
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { AdminService } from '../../src/services/AdminService';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, formatAmount, getInitials, getAvatarColor } from '../../src/config/colors';

export default function AdminAdminsScreen() {
  const { colors } = useTheme();
  const { showSuccess, showError } = useNotification();
  const { getCurrentUser } = useAuth();
  const navigation = useNavigation();
  const [admins, setAdmins] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const currentUser = getCurrentUser();
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDescription, setDepositDescription] = useState('');
  const [depositing, setDepositing] = useState(false);

  useEffect(() => {
    if (!isSuperAdmin) {
      showError('Accès réservé aux Super Administrateurs');
      navigation.goBack();
      return;
    }
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      const data = await AdminService.getAdmins();
      setAdmins(data || []);
    } catch (error) {
      console.error('❌ Erreur loadAdmins:', error);
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

  const handleDepositToAdmin = async () => {
    if (!selectedAdmin || !depositAmount || parseFloat(depositAmount) <= 0) {
      showError('Montant invalide');
      return;
    }

    setDepositing(true);
    try {
      await AdminService.depositMoney(
        selectedAdmin.id,
        parseFloat(depositAmount),
        depositDescription || `Dépôt administrateur par Super Admin`
      );
      showSuccess(`Dépôt de ${formatAmount(parseFloat(depositAmount))} Ar effectué sur le compte de ${selectedAdmin.firstName}`);
      setShowDepositModal(false);
      setSelectedAdmin(null);
      setDepositAmount('');
      setDepositDescription('');
      await loadAdmins();
    } catch (error) {
      showError('Erreur lors du dépôt');
    } finally {
      setDepositing(false);
    }
  };

  // ✅ Rendu admin avec clé unique
  const renderAdmin = ({ item }: { item: any }) => {
    const distance = Math.floor(Math.random() * 30) + 1;
    const isNear = distance <= 20;

    return (
      <TouchableOpacity
        key={item.id || item._id || `admin-${item.email}`}
        style={[styles.adminCard, { backgroundColor: colors.card }]}
        onPress={() => {
          if (isSuperAdmin && isNear) {
            setSelectedAdmin(item);
            setShowDepositModal(true);
          } else if (isSuperAdmin && !isNear) {
            showError(`Administrateur trop loin (${distance}m). Déplacez-vous plus près.`);
          }
        }}
        activeOpacity={isSuperAdmin && isNear ? 0.7 : 1}
      >
        <View style={[styles.adminAvatar, { backgroundColor: getAvatarColor(item.firstName + item.lastName) }]}>
          <Text style={styles.avatarText}>
            {getInitials(item.firstName, item.lastName)}
          </Text>
          {isSuperAdmin && isNear && (
            <View style={styles.nearDot} />
          )}
        </View>
        <View style={styles.adminInfo}>
          <Text style={[styles.adminName, { color: colors.text }]}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={[styles.adminEmail, { color: colors.textSecondary }]}>
            {item.email}
          </Text>
          <Text style={[styles.adminBalance, { color: COLORS.primary }]}>
            Solde: {formatAmount(item.balance || 0)} Ar
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
            {isSuperAdmin && (
              <Text style={[styles.distanceText, { color: isNear ? COLORS.success : COLORS.error }]}>
                {isNear ? '📍 Proche' : `${distance}m`}
              </Text>
            )}
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
      </TouchableOpacity>
    );
  };

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

      {isSuperAdmin && (
        <View style={[styles.infoBanner, { backgroundColor: COLORS.primary + '18' }]}>
          <Ionicons name="information-circle" size={20} color={COLORS.primary} />
          <Text style={[styles.infoText, { color: COLORS.primary }]}>
            Appuyez sur un administrateur proche (&lt; 20m) pour faire un dépôt
          </Text>
        </View>
      )}

      <FlatList
        data={admins}
        keyExtractor={(item) => item.id || item._id || `admin-${item.email}`}
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

      {/* Modal Dépôt Admin */}
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
                Dépôt - {selectedAdmin?.firstName} {selectedAdmin?.lastName}
              </Text>
              <TouchableOpacity onPress={() => setShowDepositModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.selectedAdminInfo}>
              <Text style={[styles.selectedAdminLabel, { color: colors.textSecondary }]}>
                Administrateur sélectionné
              </Text>
              <Text style={[styles.selectedAdminName, { color: colors.text }]}>
                {selectedAdmin?.firstName} {selectedAdmin?.lastName}
              </Text>
              <Text style={[styles.selectedAdminEmail, { color: colors.textSecondary }]}>
                {selectedAdmin?.email}
              </Text>
              <Text style={[styles.selectedAdminBalance, { color: COLORS.success }]}>
                Solde: {formatAmount(selectedAdmin?.balance || 0)} Ar
              </Text>
            </View>

            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Montant (Ar)</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="1000"
              placeholderTextColor={COLORS.gray400}
              value={depositAmount}
              onChangeText={setDepositAmount}
              keyboardType="numeric"
            />

            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Description (optionnelle)</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Dépôt administrateur"
              placeholderTextColor={COLORS.gray400}
              value={depositDescription}
              onChangeText={setDepositDescription}
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
                onPress={handleDepositToAdmin}
                disabled={depositing || !depositAmount || parseFloat(depositAmount) <= 0}
              >
                {depositing ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.modalBtnConfirmText}>Déposer</Text>
                )}
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  infoText: { fontSize: 13, fontWeight: '500', flex: 1 },
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },
  nearDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  adminInfo: { flex: 1 },
  adminName: { fontSize: 15, fontWeight: '600' },
  adminEmail: { fontSize: 13, marginTop: 2 },
  adminBalance: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  adminMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12 },
  roleBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: '600' },
  adminDate: { fontSize: 11 },
  distanceText: { fontSize: 11, fontWeight: '600' },
  adminActions: { alignItems: 'flex-end', gap: 6 },
  deleteBtn: {
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
  selectedAdminInfo: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    marginBottom: 16,
  },
  selectedAdminLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  selectedAdminName: { fontSize: 16, fontWeight: 'bold', marginTop: 2 },
  selectedAdminEmail: { fontSize: 13, marginTop: 2 },
  selectedAdminBalance: { fontSize: 14, fontWeight: 'bold', marginTop: 2 },
  modalLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 8 },
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
  modalBtnConfirmText: { color: COLORS.white, fontWeight: 'bold' },
});