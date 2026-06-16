import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { WalletService } from '../../src/services/WalletService';
import { COLORS, RADIUS, SPACING, FONT, SHADOW, formatAmount } from '../../src/config';

const PRESETS = [1000, 5000, 10000, 20000, 50000, 100000];

export default function ReceiveMoneyScreen() {
  const { colors } = useTheme();
  const { showSuccess, showError } = useNotification();
  const [qrCode, setQrCode] = useState<any>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const generate = useCallback(async (amt?: number) => {
    setLoading(true);
    try {
      const res = await WalletService.generateReceiveQRCode(amt);
      setQrCode(res);
      setAmount(amt ?? null);
    } catch (e) {
      showError('Erreur génération du QR code');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { generate(); }, [generate]);

  const qrData = qrCode
    ? JSON.stringify({ type: 'payment', qrCode: qrCode.qrCode, ...(amount ? { amount } : {}) })
    : '';
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qrData)}`;

  const copyCode = async () => {
    if (!qrCode) return;
    await Clipboard.setStringAsync(qrCode.qrCode);
    showSuccess('Code copié');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: SPACING.lg, paddingTop: 60 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Recevoir de l'argent</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[styles.qrCard, { backgroundColor: colors.card }]}>
        {loading ? (
          <View style={styles.qrPlaceholder}>
            <ActivityIndicator color={COLORS.primary} size="large" />
          </View>
        ) : (
          <Image source={{ uri: qrImageUrl }} style={styles.qrImage} />
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
          <Ionicons name="copy-outline" size={18} color={COLORS.primary} />
        </TouchableOpacity>

        <Text style={styles.expireText}>
          <Ionicons name="time-outline" size={13} /> Ce code expire après 30 minutes
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Demander un montant précis</Text>
      <View style={styles.presetsGrid}>
        {PRESETS.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.presetBtn, amount === p && styles.presetBtnActive]}
            onPress={() => generate(p)}
          >
            <Text style={[styles.presetText, amount === p && styles.presetTextActive]}>{formatAmount(p)} Ar</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.lg },
  headerTitle: { fontSize: FONT.size.lg, fontWeight: FONT.weight.bold },

  qrCard: { borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center', marginBottom: SPACING.xl, ...SHADOW.md },
  qrPlaceholder: { width: 280, height: 280, alignItems: 'center', justifyContent: 'center' },
  qrImage: { width: 240, height: 240, borderRadius: RADIUS.md },

  amountBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.full, paddingVertical: 6, paddingHorizontal: SPACING.md, marginTop: SPACING.lg },
  amountBadgeText: { color: COLORS.primary, fontWeight: FONT.weight.bold },

  codeRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.lg, backgroundColor: COLORS.gray100, borderRadius: RADIUS.md, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, maxWidth: '100%' },
  codeText: { fontSize: FONT.size.xs, fontFamily: 'monospace', maxWidth: 200 },

  expireText: { color: COLORS.gray400, fontSize: FONT.size.xs, marginTop: SPACING.md },

  sectionTitle: { fontSize: FONT.size.md, fontWeight: FONT.weight.bold, marginBottom: SPACING.md },
  presetsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  presetBtn: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: RADIUS.full, backgroundColor: COLORS.gray100 },
  presetBtnActive: { backgroundColor: COLORS.primary },
  presetText: { fontSize: FONT.size.sm, color: COLORS.gray600, fontWeight: FONT.weight.medium },
  presetTextActive: { color: COLORS.white },

  linkBtn: { alignItems: 'center', marginTop: SPACING.md },
  linkBtnText: { color: COLORS.error, fontWeight: FONT.weight.semibold, fontSize: FONT.size.sm },

  refreshBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, marginTop: SPACING.xl, paddingVertical: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.primary },
  refreshText: { color: COLORS.primary, fontWeight: FONT.weight.semibold },
});