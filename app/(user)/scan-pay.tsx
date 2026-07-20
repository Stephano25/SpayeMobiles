// app/(user)/scan-pay.tsx
// ✅ Détection des QR Codes admin
// ✅ Redirection vers le bon formulaire
// ✅ Formulaire de dépôt/retrait selon le QR scanné

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { AdminService } from '../../src/services/AdminService';
import { WalletService } from '../../src/services/WalletService';
import { COLORS, formatAmount } from '../../src/config/colors';
import { SafeScreen } from '../../src/components/SafeScreen';
import { useTranslation } from '../../src/services/TranslationService';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function ScanPayScreen() {
  const { colors } = useTheme();
  const { showSuccess, showError } = useNotification();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  
  const scanType = (route.params as any)?.type || 'payment';
  
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isWeb, setIsWeb] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAdminQR, setIsAdminQR] = useState(false);

  useEffect(() => {
    setIsWeb(Platform.OS === 'web');
    if (Platform.OS !== 'web') {
      checkPermission();
    } else {
      setHasPermission(true);
    }
  }, []);

  const checkPermission = async () => {
    if (cameraPermission?.status === 'granted') {
      setHasPermission(true);
    } else {
      const { status } = await requestCameraPermission();
      setHasPermission(status === 'granted');
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);

    try {
      console.log('📱 QR Code scanné (User):', data);
      
      let parsedData;
      try {
        parsedData = JSON.parse(data);
      } catch {
        parsedData = { qrCode: data, type: 'simple' };
      }

      setScannedData(parsedData);
      
      // ✅ DÉTECTER SI C'EST UN QR CODE ADMIN
      const isAdmin = parsedData.type === 'admin_transaction' || 
                      parsedData.adminId || 
                      parsedData.adminName ||
                      parsedData.action === 'deposit' ||
                      parsedData.action === 'withdraw';
      
      setIsAdminQR(isAdmin);
      
      if (isAdmin) {
        // ✅ QR CODE ADMIN - Rediriger vers le bon formulaire
        const action = parsedData.action || 'deposit';
        const userId = parsedData.userId || parsedData.id || parsedData._id;
        const userName = parsedData.userName || 'Utilisateur SPaye';
        
        Alert.alert(
          action === 'deposit' ? '💰 Dépôt Admin' : '💸 Retrait Admin',
          `QR Code ${action === 'deposit' ? 'de dépôt' : 'de retrait'} détecté\n\n` +
          `Administrateur: ${parsedData.adminName || 'Administrateur'}\n` +
          `Utilisateur: ${userName}`,
          [
            { 
              text: 'Annuler', 
              style: 'cancel',
              onPress: () => {
                setScanned(false);
                setLoading(false);
              }
            },
            {
              text: 'Continuer',
              onPress: () => {
                setShowForm(true);
                setLoading(false);
                if (parsedData.amount) {
                  setAmount(String(parsedData.amount));
                }
                // ✅ Stocker l'ID utilisateur
                if (userId) {
                  setScannedData({ ...parsedData, userId: userId });
                }
              }
            }
          ]
        );
      } else {
        // ✅ QR CODE NORMAL (paiement entre utilisateurs)
        Alert.alert(
          '💳 Paiement',
          `Paiement détecté\n\nDestinataire: ${parsedData.receiverName || 'Utilisateur SPaye'}`,
          [
            { 
              text: 'Annuler', 
              style: 'cancel',
              onPress: () => {
                setScanned(false);
                setLoading(false);
              }
            },
            {
              text: 'Payer',
              onPress: () => {
                setShowForm(true);
                setLoading(false);
                if (parsedData.amount) {
                  setAmount(String(parsedData.amount));
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Erreur traitement QR:', error);
      showError('QR Code invalide');
      setScanned(false);
      setLoading(false);
    }
  };

  // ✅ Simulation pour le web
  const handleSimulateScan = () => {
    const simulatedData = {
      type: 'admin_transaction',
      action: scanType === 'deposit' ? 'deposit' : scanType === 'withdraw' ? 'withdraw' : 'payment',
      adminId: 'admin-simulated',
      adminName: 'Admin SPaye',
      userId: '6a5d03030c081d897fe5a4f3',
      userName: 'Utilisateur Test',
      amount: scanType === 'deposit' ? 5000 : 2000,
      qrCode: 'SPAYE-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };
    handleBarCodeScanned({ data: JSON.stringify(simulatedData) });
  };

  // ✅ Traitement du formulaire
  const handleSubmit = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum < 100) {
      showError('Montant minimum: 100 Ar');
      return;
    }

    setIsProcessing(true);

    try {
      if (isAdminQR) {
        // ✅ TRANSACTION ADMIN
        const action = scannedData?.action || 'deposit';
        const userId = scannedData?.userId;
        
        if (!userId) {
          showError('ID utilisateur non trouvé');
          setIsProcessing(false);
          return;
        }

        if (action === 'deposit') {
          await AdminService.depositMoney(
            userId,
            amountNum,
            description || `Dépôt via QR Code Admin`
          );
          showSuccess(`💰 Dépôt de ${formatAmount(amountNum)} Ar effectué`);
        } else if (action === 'withdraw') {
          await AdminService.withdrawMoney(
            userId,
            amountNum,
            description || `Retrait via QR Code Admin`
          );
          showSuccess(`💸 Retrait de ${formatAmount(amountNum)} Ar effectué`);
        } else {
          // Paiement simple
          await WalletService.sendMoney({
            receiverId: userId,
            amount: amountNum,
            description: description || 'Paiement via QR Code',
          });
          showSuccess(`Paiement de ${formatAmount(amountNum)} Ar effectué`);
        }
      } else {
        // ✅ TRANSACTION NORMALE
        await WalletService.sendMoney({
          receiverId: scannedData?.receiverId || scannedData?.userId,
          amount: amountNum,
          description: description || 'Paiement via QR Code',
        });
        showSuccess(`Paiement de ${formatAmount(amountNum)} Ar effectué`);
      }

      setShowForm(false);
      setScannedData(null);
      setAmount('');
      setDescription('');
      setIsProcessing(false);
      navigation.goBack();
    } catch (error: any) {
      showError(error?.message || 'Erreur lors de la transaction');
      setIsProcessing(false);
    }
  };

  // ✅ Rendu pour le web
  if (isWeb) {
    return (
      <SafeScreen backgroundColor={colors.background}>
        <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {scanType === 'deposit' ? 'Dépôt' : scanType === 'withdraw' ? 'Retrait' : t('scan_qr_code')}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {showForm ? (
          <View style={[styles.formContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>
              {isAdminQR ? (scannedData?.action === 'deposit' ? '💰 Dépôt Admin' : '💸 Retrait Admin') : '💳 Paiement'}
            </Text>
            
            {scannedData?.userName && (
              <Text style={[styles.userNameText, { color: colors.text }]}>
                Utilisateur: {scannedData.userName}
              </Text>
            )}
            {scannedData?.adminName && (
              <Text style={[styles.adminNameText, { color: colors.textSecondary }]}>
                Admin: {scannedData.adminName}
              </Text>
            )}

            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="Montant (Ar)"
              placeholderTextColor={COLORS.gray400}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="Description (optionnelle)"
              placeholderTextColor={COLORS.gray400}
              value={description}
              onChangeText={setDescription}
            />

            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.formBtn, styles.cancelBtn]}
                onPress={() => {
                  setShowForm(false);
                  setScannedData(null);
                  setAmount('');
                  setDescription('');
                  setScanned(false);
                }}
              >
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formBtn, styles.confirmBtn, { backgroundColor: COLORS.primary }]}
                onPress={handleSubmit}
                disabled={isProcessing || !amount || parseFloat(amount) < 100}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.confirmBtnText}>
                    {isAdminQR ? (scannedData?.action === 'deposit' ? 'Déposer' : 'Retirer') : 'Payer'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.webContainer}>
            <View style={[styles.webCard, { backgroundColor: colors.card }]}>
              <Ionicons name="camera-outline" size={64} color={COLORS.primary} />
              <Text style={[styles.webTitle, { color: colors.text }]}>
                {scanType === 'deposit' ? 'Dépôt par QR Code' : 
                 scanType === 'withdraw' ? 'Retrait par QR Code' : 
                 t('scan_qr_code')}
              </Text>
              <Text style={[styles.webSubtitle, { color: colors.textSecondary }]}>
                La caméra n'est pas disponible sur le navigateur web.
              </Text>
              <TouchableOpacity
                style={[styles.simulateBtn, { backgroundColor: COLORS.primary }]}
                onPress={handleSimulateScan}
              >
                <Text style={styles.simulateBtnText}>
                  {scanType === 'deposit' ? 'Simuler un dépôt' : 
                   scanType === 'withdraw' ? 'Simuler un retrait' : 
                   'Simuler un scan'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeScreen>
    );
  }

  // ✅ Rendu pour mobile
  if (hasPermission === null) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 12, color: colors.textSecondary }}>{t('loading')}</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="camera-off-outline" size={64} color={COLORS.gray400} />
        <Text style={[styles.permissionText, { color: colors.text }]}>
          {t('scan_hint')}
        </Text>
        <TouchableOpacity
          style={[styles.permissionBtn, { backgroundColor: COLORS.primary }]}
          onPress={checkPermission}
        >
          <Text style={styles.permissionBtnText}>Autoriser la caméra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeScreen backgroundColor={colors.background}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {scanType === 'deposit' ? 'Dépôt' : scanType === 'withdraw' ? 'Retrait' : t('scan_qr_code')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {showForm ? (
        <ScrollView style={[styles.formContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.formTitle, { color: colors.text }]}>
            {isAdminQR ? (scannedData?.action === 'deposit' ? '💰 Dépôt Admin' : '💸 Retrait Admin') : '💳 Paiement'}
          </Text>
          
          {scannedData?.userName && (
            <Text style={[styles.userNameText, { color: colors.text }]}>
              Utilisateur: {scannedData.userName}
            </Text>
          )}
          {scannedData?.adminName && (
            <Text style={[styles.adminNameText, { color: colors.textSecondary }]}>
              Admin: {scannedData.adminName}
            </Text>
          )}

          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            placeholder="Montant (Ar)"
            placeholderTextColor={COLORS.gray400}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />

          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            placeholder="Description (optionnelle)"
            placeholderTextColor={COLORS.gray400}
            value={description}
            onChangeText={setDescription}
          />

          <View style={styles.formActions}>
            <TouchableOpacity
              style={[styles.formBtn, styles.cancelBtn]}
              onPress={() => {
                setShowForm(false);
                setScannedData(null);
                setAmount('');
                setDescription('');
                setScanned(false);
              }}
            >
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.formBtn, styles.confirmBtn, { backgroundColor: COLORS.primary }]}
              onPress={handleSubmit}
              disabled={isProcessing || !amount || parseFloat(amount) < 100}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.confirmBtnText}>
                  {isAdminQR ? (scannedData?.action === 'deposit' ? 'Déposer' : 'Retirer') : 'Payer'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          >
            <View style={styles.overlay}>
              <View style={styles.scanFrame}>
                <View style={[styles.scanCorner, styles.scanCornerTL]} />
                <View style={[styles.scanCorner, styles.scanCornerTR]} />
                <View style={[styles.scanCorner, styles.scanCornerBL]} />
                <View style={[styles.scanCorner, styles.scanCornerBR]} />
                <View style={styles.scanLine} />
              </View>
              <Text style={styles.scanHint}>
                {scanType === 'deposit' ? 'Scannez le QR Code de dépôt' : 
                 scanType === 'withdraw' ? 'Scannez le QR Code de retrait' : 
                 'Placez le QR code dans le cadre'}
              </Text>
            </View>
          </CameraView>
        </View>
      )}
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
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  scanCorner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: COLORS.white,
    borderWidth: 3,
  },
  scanCornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderRadius: 4 },
  scanCornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderRadius: 4 },
  scanCornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderRadius: 4 },
  scanCornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderRadius: 4 },
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: '10%',
    right: '10%',
    height: 3,
    backgroundColor: 'rgba(99,102,241,0.6)',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  scanHint: {
    color: COLORS.white,
    fontSize: 14,
    marginTop: 20,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  permissionText: { fontSize: 16, textAlign: 'center', marginTop: 16, marginHorizontal: 32 },
  permissionBtn: { paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12, marginTop: 20 },
  permissionBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
  formContainer: { margin: 16, padding: 20, borderRadius: 16 },
  formTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  userNameText: { fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 4 },
  adminNameText: { fontSize: 13, textAlign: 'center', marginBottom: 16, opacity: 0.7 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16, marginBottom: 12 },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  formBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: COLORS.gray100 },
  cancelBtnText: { color: COLORS.gray600, fontWeight: '600' },
  confirmBtn: { backgroundColor: COLORS.primary },
  confirmBtnText: { color: COLORS.white, fontWeight: 'bold' },
  webContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  webCard: { width: '100%', maxWidth: 400, padding: 32, borderRadius: 20, alignItems: 'center' },
  webTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 16 },
  webSubtitle: { fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 24 },
  simulateBtn: { paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12 },
  simulateBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
});