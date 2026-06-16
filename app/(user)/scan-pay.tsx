import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { TransactionService } from '../../src/services/TransactionService';
import { COLORS, RADIUS, SPACING, FONT, SHADOW, formatAmount } from '../../src/config';

export default function ScanPayScreen() {
  const { colors } = useTheme();
  const { showError } = useNotification();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'scan' | 'pay' | 'success'>('scan');

  const onScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    try {
      const parsed = JSON.parse(data);
      setScanned(parsed);
      if (parsed.amount) setAmount(String(parsed.amount));
      setStep('pay');
    } catch {
      showError('QR code invalide');
    }
  };

  const pay = async () => {
    const numAmount = Number(amount) || 0;
    if (numAmount < 100) return showError('Montant minimum : 100 Ar');
    setLoading(true);
    try {
      await TransactionService.scanAndPay(scanned.qrCode, numAmount, description || undefined);
      setStep('success');
      setTimeout(() => router.replace('/(user)/wallet'), 1800);
    } catch (e: any) {
      showError(e?.response?.data?.message || 'Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setScanned(null);
    setAmount('');
    setDescription('');
    setStep('scan');
  };

  if (step === 'success') {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={48} color={COLORS.white} />
        </View>
        <Text style={[styles.successTitle, { color: colors.text }]}>Paiement effectué !</Text>
        <Text style={styles.successSub}>{formatAmount(Number(amount))} Ar payés avec succès</Text>
      </View>
    );
  }

  if (step === 'pay') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={reset}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Paiement</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={[styles.scannedCard, { backgroundColor: colors.card }]}>
          <Ionicons name="qr-code" size={28} color={COLORS.primary} />
          <Text style={[styles.scannedText, { color: colors.text }]} numberOfLines={1}>{scanned.qrCode}</Text>
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Montant (Ar)</Text>
        <TextInput
          style={[styles.amountInput, { color: colors.text, backgroundColor: colors.card }]}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={COLORS.gray400}
        />

        <View style={styles.presetsRow}>
          {[1000, 5000, 10000, 20000].map((p) => (
            <TouchableOpacity key={p} style={styles.presetBtn} onPress={() => setAmount(String(p))}>
              <Text style={styles.presetText}>{formatAmount(p)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Description (optionnel)</Text>
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.card }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Ex: Paiement repas..."
          placeholderTextColor={COLORS.gray400}
        />

        <TouchableOpacity style={styles.primaryBtn} onPress={pay} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.primaryBtnText}>Payer {amount ? formatAmount(Number(amount)) : 0} Ar</Text>}
        </TouchableOpacity>
      </View>
    );
  }

  // step === 'scan'
  if (!permission) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator color={COLORS.primary} /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="camera-outline" size={56} color={COLORS.gray400} />
        <Text style={[styles.permTitle, { color: colors.text }]}>Accès caméra requis</Text>
        <Text style={styles.permText}>SPaye a besoin d'accéder à la caméra pour scanner les QR codes.</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
          <Text style={styles.primaryBtnText}>Autoriser la caméra</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: SPACING.lg }} onPress={() => router.back()}>
          <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={onScanned}
      />
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={26} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.frame} />
        <Text style={styles.scanHint}>Placez le QR code dans le cadre</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.lg, paddingTop: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.lg },
  headerTitle: { fontSize: FONT.size.lg, fontWeight: FONT.weight.bold },

  cameraContainer: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  closeBtn: { position: 'absolute', top: 60, right: 24, width: 40, height: 40, borderRadius: RADIUS.full, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  frame: { width: 240, height: 240, borderWidth: 3, borderColor: COLORS.white, borderRadius: RADIUS.lg },
  scanHint: { color: COLORS.white, marginTop: SPACING.lg, fontSize: FONT.size.sm },

  permTitle: { fontSize: FONT.size.lg, fontWeight: FONT.weight.bold, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  permText: { color: COLORS.gray400, textAlign: 'center', marginBottom: SPACING.xl },

  scannedCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg, ...SHADOW.sm },
  scannedText: { flex: 1, fontSize: FONT.size.sm, fontFamily: 'monospace' },

  label: { fontSize: FONT.size.sm, fontWeight: FONT.weight.semibold, marginBottom: SPACING.xs, marginTop: SPACING.md },
  amountInput: { borderRadius: RADIUS.md, padding: SPACING.md, fontSize: FONT.size.xl, fontWeight: FONT.weight.bold, ...SHADOW.sm },
  input: { borderRadius: RADIUS.md, padding: SPACING.md, fontSize: FONT.size.base, ...SHADOW.sm },

  presetsRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  presetBtn: { paddingVertical: 6, paddingHorizontal: SPACING.md, borderRadius: RADIUS.full, backgroundColor: COLORS.gray100 },
  presetText: { fontSize: FONT.size.xs, color: COLORS.gray600, fontWeight: FONT.weight.medium },

  primaryBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 16, alignItems: 'center', marginTop: SPACING.xl, ...SHADOW.md },
  primaryBtnText: { color: COLORS.white, fontWeight: FONT.weight.bold, fontSize: FONT.size.base },

  successIcon: { width: 96, height: 96, borderRadius: RADIUS.full, backgroundColor: COLORS.success, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg },
  successTitle: { fontSize: FONT.size.xl, fontWeight: FONT.weight.bold, marginBottom: SPACING.sm },
  successSub: { color: COLORS.gray400, textAlign: 'center' },
});