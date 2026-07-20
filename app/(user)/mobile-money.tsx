// app/(user)/mobile-money.tsx
// ─────────────────────────────────────────────────────────────
//  SPAYE · Mobile Money Transfer (User)
//  ✅ Saisie SIMPLE de 10 chiffres
//  ✅ Affichage formaté avec espaces
//  ✅ maxLength = 10
// ─────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { WalletService } from '../../src/services/WalletService';
import { TransactionService } from '../../src/services/TransactionService';
import { COLORS, RADIUS, SPACING, FONT, SHADOW, formatAmount } from '../../src/config';

const OPERATORS = [
  { id: 'airtel', name: 'Airtel Money', color: '#E60000', prefix: '033' },
  { id: 'orange', name: 'Orange Money', color: '#FF7900', prefix: '032' },
  { id: 'mvola', name: 'MVola', color: '#045704', prefix: '034' },
] as const;

const MIN_AMOUNT = 100;
const MINIMUM_FEE = 200;
const FEE_PERCENT = 0.5;
const PHONE_LENGTH = 10;

export default function MobileMoneyScreen() {
  const { colors } = useTheme();
  const { showError, showSuccess } = useNotification();
  const navigation = useNavigation();
  const [balance, setBalance] = useState(0);
  const [operator, setOperator] = useState<typeof OPERATORS[number] | null>(null);
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'operator' | 'form' | 'success'>('operator');
  const [loading, setLoading] = useState(false);
  const [transferAmount, setTransferAmount] = useState(0);

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      const w = await WalletService.getWallet();
      setBalance(w.balance ?? 0);
    } catch {
      // Garder le solde à 0 par défaut
    }
  };

  const numAmount = Number(amount) || 0;
  const fee = numAmount > 0 ? Math.max(Math.ceil((numAmount * FEE_PERCENT) / 100), MINIMUM_FEE) : 0;
  const total = numAmount + fee;

  const selectOperator = (op: typeof OPERATORS[number]) => {
    setOperator(op);
    setPhone('');
    setStep('form');
  };

  const submit = async () => {
    if (!operator) {
      showError('Veuillez sélectionner un opérateur');
      return;
    }
    if (numAmount < MIN_AMOUNT) {
      showError(`Montant minimum : ${formatAmount(MIN_AMOUNT)} Ar`);
      return;
    }
    
    const cleanPhone = phone.replace(/\s/g, '');
    
    if (cleanPhone.length !== PHONE_LENGTH) {
      showError(`Le numéro doit contenir exactement ${PHONE_LENGTH} chiffres (actuellement ${cleanPhone.length})`);
      return;
    }
    
    const prefix = cleanPhone.substring(0, 3);
    if (prefix !== operator.prefix) {
      showError(`Le numéro doit commencer par ${operator.prefix} pour ${operator.name}`);
      return;
    }
    
    if (total > balance) {
      showError(`Solde insuffisant. Total avec frais : ${formatAmount(total)} Ar`);
      return;
    }

    Alert.alert(
      'Confirmation',
      `Voulez-vous vraiment transférer ${formatAmount(numAmount)} Ar vers ${operator.name} ${cleanPhone} ?\nFrais : ${formatAmount(fee)} Ar\nTotal : ${formatAmount(total)} Ar`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setLoading(true);
            try {
              await TransactionService.mobileMoneyTransfer({
                operator: operator.id,
                phoneNumber: cleanPhone,
                amount: numAmount,
              });
              setTransferAmount(numAmount);
              setStep('success');
              showSuccess(`Transfert de ${formatAmount(numAmount)} Ar vers ${operator.name} réussi !`);
              setTimeout(() => {
                navigation.navigate('Wallet' as never);
              }, 2000);
            } catch (e: any) {
              console.error('❌ Erreur transfert Mobile Money:', e);
              showError(e?.message || e?.response?.data?.message || 'Erreur lors du transfert');
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const goBack = () => {
    if (step === 'form') {
      setStep('operator');
      setOperator(null);
      setPhone('');
      setAmount('');
    } else {
      navigation.goBack();
    }
  };

  // ✅ Formater l'affichage avec espaces pour la lisibilité
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

  // ✅ Fonction pour gérer la saisie - STOCKER LES CHIFFRES BRUTS
  const handlePhoneChange = (text: string) => {
    // ✅ Garder uniquement les chiffres
    const clean = text.replace(/\D/g, '');
    // ✅ Limiter à 10 chiffres
    if (clean.length <= PHONE_LENGTH) {
      setPhone(clean);
    }
  };

  const cleanPhone = phone.replace(/\s/g, '');
  const isPhoneComplete = cleanPhone.length === PHONE_LENGTH;
  const prefixError = cleanPhone.length >= 3 && operator && cleanPhone.substring(0, 3) !== operator.prefix;

  if (step === 'success') {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={48} color={COLORS.white} />
        </View>
        <Text style={[styles.successTitle, { color: colors.text }]}>Transfert réussi !</Text>
        <Text style={styles.successSub}>
          {formatAmount(transferAmount)} Ar envoyés vers {operator?.name}
        </Text>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: COLORS.primary, marginTop: SPACING.xl }]}
          onPress={() => {
            setStep('operator');
            setOperator(null);
            setPhone('');
            setAmount('');
            setTransferAmount(0);
            loadBalance();
          }}
        >
          <Text style={styles.primaryBtnText}>Nouveau transfert</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: SPACING.lg, paddingTop: 60 }}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Mobile Money</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[styles.balanceBanner, { backgroundColor: COLORS.primaryLight }]}>
        <Text style={styles.balanceBannerLabel}>Solde disponible</Text>
        <Text style={styles.balanceBannerValue}>{formatAmount(balance)} Ar</Text>
      </View>

      {step === 'operator' && (
        <View style={{ gap: SPACING.md }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Choisissez votre opérateur
          </Text>
          {OPERATORS.map((op) => (
            <TouchableOpacity
              key={op.id}
              style={[styles.operatorCard, { backgroundColor: op.color }]}
              onPress={() => selectOperator(op)}
              activeOpacity={0.7}
            >
              <View style={styles.operatorIcon}>
                <Ionicons name="phone-portrait" size={26} color={COLORS.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.operatorName}>{op.name}</Text>
                <Text style={styles.operatorPrefix}>{op.prefix} XX XXX XX (10 chiffres)</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {step === 'form' && operator && (
        <View>
          <View style={[styles.operatorBadge, { backgroundColor: operator.color }]}>
            <Ionicons name="phone-portrait" size={18} color={COLORS.white} />
            <Text style={styles.operatorBadgeText}>{operator.name}</Text>
            <TouchableOpacity 
              style={styles.changeOperatorBtn}
              onPress={() => {
                setStep('operator');
                setOperator(null);
                setPhone('');
              }}
            >
              <Text style={styles.changeOperatorText}>Changer</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Numéro de téléphone (10 chiffres)</Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Exemple : {operator.prefix} 04 311 05
          </Text>
          
          {/* ✅ TextInput SIMPLE - sans formatage dans le value */}
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
            value={formatPhoneDisplay(phone)} // ✅ Affichage formaté
            onChangeText={handlePhoneChange} // ✅ Stockage des chiffres bruts
            keyboardType="number-pad" // ✅ Clavier numérique pur
            placeholder={`${operator.prefix} 04 311 05`}
            placeholderTextColor={COLORS.gray400}
            maxLength={PHONE_LENGTH + 5} // ✅ Permet les espaces
          />
          
          {cleanPhone.length > 0 && cleanPhone.length < PHONE_LENGTH && (
            <Text style={styles.errorHint}>
              ⚠️ {cleanPhone.length}/{PHONE_LENGTH} chiffres saisis
            </Text>
          )}
          
          {prefixError && (
            <Text style={styles.errorHint}>
              ⚠️ Le numéro doit commencer par {operator.prefix}
            </Text>
          )}
          
          {isPhoneComplete && !prefixError && (
            <Text style={styles.successHint}>
              ✅ Numéro valide : {formatPhoneDisplay(phone)}
            </Text>
          )}

          <Text style={[styles.label, { color: colors.text }]}>Montant (Ar)</Text>
          <TextInput
            style={[styles.amountInput, { color: colors.text, backgroundColor: colors.card }]}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={COLORS.gray400}
          />

          {numAmount > 0 && (
            <View style={[styles.feeCard, { backgroundColor: colors.card }]}>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Montant</Text>
                <Text style={[styles.feeValue, { color: colors.text }]}>
                  {formatAmount(numAmount)} Ar
                </Text>
              </View>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Frais ({FEE_PERCENT}%)</Text>
                <Text style={[styles.feeValue, { color: colors.text }]}>
                  {formatAmount(fee)} Ar
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.feeRow}>
                <Text style={[styles.feeLabel, { fontWeight: FONT.weight.bold }]}>
                  Total à débiter
                </Text>
                <Text style={styles.totalValue}>{formatAmount(total)} Ar</Text>
              </View>
              {total > balance && (
                <Text style={styles.warningText}>⚠ Solde insuffisant</Text>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: operator.color }]}
            onPress={submit}
            disabled={loading || total > balance || !isPhoneComplete || prefixError}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.primaryBtnText}>Confirmer le transfert</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  headerTitle: { fontSize: FONT.size.lg, fontWeight: FONT.weight.bold },
  balanceBanner: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  balanceBannerLabel: { fontSize: FONT.size.xs, color: COLORS.primary },
  balanceBannerValue: {
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
    color: COLORS.primary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.bold,
    marginBottom: SPACING.sm,
  },
  operatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOW.sm,
  },
  operatorIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  operatorName: { color: COLORS.white, fontSize: FONT.size.base, fontWeight: FONT.weight.bold },
  operatorPrefix: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: FONT.size.xs,
    marginTop: 2,
  },
  operatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    alignSelf: 'flex-start',
    borderRadius: RADIUS.full,
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  operatorBadgeText: { color: COLORS.white, fontWeight: FONT.weight.bold, fontSize: FONT.size.sm, flex: 1 },
  changeOperatorBtn: { paddingHorizontal: 8, paddingVertical: 2 },
  changeOperatorText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, textDecorationLine: 'underline' },
  label: {
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  hint: { fontSize: 11, marginBottom: 6, color: COLORS.gray400 },
  input: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT.size.base,
    ...SHADOW.sm,
  },
  amountInput: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT.size.xl,
    fontWeight: FONT.weight.bold,
    ...SHADOW.sm,
  },
  feeCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
    ...SHADOW.sm,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  feeLabel: { color: COLORS.gray500, fontSize: FONT.size.sm },
  feeValue: { fontSize: FONT.size.sm, fontWeight: FONT.weight.semibold },
  totalValue: {
    fontSize: FONT.size.base,
    fontWeight: FONT.weight.extrabold,
    color: COLORS.primary,
  },
  divider: { height: 1, backgroundColor: COLORS.gray100, marginVertical: SPACING.xs },
  warningText: {
    color: COLORS.error,
    fontSize: FONT.size.xs,
    marginTop: SPACING.sm,
    fontWeight: FONT.weight.semibold,
  },
  errorHint: {
    color: COLORS.error,
    fontSize: FONT.size.xs,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  successHint: {
    color: COLORS.success,
    fontSize: FONT.size.xs,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  primaryBtn: {
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: SPACING.xl,
    ...SHADOW.md,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontWeight: FONT.weight.bold,
    fontSize: FONT.size.base,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  successTitle: {
    fontSize: FONT.size.xl,
    fontWeight: FONT.weight.bold,
    marginBottom: SPACING.sm,
  },
  successSub: { color: COLORS.gray400, textAlign: 'center' },
});