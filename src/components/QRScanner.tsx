// src/components/QRScanner.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/colors';

// ✅ Importer CameraView uniquement sur mobile
let CameraView: any = null;
let useCameraPermissions: any = null;

if (Platform.OS !== 'web') {
  try {
    const Camera = require('expo-camera');
    CameraView = Camera.CameraView;
    useCameraPermissions = Camera.useCameraPermissions;
  } catch (error) {
    console.warn('⚠️ expo-camera non disponible:', error);
  }
}

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  title?: string;
  scannerType?: 'deposit' | 'withdraw';
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onScan,
  onClose,
  title = 'Scanner QR Code',
  scannerType = 'deposit',
}) => {
  const [scanned, setScanned] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions ? useCameraPermissions() : [null, null];
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    if (isWeb) {
      // ✅ Sur le web, simuler le scan
      Alert.alert(
        'Scanner QR Code',
        'La caméra n\'est pas disponible sur le web.\nVoulez-vous simuler un scan ?',
        [
          { text: 'Annuler', style: 'cancel', onPress: onClose },
          {
            text: 'Simuler',
            onPress: () => {
              const simulatedData = JSON.stringify({
                type: 'admin_transaction',
                action: scannerType,
                userId: 'user-simulated-123',
                userName: 'Utilisateur Test',
                adminName: 'Admin SPaye',
                amount: scannerType === 'deposit' ? 5000 : 2000,
                qrCode: 'SIMULATED-QR-CODE',
                timestamp: new Date().toISOString(),
              });
              onScan(simulatedData);
            }
          }
        ]
      );
      return;
    }

    // ✅ Sur mobile, vérifier les permissions
    checkPermission();
  }, []);

  const checkPermission = async () => {
    if (!useCameraPermissions) {
      setHasPermission(false);
      return;
    }

    try {
      if (cameraPermission?.status === 'granted') {
        setHasPermission(true);
      } else if (requestCameraPermission) {
        const { status } = await requestCameraPermission();
        setHasPermission(status === 'granted');
      }
    } catch (error) {
      console.error('Erreur permission caméra:', error);
      setHasPermission(false);
    }
  };

  // ✅ Sur web, ne pas rendre le scanner
  if (isWeb) {
    return null;
  }

  // ✅ Vérification des permissions
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="camera-outline" size={64} color={COLORS.gray400} />
          <Text style={styles.permissionText}>Vérification de la caméra...</Text>
        </View>
      </View>
    );
  }

  if (!hasPermission || !CameraView) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="camera-off-outline" size={64} color={COLORS.gray400} />
          <Text style={styles.permissionText}>Permission caméra refusée</Text>
          <TouchableOpacity 
            style={styles.permissionBtn}
            onPress={checkPermission}
          >
            <Text style={styles.permissionBtnText}>Autoriser</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ✅ Rendu du scanner mobile
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    onScan(data);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={28} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.scannerWrapper}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />
        
        <View style={styles.scanFrame}>
          <View style={[styles.scanCorner, styles.scanCornerTL]} />
          <View style={[styles.scanCorner, styles.scanCornerTR]} />
          <View style={[styles.scanCorner, styles.scanCornerBL]} />
          <View style={[styles.scanCorner, styles.scanCornerBR]} />
          <View style={styles.scanLine} />
        </View>
      </View>

      <Text style={styles.scannerHint}>
        {scannerType === 'deposit' ? 'Scannez le QR Code de dépôt' : 'Scannez le QR Code de retrait'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  permissionText: { color: COLORS.white, fontSize: 16, marginTop: 12, textAlign: 'center' },
  permissionBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 16,
  },
  permissionBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
  scannerWrapper: { flex: 1, position: 'relative' },
  scanFrame: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    right: '10%',
    bottom: '20%',
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
  scanCornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderRadius: 4,
  },
  scanCornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderRadius: 4,
  },
  scanCornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderRadius: 4,
  },
  scanCornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderRadius: 4,
  },
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
  scannerHint: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
});