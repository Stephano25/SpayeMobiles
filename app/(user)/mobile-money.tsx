import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { WalletService } from '../../src/services/WalletService';
import { TransactionService } from '../../src/services/TransactionService';
import { COLORS, formatAmount } from '../../src/config';
import { router } from 'expo-router';

type Operator = { id: 'airtel' | 'orange' | 'mvola'; name: string; icon: string; prefix: string; color: string };

export default function MobileMoneyScreen() {
  const { colors } = useTheme();
  const { showError, showSuccess } = useNotification();
  const [balance, setBalance] = useState(0);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'operator' | 'form' | 'confirm'>('operator');
  const [loading, setLoading] = useState(false);

  const operators: Operator[] = [
    { id: 'airtel', name: 'Airtel Money', icon: '📱', prefix: '033', color: '#e60000' },
    { id: 'orange', name: 'Orange Money', icon: '📱', prefix: '032', color: '#ff7900' },
    { id: 'mvola', name: 'MVola', icon: '📱', prefix: '034', color: '#e91e63' },
  ];

  useEffect(() => { loadBalance(); }, []);
  const loadBalance = async () => { try { const w = await WalletService.getWallet(); setBalance(w.balance); } catch (e) { showError('Erreur solde'); } };

  const calculateFee = () => {
    if (!operator || !amount) return 0;
    const amt = parseFloat(amount);
    let fee = amt * 0.005;
    if (fee < 200) fee = 200;
    return Math.ceil(fee);
  };
  const total = () => parseFloat(amount || '0') + calculateFee();

  const goToConfirm = () => {
    const amt = parseFloat(amount);
    if (!operator) return showError('Choisissez un opérateur');
    if (!phone.match(/^[0-9]{9,10}$/)) return showError('Numéro invalide (9-10 chiffres)');
    if (isNaN(amt) || amt < 100) return showError('Montant minimum 100 Ar');
    if (total() > balance) return showError(`Solde insuffisant (total avec frais : ${formatAmount(total())} Ar)`);
    setStep('confirm');
  };

  const transfer = async () => {
    setLoading(true);
    try {
      await TransactionService.mobileMoneyTransfer({ operator: operator!.id, phoneNumber: phone, amount: parseFloat(amount) });
      showSuccess(`Transfert de ${formatAmount(parseFloat(amount))} Ar réussi`);
      router.back();
    } catch (e: any) { showError(e.response?.data?.message || 'Erreur transfert'); }
    finally { setLoading(false); }
  };

  if (step === 'confirm') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
          <TouchableOpacity onPress={() => setStep('form')}><Text style={styles.backText}>←</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Confirmation</Text><View style={{ width: 40 }} />
        </View>
        <View style={styles.confirmCard}>
          <Text style={styles.confirmTitle}>Vérifiez</Text>
          <View style={styles.row}><Text>Opérateur</Text><Text>{operator?.name}</Text></View>
          <View style={styles.row}><Text>Numéro</Text><Text>{phone}</Text></View>
          <View style={styles.row}><Text>Montant</Text><Text>{formatAmount(parseFloat(amount))} Ar</Text></View>
          <View style={styles.row}><Text>Frais</Text><Text>+ {formatAmount(calculateFee())} Ar</Text></View>
          <View style={styles.row}><Text>Total</Text><Text style={{ fontWeight: 'bold' }}>{formatAmount(total())} Ar</Text></View>
          <View style={styles.row}><Text>Solde après</Text><Text>{formatAmount(balance - total())} Ar</Text></View>
          <TouchableOpacity style={styles.confirmButton} onPress={transfer} disabled={loading}>
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.confirmButtonText}>Confirmer</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStep('form')}><Text style={{ marginTop: 12, color: COLORS.gray600 }}>Retour</Text></TouchableOpacity>
        </View>
      </View>
    );
  }

  if (step === 'form') {
    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
          <TouchableOpacity onPress={() => setStep('operator')}><Text style={styles.backText}>←</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Mobile Money</Text><View style={{ width: 40 }} />
        </View>
        <View style={styles.balanceCard}><Text>Solde : {formatAmount(balance)} Ar</Text></View>
        <View style={styles.formCard}>
          <Text style={styles.label}>Numéro {operator?.name}</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="0341234567" />
          <Text style={styles.label}>Montant (Ar)</Text>
          <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="1000" />
          {amount ? <Text style={styles.fee}>Frais : {formatAmount(calculateFee())} Ar → Total {formatAmount(total())} Ar</Text> : null}
          <TouchableOpacity style={styles.nextButton} onPress={goToConfirm}><Text style={styles.nextButtonText}>Continuer</Text></TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Mobile Money</Text><View style={{ width: 40 }} />
      </View>
      <Text style={styles.sectionTitle}>Choisissez l'opérateur</Text>
      <View style={styles.operatorGrid}>
        {operators.map(op => (
          <TouchableOpacity key={op.id} style={[styles.operatorCard, { backgroundColor: colors.card }]} onPress={() => { setOperator(op); setPhone(op.prefix); setStep('form'); }}>
            <Text style={styles.operatorIcon}>{op.icon}</Text>
            <Text>{op.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  backText: { fontSize: 24, color: COLORS.white },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  balanceCard: { backgroundColor: COLORS.white, margin: 20, padding: 16, borderRadius: 16, alignItems: 'center' },
  formCard: { backgroundColor: COLORS.white, margin: 20, padding: 20, borderRadius: 16 },
  label: { fontSize: 14, fontWeight: 'bold', marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: COLORS.gray300, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  fee: { marginTop: 10, fontSize: 12, color: COLORS.gray600, textAlign: 'center' },
  nextButton: { backgroundColor: COLORS.primary, padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  nextButtonText: { color: 'white', fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginHorizontal: 20, marginVertical: 12 },
  operatorGrid: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 20 },
  operatorCard: { alignItems: 'center', padding: 16, borderRadius: 16, width: '30%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, elevation: 2 },
  operatorIcon: { fontSize: 32, marginBottom: 8 },
  confirmCard: { backgroundColor: COLORS.white, margin: 20, padding: 20, borderRadius: 16 },
  confirmTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
  confirmButton: { backgroundColor: COLORS.primary, padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  confirmButtonText: { color: 'white', fontWeight: 'bold' },
});