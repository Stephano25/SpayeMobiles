// app/(admin)/mobile-money.tsx
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
  Modal,
  RefreshControl,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { useAuth } from '../../src/context/AuthContext';
import { WalletService } from '../../src/services/WalletService';
import { TransactionService } from '../../src/services/TransactionService';
import { AdminService } from '../../src/services/AdminService';
import { COLORS, formatAmount } from '../../src/config/colors';
import { SafeScreen } from '../../src/components/SafeScreen';
import { useTranslation } from '../../src/services/TranslationService';

interface Operator {
  id: 'airtel' | 'orange' | 'mvola';
  name: string;
  icon: string;
  color: string;
  code: string;
  gradient: string;
}

export default function AdminMobileMoneyScreen() {
  const { colors } = useTheme();
  const { showSuccess, showError } = useNotification();
  const { t } = useTranslation();
  const { getCurrentUser } = useAuth();
  const navigation = useNavigation();
  const user = getCurrentUser();
  const isSuperAdmin = user?.role === 'super_admin';

  const [balance, setBalance] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [step, setStep] = useState<'operator' | 'form' | 'confirm' | 'success'>('operator');
  const [showUserModal, setShowUserModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const operators: Operator[] = [
    { 
      id: 'airtel', 
      name: 'Airtel Money', 
      icon: 'phone-portrait',
      color: '#e60000',
      code: '033',
      gradient: 'linear-gradient(135deg, #e60000, #b30000)'
    },
    { 
      id: 'orange', 
      name: 'Orange Money', 
      icon: 'phone-portrait',
      color: '#ff7900',
      code: '032',
      gradient: 'linear-gradient(135deg, #ff7900, #cc6100)'
    },
    { 
      id: 'mvola', 
      name: 'MVola', 
      icon: 'phone-portrait',
      color: '#00a651',
      code: '034',
      gradient: 'linear-gradient(135deg, #00a651, #007a3d)'
    }
  ];

  const quickAmounts = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];
  const MIN_AMOUNT = 100;
  const MINIMUM_FEE = 200;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [balanceData, usersData] = await Promise.all([
        WalletService.getBalance(),
        AdminService.getAllUsers(),
      ]);
      setBalance(balanceData.balance || 0);
      setUsers(usersData || []);
    } catch (error) {
      showError('Erreur chargement des données');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const selectOperator = (operator: Operator) => {
    setSelectedOperator(operator);
    setStep('form');
    setPhoneNumber(operator.code);
  };

  const goToConfirm = () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum < MIN_AMOUNT) {
      showError(`Montant minimum: ${formatAmount(MIN_AMOUNT)} Ar`);
      return;
    }
    if (!selectedUserId) {
      showError('Veuillez sélectionner un utilisateur');
      return;
    }
    if (!phoneNumber || phoneNumber.length < 9) {
      showError('Numéro de téléphone invalide');
      return;
    }

    const totalWithFees = calculateTotal(amountNum);
    if (totalWithFees > balance) {
      showError(`Solde insuffisant. Total avec frais: ${formatAmount(totalWithFees)} Ar`);
      return;
    }

    setStep('confirm');
  };

  const calculateFee = (amount: number): number => {
    if (!selectedOperator) return 0;
    const feePercentage = 0.5;
    let fee = (amount * feePercentage) / 100;
    return Math.ceil(fee < MINIMUM_FEE ? MINIMUM_FEE : fee);
  };

  const calculateTotal = (amount: number): number => {
    return amount + calculateFee(amount);
  };

  const handleSubmit = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum < MIN_AMOUNT) {
      showError(`Montant minimum: ${formatAmount(MIN_AMOUNT)} Ar`);
      return;
    }

    const totalWithFees = calculateTotal(amountNum);
    if (totalWithFees > balance) {
      showError('Solde insuffisant');
      return;
    }

    setSubmitting(true);
    try {
      const transferData = {
        operator: selectedOperator!.id,
        phoneNumber: phoneNumber.replace(/\s/g, ''),
        amount: amountNum,
      };

      const result = await TransactionService.mobileMoneyTransfer(transferData);
      
      setBalance((prev: number) => prev - totalWithFees);
      
      if (selectedUserId) {
        await AdminService.depositMoney(
          selectedUserId,
          amountNum,
          description || `Transfert Mobile Money ${selectedOperator?.name}`,
          result.id
        );
      }

      setStep('success');
      showSuccess(`Transfert Mobile Money de ${formatAmount(amountNum)} Ar effectué avec succès`);

      setTimeout(() => {
        resetForm();
        loadData();
        navigation.goBack();
      }, 3000);
    } catch (error: any) {
      showError(error?.message || 'Erreur lors du transfert Mobile Money');
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep('operator');
    setSelectedOperator(null);
    setSelectedUserId('');
    setAmount('');
    setPhoneNumber('');
    setDescription('');
    setSubmitting(false);
    setSearchQuery('');
    setShowUserModal(false);
  };

  const getSelectedUser = () => users.find((u: any) => u.id === selectedUserId);

  const filteredUsers = users.filter((user: any) =>
    `${user.firstName} ${user.lastName} ${user.email}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const formatAmountWithSuffix = (amount: number): string => {
    if (amount >= 1000000) return (amount / 1000000).toFixed(1) + ' M';
    if (amount >= 1000) return (amount / 1000).toFixed(0) + ' k';
    return amount.toString();
  };

  if (loading) {
    return (
      <SafeScreen backgroundColor={colors.background}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 12, color: colors.textSecondary }}>{t('loading')}</Text>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen backgroundColor={colors.background}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mobile Money Admin</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={[styles.balanceCard, { backgroundColor: '#1a1830' }]}>
          <Text style={styles.balanceLabel}>{t('balance')}</Text>
          <Text style={styles.balanceAmount}>{formatAmount(balance)} Ar</Text>
          <Text style={styles.balanceSub}>
            {isSuperAdmin ? 'Super Administrateur' : 'Administrateur'}
          </Text>
        </View>

        <View style={styles.stepIndicator}>
          {['operator', 'form', 'confirm', 'success'].map((s, i) => {
            const isActive = step === s;
            const stepIndex = ['operator', 'form', 'confirm', 'success'].indexOf(step);
            const isCompleted = stepIndex > i;
            return (
              <React.Fragment key={s}>
                <View style={[styles.stepItem, isActive && styles.stepActive]}>
                  <View style={[styles.stepCircle, isCompleted && styles.stepCompleted]}>
                    {isCompleted ? (
                      <Ionicons name="checkmark" size={14} color={COLORS.white} />
                    ) : (
                      <Text style={styles.stepNumber}>{i + 1}</Text>
                    )}
                  </View>
                  <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>
                    {s === 'operator' ? 'Opérateur' : s === 'form' ? 'Détails' : s === 'confirm' ? 'Confirmation' : 'Succès'}
                  </Text>
                </View>
                {i < 3 && <View style={[styles.stepLine, (isCompleted || isActive) && styles.stepLineActive]} />}
              </React.Fragment>
            );
          })}
        </View>

        {step === 'operator' && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Choisissez l'opérateur</Text>
            {operators.map((op) => (
              <TouchableOpacity
                key={op.id}
                style={[styles.operatorCard, { backgroundColor: colors.background }]}
                onPress={() => selectOperator(op)}
              >
                <View style={[styles.operatorIcon, { backgroundColor: op.color + '20' }]}>
                  <Ionicons name={op.icon as any} size={24} color={op.color} />
                </View>
                <View style={styles.operatorInfo}>
                  <Text style={[styles.operatorName, { color: colors.text }]}>{op.name}</Text>
                  <Text style={[styles.operatorCode, { color: colors.textSecondary }]}>{op.code}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 'form' && selectedOperator && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.selectedOperator}>
              <View style={[styles.selectedOperatorBadge, { backgroundColor: selectedOperator.color }]}>
                <Ionicons name="phone-portrait" size={18} color={COLORS.white} />
              </View>
              <Text style={[styles.selectedOperatorName, { color: colors.text }]}>
                {selectedOperator.name}
              </Text>
              <TouchableOpacity onPress={() => setStep('operator')}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Utilisateur *</Text>
            <TouchableOpacity
              style={[styles.userSelector, { borderColor: colors.border }]}
              onPress={() => setShowUserModal(true)}
            >
              {selectedUserId ? (
                <View style={styles.selectedUser}>
                  <Text style={[styles.selectedUserName, { color: colors.text }]}>
                    {getSelectedUser()?.firstName} {getSelectedUser()?.lastName}
                  </Text>
                  <Text style={[styles.selectedUserEmail, { color: colors.textSecondary }]}>
                    {getSelectedUser()?.email}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.userSelectorPlaceholder, { color: colors.textSecondary }]}>
                  Sélectionner un utilisateur
                </Text>
              )}
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <Text style={[styles.label, { color: colors.text }]}>Numéro de téléphone *</Text>
            <View style={[styles.phoneInput, { borderColor: colors.border }]}>
              <Text style={[styles.phonePrefix, { color: colors.text }]}>+261</Text>
              <TextInput
                style={[styles.phoneTextInput, { color: colors.text }]}
                value={phoneNumber.replace(selectedOperator.code, '')}
                onChangeText={(text) => setPhoneNumber(selectedOperator.code + text.replace(/\D/g, ''))}
                placeholder="34 12 345 67"
                placeholderTextColor={COLORS.gray400}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Montant (Ar) *</Text>
            <TextInput
              style={[styles.amountInput, { color: colors.text, borderColor: colors.border }]}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={COLORS.gray400}
              keyboardType="numeric"
            />

            <View style={styles.quickAmounts}>
              {quickAmounts.map((a) => (
                <TouchableOpacity
                  key={a}
                  style={[styles.quickAmountBtn, { backgroundColor: colors.background }]}
                  onPress={() => setAmount(String(a))}
                >
                  <Text style={[styles.quickAmountText, { color: colors.text }]}>
                    {formatAmountWithSuffix(a)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {amount && parseFloat(amount) >= MIN_AMOUNT && (
              <View style={[styles.feePreview, { backgroundColor: colors.background }]}>
                <View style={styles.feeRow}>
                  <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Montant</Text>
                  <Text style={[styles.feeValue, { color: colors.text }]}>{formatAmount(parseFloat(amount))} Ar</Text>
                </View>
                <View style={styles.feeRow}>
                  <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Frais</Text>
                  <Text style={[styles.feeValue, { color: colors.warning }]}>+ {formatAmount(calculateFee(parseFloat(amount)))} Ar</Text>
                </View>
                <View style={[styles.feeRow, styles.feeTotal]}>
                  <Text style={[styles.feeLabel, { color: colors.text }]}>Total à débiter</Text>
                  <Text style={[styles.feeValue, { color: COLORS.primary, fontWeight: 'bold' }]}>
                    {formatAmount(calculateTotal(parseFloat(amount)))} Ar
                  </Text>
                </View>
              </View>
            )}

            <Text style={[styles.label, { color: colors.text }]}>Description (optionnelle)</Text>
            <TextInput
              style={[styles.descInput, { color: colors.text, borderColor: colors.border }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Ex: Transfert Mobile Money"
              placeholderTextColor={COLORS.gray400}
            />

            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: COLORS.primary }]}
              onPress={goToConfirm}
              disabled={!selectedUserId || !amount || parseFloat(amount) < MIN_AMOUNT || !phoneNumber}
            >
              <Text style={styles.nextBtnText}>Continuer</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        )}

        {step === 'confirm' && selectedOperator && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.confirmHeader}>
              <View style={styles.confirmIcon}>
                <Ionicons name="checkmark-circle" size={48} color={COLORS.primary} />
              </View>
              <Text style={[styles.confirmTitle, { color: colors.text }]}>Confirmer le transfert</Text>
              <Text style={[styles.confirmSub, { color: colors.textSecondary }]}>
                Vérifiez les informations avant de confirmer
              </Text>
            </View>

            <View style={[styles.confirmDetails, { backgroundColor: colors.background }]}>
              <View style={styles.confirmRow}>
                <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>Opérateur</Text>
                <Text style={[styles.confirmValue, { color: colors.text }]}>{selectedOperator.name}</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>Numéro</Text>
                <Text style={[styles.confirmValue, { color: colors.text }]}>{phoneNumber}</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>Utilisateur</Text>
                <Text style={[styles.confirmValue, { color: colors.text }]}>
                  {getSelectedUser()?.firstName} {getSelectedUser()?.lastName}
                </Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>Montant</Text>
                <Text style={[styles.confirmValue, { color: COLORS.success, fontWeight: 'bold' }]}>
                  {formatAmount(parseFloat(amount))} Ar
                </Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>Frais</Text>
                <Text style={[styles.confirmValue, { color: COLORS.warning }]}>
                  + {formatAmount(calculateFee(parseFloat(amount)))} Ar
                </Text>
              </View>
              <View style={[styles.confirmRow, styles.confirmTotal]}>
                <Text style={[styles.confirmLabel, { color: colors.text, fontWeight: 'bold' }]}>Total à débiter</Text>
                <Text style={[styles.confirmValue, { color: COLORS.primary, fontWeight: 'bold' }]}>
                  {formatAmount(calculateTotal(parseFloat(amount)))} Ar
                </Text>
              </View>
              {description && (
                <View style={styles.confirmRow}>
                  <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>Description</Text>
                  <Text style={[styles.confirmValue, { color: colors.text }]}>{description}</Text>
                </View>
              )}
            </View>

            {calculateTotal(parseFloat(amount || '0')) > balance && (
              <View style={styles.warningBox}>
                <Ionicons name="warning" size={20} color={COLORS.error} />
                <Text style={[styles.warningText, { color: COLORS.error }]}>
                  Solde insuffisant. Total avec frais: {formatAmount(calculateTotal(parseFloat(amount || '0')))} Ar
                </Text>
              </View>
            )}

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmBtnCancel]}
                onPress={() => setStep('form')}
              >
                <Text style={styles.confirmBtnCancelText}>Retour</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmBtnSubmit]}
                onPress={handleSubmit}
                disabled={submitting || calculateTotal(parseFloat(amount || '0')) > balance}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.confirmBtnSubmitText}>Confirmer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 'success' && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
              </View>
              <Text style={[styles.successTitle, { color: colors.text }]}>Transfert réussi !</Text>
              <Text style={[styles.successSub, { color: colors.textSecondary }]}>
                {formatAmount(parseFloat(amount))} Ar envoyés via {selectedOperator?.name}
              </Text>
              <View style={[styles.successDetails, { backgroundColor: colors.background }]}>
                <View style={styles.successRow}>
                  <Text style={[styles.successLabel, { color: colors.textSecondary }]}>Destinataire</Text>
                  <Text style={[styles.successValue, { color: colors.text }]}>
                    {getSelectedUser()?.firstName} {getSelectedUser()?.lastName}
                  </Text>
                </View>
                <View style={styles.successRow}>
                  <Text style={[styles.successLabel, { color: colors.textSecondary }]}>Numéro</Text>
                  <Text style={[styles.successValue, { color: colors.text }]}>{phoneNumber}</Text>
                </View>
                <View style={styles.successRow}>
                  <Text style={[styles.successLabel, { color: colors.textSecondary }]}>Montant total</Text>
                  <Text style={[styles.successValue, { color: COLORS.primary, fontWeight: 'bold' }]}>
                    {formatAmount(calculateTotal(parseFloat(amount)))} Ar
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={[styles.successBtn, { backgroundColor: COLORS.primary }]} onPress={resetForm}>
                <Text style={styles.successBtnText}>Nouveau transfert</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showUserModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Sélectionner un utilisateur</Text>
              <TouchableOpacity onPress={() => setShowUserModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={[styles.modalSearch, { backgroundColor: colors.background }]}>
              <Ionicons name="search" size={20} color={COLORS.gray400} />
              <TextInput
                style={[styles.modalSearchInput, { color: colors.text }]}
                placeholder="Rechercher..."
                placeholderTextColor={COLORS.gray400}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <FlatList
              data={filteredUsers}
              keyExtractor={(item: any) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.modalUserItem, { backgroundColor: colors.background }]}
                  onPress={() => {
                    setSelectedUserId(item.id);
                    setShowUserModal(false);
                    setSearchQuery('');
                  }}
                >
                  <View style={styles.modalUserAvatar}>
                    <Text style={styles.modalUserAvatarText}>
                      {(item.firstName?.charAt(0) || '') + (item.lastName?.charAt(0) || '')}
                    </Text>
                  </View>
                  <View style={styles.modalUserInfo}>
                    <Text style={[styles.modalUserName, { color: colors.text }]}>
                      {item.firstName} {item.lastName}
                    </Text>
                    <Text style={[styles.modalUserEmail, { color: colors.textSecondary }]}>{item.email}</Text>
                  </View>
                  <Text style={[styles.modalUserBalance, { color: COLORS.success }]}>
                    {formatAmount(item.balance || 0)} Ar
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={[styles.modalEmpty, { color: colors.textSecondary }]}>
                  Aucun utilisateur trouvé
                </Text>
              }
            />
          </View>
        </View>
      </Modal>
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
  balanceCard: {
    margin: 16,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  balanceSub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  stepItem: { alignItems: 'center', flex: 1 },
  stepActive: {},
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCompleted: { backgroundColor: COLORS.success },
  stepNumber: { fontSize: 12, fontWeight: 'bold', color: COLORS.white },
  stepLabel: { fontSize: 10, marginTop: 4, color: COLORS.gray400 },
  stepLabelActive: { color: COLORS.primary, fontWeight: 'bold' },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.gray200,
    marginHorizontal: 4,
  },
  stepLineActive: { backgroundColor: COLORS.primary },
  card: { margin: 16, padding: 20, borderRadius: 16 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  operatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  operatorIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  operatorInfo: { flex: 1 },
  operatorName: { fontSize: 15, fontWeight: '600' },
  operatorCode: { fontSize: 12 },
  selectedOperator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    marginBottom: 16,
  },
  selectedOperatorBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  selectedOperatorName: { fontSize: 15, fontWeight: '600', flex: 1 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  userSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  selectedUser: { flex: 1 },
  selectedUserName: { fontSize: 14, fontWeight: '500' },
  selectedUserEmail: { fontSize: 12 },
  userSelectorPlaceholder: { fontSize: 14 },
  phoneInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  phonePrefix: { fontSize: 14, fontWeight: '600', marginRight: 8 },
  phoneTextInput: { flex: 1, paddingVertical: 12, fontSize: 15 },
  amountInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  quickAmountBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  quickAmountText: { fontSize: 13, fontWeight: '500' },
  feePreview: { marginTop: 12, padding: 14, borderRadius: 12 },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  feeTotal: { borderTopWidth: 0.5, borderTopColor: COLORS.gray200, paddingTop: 8, marginTop: 4 },
  feeLabel: { fontSize: 13 },
  feeValue: { fontSize: 13, fontWeight: '600' },
  descInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    marginTop: 4,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  nextBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
  confirmHeader: { alignItems: 'center', marginBottom: 16 },
  confirmIcon: { marginBottom: 8 },
  confirmTitle: { fontSize: 20, fontWeight: 'bold' },
  confirmSub: { fontSize: 14, textAlign: 'center' },
  confirmDetails: { padding: 14, borderRadius: 12 },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  confirmTotal: { borderTopWidth: 0.5, borderTopColor: COLORS.gray200, paddingTop: 8, marginTop: 4 },
  confirmLabel: { fontSize: 13 },
  confirmValue: { fontSize: 13, fontWeight: '500' },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.errorLight,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  warningText: { fontSize: 13, flex: 1 },
  confirmActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  confirmBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  confirmBtnCancel: { backgroundColor: COLORS.gray100 },
  confirmBtnCancelText: { color: COLORS.gray600, fontWeight: '600' },
  confirmBtnSubmit: { backgroundColor: COLORS.primary },
  confirmBtnSubmitText: { color: COLORS.white, fontWeight: 'bold' },
  successContainer: { alignItems: 'center' },
  successIcon: { marginBottom: 12 },
  successTitle: { fontSize: 22, fontWeight: 'bold' },
  successSub: { fontSize: 14, marginBottom: 16 },
  successDetails: { width: '100%', padding: 14, borderRadius: 12, marginBottom: 16 },
  successRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  successLabel: { fontSize: 13 },
  successValue: { fontSize: 13, fontWeight: '500' },
  successBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  successBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  modalSearchInput: { flex: 1, paddingVertical: 10, fontSize: 15, marginLeft: 8 },
  modalUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 6,
  },
  modalUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  modalUserAvatarText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },
  modalUserInfo: { flex: 1 },
  modalUserName: { fontSize: 14, fontWeight: '500' },
  modalUserEmail: { fontSize: 12 },
  modalUserBalance: { fontSize: 13, fontWeight: 'bold' },
  modalEmpty: { textAlign: 'center', padding: 20 },
});