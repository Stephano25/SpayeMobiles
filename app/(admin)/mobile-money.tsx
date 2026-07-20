// app/(admin)/mobile-money.tsx
// ─────────────────────────────────────────────────────────────
//  SPAYE · Mobile Money Transfer (Admin)
//  ✅ L'admin saisit les 10 chiffres COMPLETS
//  ✅ SUPPRESSION du champ "Utilisateur"
//  ✅ maxLength = 10 pour 10 chiffres
// ─────────────────────────────────────────────────────────────

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
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { useAuth } from '../../src/context/AuthContext';
import { WalletService } from '../../src/services/WalletService';
import { TransactionService } from '../../src/services/TransactionService';
import { COLORS, RADIUS, SPACING, FONT, SHADOW, formatAmount } from '../../src/config/colors';
import { SafeScreen } from '../../src/components/SafeScreen';
import { useTranslation } from '../../src/services/TranslationService';

interface Operator {
  id: 'airtel' | 'orange' | 'mvola';
  name: string;
  icon: string;
  color: string;
  code: string;
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
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [step, setStep] = useState<'operator' | 'form' | 'confirm' | 'success'>('operator');

  const operators: Operator[] = [
    { id: 'airtel', name: 'Airtel Money', icon: 'phone-portrait', color: '#e60000', code: '033' },
    { id: 'orange', name: 'Orange Money', icon: 'phone-portrait', color: '#ff7900', code: '032' },
    { id: 'mvola', name: 'MVola', icon: 'phone-portrait', color: '#00a651', code: '034' }
  ];

  const quickAmounts = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];
  const MIN_AMOUNT = 100;
  const MINIMUM_FEE = 200;
  const PHONE_LENGTH = 10;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const balanceData = await WalletService.getBalance();
      setBalance(balanceData.balance || 0);
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
    setPhoneNumber('');
  };

  const goToConfirm = () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum < MIN_AMOUNT) {
      showError(`Montant minimum: ${formatAmount(MIN_AMOUNT)} Ar`);
      return;
    }
    
    const cleanPhone = phoneNumber.replace(/\s/g, '');
    
    if (cleanPhone.length !== PHONE_LENGTH) {
      showError(`Le numéro doit contenir exactement ${PHONE_LENGTH} chiffres (actuellement ${cleanPhone.length})`);
      return;
    }
    
    if (selectedOperator && !cleanPhone.startsWith(selectedOperator.code)) {
      showError(`Le numéro doit commencer par ${selectedOperator.code} pour ${selectedOperator.name}`);
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
      const cleanPhone = phoneNumber.replace(/\s/g, '');
      
      const transferData = {
        operator: selectedOperator!.id,
        phoneNumber: cleanPhone,
        amount: amountNum,
      };

      await TransactionService.mobileMoneyTransfer(transferData);
      
      setBalance((prev: number) => prev - totalWithFees);

      setStep('success');
      showSuccess(`Transfert Mobile Money de ${formatAmount(amountNum)} Ar effectué avec succès`);

      setTimeout(() => {
        resetForm();
        loadData();
        navigation.goBack();
      }, 3000);
    } catch (error: any) {
      console.error('❌ Erreur transfert Mobile Money Admin:', error);
      showError(error?.message || error?.response?.data?.message || 'Erreur lors du transfert Mobile Money');
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep('operator');
    setSelectedOperator(null);
    setAmount('');
    setPhoneNumber('');
    setDescription('');
    setSubmitting(false);
  };

  const formatAmountWithSuffix = (amount: number): string => {
    if (amount >= 1000000) return (amount / 1000000).toFixed(1) + ' M';
    if (amount >= 1000) return (amount / 1000).toFixed(0) + ' k';
    return amount.toString();
  };

  const formatPhoneDisplay = (text: string) => {
    const clean = text.replace(/\s/g, '');
    if (clean.length === 0) return '';
    if (clean.length <= 3) return clean;
    let formatted = clean.substring(0, 3);
    const rest = clean.substring(3);
    for (let i = 0; i < rest.length; i += 2) {
      formatted += ' ' + rest.substring(i, i + 2);
    }
    return formatted.trim();
  };

  const handlePhoneChange = (text: string) => {
    const clean = text.replace(/\D/g, '');
    if (clean.length <= PHONE_LENGTH) {
      setPhoneNumber(clean);
    }
  };

  const cleanPhone = phoneNumber.replace(/\s/g, '');
  const isPhoneComplete = cleanPhone.length === PHONE_LENGTH;
  const prefixError = cleanPhone.length >= 3 && selectedOperator && cleanPhone.substring(0, 3) !== selectedOperator.code;

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

            <Text style={[styles.label, { color: colors.text }]}>Numéro de téléphone (10 chiffres) *</Text>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Saisissez les 10 chiffres (ex: {selectedOperator.code}0431105)
            </Text>
            <TextInput
              style={[
                styles.input, 
                { 
                  color: colors.text, 
                  backgroundColor: colors.card,
                  borderColor: prefixError ? COLORS.error : (isPhoneComplete ? COLORS.success : colors.border),
                  borderWidth: prefixError ? 2 : 1,
                }
              ]}
              value={formatPhoneDisplay(phoneNumber)}
              onChangeText={handlePhoneChange}
              keyboardType="number-pad"
              placeholder={`${selectedOperator.code} 04 311 05`}
              placeholderTextColor={COLORS.gray400}
              maxLength={PHONE_LENGTH + 5}
            />
            
            {cleanPhone.length > 0 && cleanPhone.length < PHONE_LENGTH && (
              <Text style={styles.errorHint}>
                ⚠️ {cleanPhone.length}/{PHONE_LENGTH} chiffres saisis
              </Text>
            )}
            
            {prefixError && (
              <Text style={styles.errorHint}>
                ⚠️ Le numéro doit commencer par {selectedOperator.code}
              </Text>
            )}
            
            {isPhoneComplete && !prefixError && (
              <Text style={styles.successHint}>
                ✅ Numéro valide : {formatPhoneDisplay(phoneNumber)}
              </Text>
            )}

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
              disabled={!amount || parseFloat(amount) < MIN_AMOUNT || !isPhoneComplete || prefixError}
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
                <Text style={[styles.confirmValue, { color: colors.text }]}>+261 {formatPhoneDisplay(phoneNumber)}</Text>
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
                  <Text style={[styles.successLabel, { color: colors.textSecondary }]}>Numéro</Text>
                  <Text style={[styles.successValue, { color: colors.text }]}>+261 {formatPhoneDisplay(phoneNumber)}</Text>
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
  hint: { fontSize: 11, marginBottom: 6, color: COLORS.gray400 },
  input: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT.size.base,
    ...SHADOW.sm,
  },
  errorHint: { fontSize: 11, marginTop: 4, color: COLORS.error },
  successHint: { fontSize: 11, marginTop: 4, color: COLORS.success },
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
});