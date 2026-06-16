import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { WalletService } from '../../src/services/WalletService';
import { COLORS, formatAmount } from '../../src/config';

const PRESETS = [1000, 5000, 10000, 20000, 50000, 100000];

export default function ReceiveMoneyScreen() {
  const { colors } = useTheme();
  const { showSuccess, showError } = useNotification();
  const [qrCode, setQrCode] = useState<any>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const generate = useCallback(
    async (amt?: number) => {
      setLoading(true);
      try {
        const res = await WalletService.generateReceiveQRCode(amt);
        setQrCode(res);
        setAmount(amt ?? null);
        setCopied(false);
      } catch (e) {
        showError('Erreur génération du QR code');
      } finally {
        setLoading(false);
      }
    },
    [showError]
  );

  useEffect(() => {
    generate();
  }, [generate]);

  const qrData = qrCode
    ? JSON.stringify({
        type: 'payment',
        qrCode: qrCode.qrCode,
        expiresAt: qrCode.expiresAt,
        ...(amount ? { amount } : {}),
      })
    : '';

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(
    qrData
  )}`;

  const copyCode = async () => {
    if (!qrCode) return;
    try {
      await Clipboard.setStringAsync(qrCode.qrCode);
      setCopied(true);
      showSuccess('Code copié !');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showError('Erreur lors de la copie');
    }
  };

  const shareQRCode = async () => {
    if (!qrData) return;
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(qrImageUrl, {
          dialogTitle: 'Partager mon QR code',
          mimeType: 'image/png',
        });
      } else {
        copyCode();
      }
    } catch {
      copyCode();
    }
  };

  const downloadQRImage = async () => {
    if (!qrData) return;
    try {
      // Sur mobile, on ne peut pas télécharger directement
      // On propose le partage à la place
      await shareQRCode();
    } catch {
      showError('Erreur lors du partage');
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Génération du QR code...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 16, paddingTop: 60 }}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Recevoir de l'argent
        </Text>
        <TouchableOpacity onPress={shareQRCode}>
          <Ionicons name="share-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={[styles.qrCard, { backgroundColor: colors.card }]}>
        {qrImageUrl ? (
          <Image
            source={{ uri: qrImageUrl }}
            style={styles.qrImage}
            onError={() => showError('Erreur chargement QR code')}
          />
        ) : (
          <View style={styles.qrPlaceholder}>
            <ActivityIndicator color={COLORS.primary} size="large" />
          </View>
        )}

        {!!amount && (
          <View style={styles.amountBadge}>
            <Ionicons name="cash-outline" size={16} color={COLORS.primary} />
            <Text style={styles.amountBadgeText}>{formatAmount(amount)} Ar</Text>
          </View>
        )}

        <TouchableOpacity style={styles.codeRow} onPress={copyCode}>
          <Text style={[styles.codeText, { color: colors.text }]} numberOfLines={1}>
            {qrCode?.qrCode || '...'}
          </Text>
          <Ionicons
            name={copied ? 'checkmark-circle' : 'copy-outline'}
            size={18}
            color={copied ? COLORS.success : COLORS.primary}
          />
        </TouchableOpacity>

        <Text style={styles.expireText}>
          <Ionicons name="time-outline" size={13} /> Ce code expire après 30 minutes
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Demander un montant précis
      </Text>
      <View style={styles.presetsGrid}>
        {PRESETS.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.presetBtn, amount === p && styles.presetBtnActive]}
            onPress={() => generate(p)}
          >
            <Text style={[styles.presetText, amount === p && styles.presetTextActive]}>
              {formatAmount(p)} Ar
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {amount && (
        <TouchableOpacity style={styles.linkBtn} onPress={() => generate()}>
          <Text style={styles.linkBtnText}>Retirer le montant</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.refreshBtn} onPress={() => generate(amount || undefined)}>
        <Ionicons name="refresh" size={18} color={COLORS.primary} />
        <Text style={styles.refreshText}>Régénérer le QR code</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: { marginTop: 12, fontSize: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  qrCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  qrPlaceholder: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrImage: { width: 240, height: 240, borderRadius: 12 },
  amountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 16,
  },
  amountBadgeText: { color: COLORS.primary, fontWeight: 'bold' },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    backgroundColor: COLORS.gray100,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    maxWidth: '100%',
  },
  codeText: { fontSize: 12, fontFamily: 'monospace', maxWidth: 200 },
  expireText: { color: COLORS.gray400, fontSize: 12, marginTop: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  presetsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  presetBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.gray100,
  },
  presetBtnActive: { backgroundColor: COLORS.primary },
  presetText: { fontSize: 13, color: COLORS.gray600, fontWeight: '500' },
  presetTextActive: { color: COLORS.white },
  linkBtn: { alignItems: 'center', marginTop: 12 },
  linkBtnText: { color: COLORS.error, fontWeight: '600', fontSize: 14 },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  refreshText: { color: COLORS.primary, fontWeight: '600' },
});