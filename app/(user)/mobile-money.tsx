import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { WalletService } from '../../src/services/WalletService';
import { TransactionService } from '../../src/services/TransactionService';
import { COLORS, RADIUS, SPACING, FONT, SHADOW, formatAmount } from '../../src/config';

const OPERATORS = [
  { id: 'airtel', name: 'Airtel Money', color: '#E60000', prefix: '033' },
  { id: 'orange', name: 'Orange Money', color: '#FF7900', prefix: '032' },
  { id: 'mvola', name: 'MVola', color: '#E91E63', prefix: '034' },
] as const;

const MIN_AMOUNT = 100;
const MINIMUM_FEE = 200;
const FEE_PERCENT = 0.5;

export default function MobileMoneyScreen() {
  const { colors } = useTheme();
  const { showError } = useNotification();
  const [balance, setBalance] = useState(0);
  const [operator, setOperator] = useState<typeof OPERATORS[number] | null>(null);
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'operator' | 'form' | 'success'>('operator');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    WalletService.getWallet().then((w) => setBalance(w.balance ?? 0)).catch(() => {});
  }, []);

  const numAmount = Number(amount) || 0;
  const fee = numAmount > 0 ? Math.max(Math.ceil((numAmount * FEE_PERCENT) / 100), MINIMUM_FEE) : 0;
  const total = numAmount + fee;

  const selectOperator = (op: typeof OPERATORS[number]) => {
    setOperator(op);
    setPhone(op.prefix);
    setStep('form');
  };

  const submit = async () => {
    if (!operator) return;
    if (numAmount < MIN_AMOUNT) return showError(`Montant minimum : ${formatAmount(MIN_AMOUNT)} Ar`);
    if (!/^[0-9]{9,10}$/.test(phone.replace(/\s/g, ''))) return showError('Numéro invalide (9-10 chiffres)');
    if (total > balance) return showError(`Solde insuffisant. Total avec frais : ${formatAmount(total)} Ar`);

    setLoading(true);
    try {
      await TransactionService.mobileMoneyTransfer(operator.id, phone.replace(/\s/g, ''), numAmount);
      setStep('success');
      setTimeout(() => router.replace('/(user)/wallet'), 1800);
    } catch (e: any) {
      showError(e?.response?.data?.message || 'Erreur lors du transfert');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={48} color={COLORS.white} />
        </View>
        <Text style={[styles.successTitle, { color: colors.text }]}>Transfert réussi !</Text>
        <Text style={styles.successSub}>{formatAmount(numAmount)} Ar envoyés vers {operator?.name}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: SPACING.lg, paddingTop: 60 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (step === 'form' ? setStep('operator') : router.back())}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Mobile Money</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.balanceBanner}>
        <Text style={styles.balanceBannerLabel}>Solde disponible</Text>
        <Text style={styles.balanceBannerValue}>{formatAmount(balance)} Ar</Text>
      </View>

      {step === 'operator' && (
        <View style={{ gap: SPACING.md }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Choisissez votre opérateur</Text>
          {OPERATORS.map((op) => (
            <TouchableOpacity
              key={op.id}
              style={[styles.operatorCard, { backgroundColor: op.color }]}
              onPress={() => selectOperator(op)}
            >
              <View style={styles.operatorIcon}>
                <Ionicons name="phone-portrait" size={26} color={COLORS.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.operatorName}>{op.name}</Text>
                <Text style={styles.operatorPrefix}>{op.prefix} XXX XXX</Text>
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
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Numéro de téléphone</Text>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.card }]}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="034 12 345 67"
            placeholderTextColor={COLORS.gray400}
          />

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
                <Text style={[styles.feeValue, { color: colors.text }]}>{formatAmount(numAmount)} Ar</Text>
              </View>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Frais ({FEE_PERCENT}%)</Text>
                <Text style={[styles.feeValue, { color: colors.text }]}>{formatAmount(fee)} Ar</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.feeRow}>
                <Text style={[styles.feeLabel, { fontWeight: FONT.weight.bold }]}>Total à débiter</Text>
                <Text style={styles.totalValue}>{formatAmount(total)} Ar</Text>
              </View>
              {total > balance && (
                <Text style={styles.warningText}>⚠ Solde insuffisant</Text>
              )}
            </View>
          )}

          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: operator.color }]} onPress={submit} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.primaryBtnText}>Confirmer le transfert</Text>}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.lg },
  headerTitle: { fontSize: FONT.size.lg, fontWeight: FONT.weight.bold },

  balanceBanner: { backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.xl },
  balanceBannerLabel: { fontSize: FONT.size.xs, color: COLORS.primary },
  balanceBannerValue: { fontSize: FONT.size.lg, fontWeight: FONT.weight.bold, color: COLORS.primary, marginTop: 2 },

  sectionTitle: { fontSize: FONT.size.md, fontWeight: FONT.weight.bold, marginBottom: SPACING.sm },
  operatorCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: RADIUS.lg, padding: SPACING.lg, ...SHADOW.sm },
  operatorIcon: { width: 48, height: 48, borderRadius: RADIUS.md, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  operatorName: { color: COLORS.white, fontSize: FONT.size.base, fontWeight: FONT.weight.bold },
  operatorPrefix: { color: 'rgba(255,255,255,0.85)', fontSize: FONT.size.xs, marginTop: 2 },

  operatorBadge: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, alignSelf: 'flex-start', borderRadius: RADIUS.full, paddingVertical: 6, paddingHorizontal: SPACING.md, marginBottom: SPACING.lg },
  operatorBadgeText: { color: COLORS.white, fontWeight: FONT.weight.bold, fontSize: FONT.size.sm },

  label: { fontSize: FONT.size.sm, fontWeight: FONT.weight.semibold, marginBottom: SPACING.xs, marginTop: SPACING.md },
  input: { borderRadius: RADIUS.md, padding: SPACING.md, fontSize: FONT.size.base, ...SHADOW.sm },
  amountInput: { borderRadius: RADIUS.md, padding: SPACING.md, fontSize: FONT.size.xl, fontWeight: FONT.weight.bold, ...SHADOW.sm },

  feeCard: { borderRadius: RADIUS.lg, padding: SPACING.lg, marginTop: SPACING.lg, ...SHADOW.sm },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  feeLabel: { color: COLORS.gray500, fontSize: FONT.size.sm },
  feeValue: { fontSize: FONT.size.sm, fontWeight: FONT.weight.semibold },
  totalValue: { fontSize: FONT.size.base, fontWeight: FONT.weight.extrabold, color: COLORS.primary },
  divider: { height: 1, backgroundColor: COLORS.gray100, marginVertical: SPACING.xs },
  warningText: { color: COLORS.error, fontSize: FONT.size.xs, marginTop: SPACING.sm, fontWeight: FONT.weight.semibold },

  primaryBtn: { borderRadius: RADIUS.md, paddingVertical: 16, alignItems: 'center', marginTop: SPACING.xl, ...SHADOW.md },
  primaryBtnText: { color: COLORS.white, fontWeight: FONT.weight.bold, fontSize: FONT.size.base },

  successIcon: { width: 96, height: 96, borderRadius: RADIUS.full, backgroundColor: COLORS.success, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg },
  successTitle: { fontSize: FONT.size.xl, fontWeight: FONT.weight.bold, marginBottom: SPACING.sm },
  successSub: { color: COLORS.gray400, textAlign: 'center' },
});