// app/(admin)/deposit.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { AdminService } from '../../src/services/AdminService';
import { COLORS, formatAmount, getInitials, getAvatarColor } from '../../src/config/colors';
import { SafeScreen } from '../../src/components/SafeScreen';

export default function AdminDepositScreen() {
  const { colors } = useTheme();
  const { showSuccess, showError } = useNotification();
  const navigation = useNavigation();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
    }
  };

  const handleSubmit = async () => {
    if (!selectedUserId) {
      showError('Veuillez sélectionner un utilisateur');
      return;
    }
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum < 100) {
      showError('Montant minimum: 100 Ar');
      return;
    }

    const user = users.find(u => u.id === selectedUserId);
    Alert.alert(
      'Confirmer le dépôt',
      `Déposer ${formatAmount(amountNum)} Ar sur le compte de ${user?.firstName} ${user?.lastName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déposer',
          onPress: async () => {
            setSubmitting(true);
            try {
              await AdminService.depositMoney(
                selectedUserId,
                amountNum,
                description || 'Dépôt administrateur'
              );
              showSuccess(`Dépôt de ${formatAmount(amountNum)} Ar effectué`);
              setAmount('');
              setDescription('');
              setSelectedUserId('');
              setSubmitting(false);
              loadUsers();
            } catch (error) {
              showError('Erreur lors du dépôt');
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const getSelectedUser = () => users.find(u => u.id === selectedUserId);

  return (
    <SafeScreen backgroundColor={colors.background}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dépôt d'argent</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Chargement...</Text>
          </View>
        ) : (
          <>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.label, { color: colors.text }]}>Utilisateur</Text>
              <View style={styles.userList}>
                {users.map(user => (
                  <TouchableOpacity
                    key={user.id}
                    style={[
                      styles.userItem,
                      { 
                        backgroundColor: selectedUserId === user.id ? COLORS.primary + '18' : colors.background,
                        borderColor: selectedUserId === user.id ? COLORS.primary : colors.border,
                      }
                    ]}
                    onPress={() => setSelectedUserId(user.id)}
                  >
                    <View style={[styles.userAvatar, { backgroundColor: getAvatarColor(user.firstName + user.lastName) }]}>
                      <Text style={styles.userAvatarText}>{getInitials(user.firstName, user.lastName)}</Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={[styles.userName, { color: colors.text }]}>
                        {user.firstName} {user.lastName}
                      </Text>
                      <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user.email}</Text>
                    </View>
                    <Text style={[styles.userBalance, { color: COLORS.success }]}>
                      {formatAmount(user.balance || 0)} Ar
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {getSelectedUser() && (
              <View style={[styles.card, { backgroundColor: colors.card }]}>
                <View style={styles.selectedUserInfo}>
                  <Text style={[styles.selectedLabel, { color: colors.textSecondary }]}>Utilisateur sélectionné</Text>
                  <Text style={[styles.selectedName, { color: colors.text }]}>
                    {getSelectedUser().firstName} {getSelectedUser().lastName}
                  </Text>
                  <Text style={[styles.selectedBalance, { color: COLORS.success }]}>
                    Solde: {formatAmount(getSelectedUser().balance || 0)} Ar
                  </Text>
                </View>

                <Text style={[styles.label, { color: colors.text }]}>Montant (Ar)</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="1000"
                  placeholderTextColor={COLORS.gray400}
                  keyboardType="numeric"
                />

                <Text style={[styles.label, { color: colors.text }]}>Description (optionnelle)</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Ex: Bonus, récompense..."
                  placeholderTextColor={COLORS.gray400}
                />

                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: COLORS.primary }]}
                  onPress={handleSubmit}
                  disabled={submitting || !amount || parseFloat(amount) < 100}
                >
                  {submitting ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <>
                      <Ionicons name="add" size={20} color={COLORS.white} />
                      <Text style={styles.submitText}>Déposer</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white, flex: 1, marginLeft: 8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  loadingText: { marginTop: 12, fontSize: 14 },
  card: { margin: 16, padding: 16, borderRadius: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  userList: { gap: 8 },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '600' },
  userEmail: { fontSize: 12 },
  userBalance: { fontSize: 13, fontWeight: 'bold' },
  selectedUserInfo: { marginBottom: 16, padding: 12, borderRadius: 12, backgroundColor: COLORS.primaryLight },
  selectedLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  selectedName: { fontSize: 16, fontWeight: 'bold', marginTop: 2 },
  selectedBalance: { fontSize: 14, marginTop: 2 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16, marginBottom: 12 },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
});