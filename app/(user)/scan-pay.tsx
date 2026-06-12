import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { WalletService } from '../../src/services/WalletService';
import { TransactionService } from '../../src/services/TransactionService';
import { COLORS, formatAmount } from '../../src/config';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function ScanPayScreen() {
  const { colors } = useTheme();
  const { showError, showSuccess } = useNotification();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [scannedData, setScannedData] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const handleScan = (result: any) => {
    if (!scanning) return;
    setScanning(false);
    try {
      const data = JSON.parse(result.data);
      if (data.type === 'payment_request' || data.type === 'payment') {
        setScannedData(data);
      } else throw new Error();
    } catch {
      showError('QR code invalide');
      setScanning(true);
    }
  };

  const pay = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 100) return showError('Montant minimum 100 Ar');
    setLoading(true);
    try {
      await TransactionService.scanAndPay({ receiverQrCode: scannedData.qrCode, amount: amt, description: desc });
      showSuccess(`Paiement de ${formatAmount(amt)} Ar effectué`);
      router.back();
    } catch (e: any) { showError(e.response?.data?.message || 'Erreur paiement'); }
    finally { setLoading(false); }
  };

  if (!scanning && scannedData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
          <TouchableOpacity onPress={() => { setScanning(true); setScannedData(null); }}><Text style={styles.backText}>←</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Paiement</Text><View style={{ width: 40 }} />
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Destinataire : {scannedData.receiverName || 'Utilisateur SPaye'}</Text>
          <TextInput style={styles.input} placeholder="Montant (Ar)" keyboardType="numeric" value={amount} onChangeText={setAmount} />
          <TextInput style={styles.input} placeholder="Description (optionnelle)" value={desc} onChangeText={setDesc} />
          <TouchableOpacity style={styles.payButton} onPress={pay} disabled={loading}>
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.payButtonText}>Payer</Text>}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!permission?.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ marginTop: 100, textAlign: 'center' }}>Permission caméra requise</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}><Text>Autoriser</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Scanner</Text><View style={{ width: 40 }} />
      </View>
      <CameraView style={styles.camera} facing="back" onBarcodeScanned={handleScan} barcodeScannerSettings={{ barcodeTypes: ['qr'] }} />
      <Text style={styles.instruction}>Placez le QR code dans le cadre</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  backText: { fontSize: 24, color: COLORS.white },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  camera: { flex: 1, marginHorizontal: 20, marginTop: 20, borderRadius: 20, overflow: 'hidden' },
  instruction: { textAlign: 'center', marginVertical: 20, color: COLORS.gray600 },
  card: { backgroundColor: COLORS.white, margin: 20, padding: 20, borderRadius: 16 },
  label: { fontSize: 16, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: COLORS.gray300, borderRadius: 12, padding: 12, marginBottom: 16 },
  payButton: { backgroundColor: COLORS.primary, padding: 14, borderRadius: 12, alignItems: 'center' },
  payButtonText: { color: 'white', fontWeight: 'bold' },
  permissionBtn: { backgroundColor: COLORS.primary, padding: 12, margin: 20, borderRadius: 8, alignItems: 'center' },
});