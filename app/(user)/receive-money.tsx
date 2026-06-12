import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, ActivityIndicator, ScrollView, Modal, TextInput } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { WalletService } from '../../src/services/WalletService';
import { COLORS, formatAmount } from '../../src/config';
import QRCode from 'react-native-qrcode-svg';
import { router } from 'expo-router';

export default function ReceiveMoneyScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { showError, showSuccess } = useNotification();
  const [qrData, setQrData] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [showAmountPicker, setShowAmountPicker] = useState(false);
  const [expirationTime, setExpirationTime] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState('');

  const amountPresets = [1000, 5000, 10000, 20000, 50000, 100000];

  useEffect(() => { generateQRCode(); }, []);
  useEffect(() => {
    if (!expirationTime) return;
    const interval = setInterval(() => {
      const now = new Date();
      const diff = expirationTime.getTime() - now.getTime();
      if (diff <= 0) { setTimeLeft('Expiré'); clearInterval(interval); }
      else { const minutes = Math.floor(diff / 60000); const seconds = Math.floor((diff % 60000) / 1000); setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`); }
    }, 1000);
    return () => clearInterval(interval);
  }, [expirationTime]);

  const generateQRCode = async (amount?: number) => {
    setIsLoading(true);
    try {
      const response = await WalletService.generateReceiveQRCode(amount);
      const qrDataObj = { type: 'payment_request', receiverId: user?.id, receiverName: `${user?.firstName} ${user?.lastName}`, amount: amount || null, qrCode: response.qrCode, timestamp: new Date().toISOString(), expiresAt: response.expiresAt };
      setQrData(JSON.stringify(qrDataObj));
      setExpirationTime(new Date(response.expiresAt));
      setSelectedAmount(amount || null);
      showSuccess('QR code généré');
    } catch (error) { showError('Erreur génération QR'); } finally { setIsLoading(false); }
  };

  const shareQRCode = async () => {
    try {
      await Share.share({ title: 'Demande de paiement SPaye', message: selectedAmount ? `Je vous demande ${formatAmount(selectedAmount)} Ar. Scannez : ${qrData}` : `Scannez ce QR code pour me payer : ${qrData}` });
    } catch (error) { console.log(error); }
  };

  const handleAmountSelect = (amount: number) => { setSelectedAmount(amount); setCustomAmount(''); generateQRCode(amount); setShowAmountPicker(false); };
  const handleCustomAmount = () => {
    const amount = parseInt(customAmount);
    if (isNaN(amount) || amount < 100) return showError('Montant minimum 100 Ar');
    if (amount > 100000000) return showError('Montant maximum 100 000 000 Ar');
    setSelectedAmount(amount); generateQRCode(amount); setShowAmountPicker(false); setCustomAmount('');
  };

  const getExpirationColor = () => {
    if (!timeLeft || timeLeft === 'Expiré') return COLORS.error;
    const minutes = parseInt(timeLeft.split(':')[0]);
    return minutes < 5 ? COLORS.warning : COLORS.success;
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Text style={styles.backText}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Recevoir de l'argent</Text><View style={{ width: 40 }} />
      </View>
      <View style={[styles.qrCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.qrTitle, { color: colors.text }]}>Mon QR Code</Text>
        <Text style={styles.qrSubtitle}>Scannez ce code pour recevoir de l'argent</Text>
        {isLoading ? (<View style={styles.qrLoading}><ActivityIndicator size="large" color={COLORS.primary} /><Text style={styles.qrLoadingText}>Génération...</Text></View>) : (
          <>
            <View style={styles.qrCodeContainer}><QRCode value={qrData} size={220} color={COLORS.primary} backgroundColor="white" /></View>
            {selectedAmount && (<View style={styles.amountBadge}><Text style={styles.amountBadgeText}>{formatAmount(selectedAmount)} Ar</Text><TouchableOpacity style={styles.amountBadgeRemove} onPress={() => generateQRCode()}><Text style={styles.amountBadgeRemoveText}>✕</Text></TouchableOpacity></View>)}
            <View style={styles.expirationContainer}><Text style={styles.expirationLabel}>Expiration</Text><Text style={[styles.expirationTime, { color: getExpirationColor() }]}>{timeLeft || 'Chargement...'}</Text></View>
            <View style={styles.qrActions}>
              <TouchableOpacity style={styles.qrAction} onPress={shareQRCode}><Text style={styles.qrActionIcon}>📤</Text><Text style={styles.qrActionText}>Partager</Text></TouchableOpacity>
              <TouchableOpacity style={styles.qrAction} onPress={() => setShowAmountPicker(true)}><Text style={styles.qrActionIcon}>💰</Text><Text style={styles.qrActionText}>Montant</Text></TouchableOpacity>
              <TouchableOpacity style={styles.qrAction} onPress={() => generateQRCode(selectedAmount || undefined)}><Text style={styles.qrActionIcon}>🔄</Text><Text style={styles.qrActionText}>Rafraîchir</Text></TouchableOpacity>
            </View>
          </>
        )}
      </View>
      <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.infoTitle, { color: colors.text }]}>Comment ça marche ?</Text>
        <View style={styles.infoStep}><View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View><Text style={[styles.stepText, { color: colors.text }]}>Présentez ce QR code à la personne qui doit vous payer</Text></View>
        <View style={styles.infoStep}><View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View><Text style={[styles.stepText, { color: colors.text }]}>Elle scanne le code avec l'application SPaye</Text></View>
        <View style={styles.infoStep}><View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View><Text style={[styles.stepText, { color: colors.text }]}>L'argent est instantanément ajouté à votre solde</Text></View>
      </View>
      <View style={styles.securityTip}><Text style={styles.securityTipIcon}>🔒</Text><Text style={styles.securityTipText}>Ce QR code expire après 30 minutes pour votre sécurité</Text></View>

      <Modal visible={showAmountPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}><View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: colors.text }]}>Choisir un montant</Text><TouchableOpacity onPress={() => setShowAmountPicker(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity></View>
          <View style={styles.amountGrid}>{amountPresets.map(amount => (<TouchableOpacity key={amount} style={[styles.amountGridButton, selectedAmount === amount && styles.amountGridButtonActive]} onPress={() => handleAmountSelect(amount)}><Text style={[styles.amountGridText, selectedAmount === amount && styles.amountGridTextActive]}>{formatAmount(amount)} Ar</Text></TouchableOpacity>))}</View>
          <View style={styles.customAmountContainer}><TextInput style={[styles.customAmountInput, { borderColor: colors.border, color: colors.text }]} placeholder="Montant personnalisé" value={customAmount} onChangeText={setCustomAmount} keyboardType="numeric" /><TouchableOpacity style={styles.customAmountButton} onPress={handleCustomAmount}><Text style={styles.customAmountButtonText}>Valider</Text></TouchableOpacity></View>
        </View></View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  backButton: { padding: 8 }, backText: { fontSize: 24, color: COLORS.white },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  qrCard: { marginHorizontal: 20, marginTop: 20, borderRadius: 20, padding: 24, alignItems: 'center', shadowColor: COLORS.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  qrTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  qrSubtitle: { fontSize: 14, color: COLORS.gray500, marginBottom: 24 },
  qrLoading: { alignItems: 'center', paddingVertical: 40 },
  qrLoadingText: { marginTop: 16, color: COLORS.gray500 },
  qrCodeContainer: { padding: 16, backgroundColor: COLORS.white, borderRadius: 16, marginBottom: 20 },
  amountBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary + '20', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 16 },
  amountBadgeText: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  amountBadgeRemove: { marginLeft: 8, padding: 4 },
  amountBadgeRemoveText: { fontSize: 14, color: COLORS.primary },
  expirationContainer: { alignItems: 'center', marginBottom: 24 },
  expirationLabel: { fontSize: 12, color: COLORS.gray500, marginBottom: 4 },
  expirationTime: { fontSize: 18, fontWeight: 'bold' },
  qrActions: { flexDirection: 'row', gap: 24 },
  qrAction: { alignItems: 'center', gap: 8 },
  qrActionIcon: { fontSize: 24 },
  qrActionText: { fontSize: 12, color: COLORS.gray600 },
  infoCard: { marginHorizontal: 20, marginTop: 20, borderRadius: 16, padding: 20 },
  infoTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  infoStep: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  stepNumberText: { fontSize: 14, fontWeight: 'bold', color: COLORS.white },
  stepText: { flex: 1, fontSize: 14, lineHeight: 20 },
  securityTip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, marginTop: 20, marginBottom: 40, gap: 8 },
  securityTipIcon: { fontSize: 16 },
  securityTipText: { fontSize: 12, color: COLORS.gray500 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalClose: { fontSize: 20, padding: 8, color: COLORS.gray500 },
  amountGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  amountGridButton: { width: '30%', paddingVertical: 12, backgroundColor: COLORS.gray100, borderRadius: 12, alignItems: 'center' },
  amountGridButtonActive: { backgroundColor: COLORS.primary },
  amountGridText: { fontSize: 14, fontWeight: '500', color: COLORS.gray700 },
  amountGridTextActive: { color: COLORS.white },
  customAmountContainer: { flexDirection: 'row', gap: 12 },
  customAmountInput: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14 },
  customAmountButton: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: COLORS.primary, borderRadius: 12, justifyContent: 'center' },
  customAmountButtonText: { color: COLORS.white, fontWeight: '500' },
});