// app/(user)/scan-pay.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { COLORS } from '../../src/config/colors';
import { useTranslation } from '../../src/services/TranslationService';
import { SafeScreen } from '../../src/components/SafeScreen';

// ✅ Importer CameraView conditionnellement
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function ScanPayScreen() {
  const { colors } = useTheme();
  const { showError, showSuccess } = useNotification();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isWeb, setIsWeb] = useState(false);

  useEffect(() => {
    // ✅ Vérifier si on est sur web
    setIsWeb(Platform.OS === 'web');
    
    // ✅ Demander la permission seulement sur mobile
    if (Platform.OS !== 'web') {
      checkPermission();
    } else {
      // ✅ Sur web, simuler une permission pour l'UI
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
      // ✅ Traiter le QR code scanné
      console.log('📱 QR Code scanné:', data);
      
      // ✅ Simuler un traitement
      setTimeout(() => {
        Alert.alert(
          t('scan_qr_code'),
          `QR Code détecté: ${data.substring(0, 20)}...`,
          [
            { 
              text: t('cancel'), 
              style: 'cancel',
              onPress: () => {
                setScanned(false);
                setLoading(false);
              }
            },
            {
              text: t('send'),
              onPress: () => {
                showSuccess(t('success'));
                navigation.goBack();
              }
            }
          ]
        );
        setLoading(false);
      }, 1000);
    } catch (error) {
      showError(t('error'));
      setScanned(false);
      setLoading(false);
    }
  };

  const handleSimulateScan = () => {
    // ✅ Simulation pour le web
    handleBarCodeScanned({ data: 'SPAYE-USER-12345' });
  };

  // ✅ Rendu pour le web
  if (isWeb) {
    return (
      <SafeScreen backgroundColor={colors.background}>
        <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('scan_qr_code')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.webContainer}>
          <View style={[styles.webCard, { backgroundColor: colors.card }]}>
            <Ionicons name="camera-outline" size={64} color={COLORS.primary} />
            <Text style={[styles.webTitle, { color: colors.text }]}>
              {t('scan_qr_code')}
            </Text>
            <Text style={[styles.webSubtitle, { color: colors.textSecondary }]}>
              La caméra n'est pas disponible sur le navigateur web.
            </Text>
            <TouchableOpacity
              style={[styles.simulateBtn, { backgroundColor: COLORS.primary }]}
              onPress={handleSimulateScan}
            >
              <Text style={styles.simulateBtnText}>Simuler un scan</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('scan_qr_code')}</Text>
        <View style={{ width: 40 }} />
      </View>

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
          </View>
        </CameraView>
      </View>

      <View style={styles.bottomBar}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.white} />
            <Text style={styles.loadingText}>Traitement...</Text>
          </View>
        )}
        <Text style={[styles.hintText, { color: colors.textSecondary }]}>
          {t('scan_hint')}
        </Text>
        <TouchableOpacity
          style={[styles.cancelBtn, { backgroundColor: COLORS.error }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  cameraContainer: { flex: 1, position: 'relative' },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  scanFrame: {
    position: 'absolute',
    top: '25%',
    left: '15%',
    right: '15%',
    bottom: '25%',
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: 'rgba(99, 102, 241, 0.6)',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomBar: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
  },
  hintText: {
    fontSize: 14,
    color: COLORS.white,
    marginBottom: 16,
    textAlign: 'center',
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  cancelBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  loadingText: {
    color: COLORS.white,
    marginTop: 12,
    fontSize: 14,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginHorizontal: 32,
  },
  permissionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 20,
  },
  permissionBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Styles web
  webContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  webCard: {
    width: '100%',
    maxWidth: 400,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  webTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  webSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  simulateBtn: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  simulateBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});