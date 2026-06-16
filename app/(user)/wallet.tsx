import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { WalletService } from '../../src/services/WalletService';
import { TransactionService } from '../../src/services/TransactionService';
import { COLORS, GRADIENTS, RADIUS, SPACING, FONT, SHADOW, formatAmount, formatRelativeTime } from '../../src/config';
import { Transaction } from '../../src/types';

function getOther(tx: Transaction): any {
  const incoming = tx.type === 'deposit' || tx.type === 'receive';
  const party = incoming ? tx.senderId : tx.receiverId;
  return party && typeof party === 'object' ? party : {};
}

function txIcon(type: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'deposit':
    case 'receive':
      return 'arrow-down-circle';
    case 'mobile_money':
      return 'phone-portrait';
    default:
      return 'arrow-up-circle';
  }
}

const ACTIONS = [
  { label: 'Envoyer', icon: 'send', color: COLORS.primary, route: '/(user)/send-money' },
  { label: 'Recevoir', icon: 'qr-code', color: COLORS.success, route: '/(user)/receive-money' },
  { label: 'Mobile Money', icon: 'phone-portrait', color: COLORS.warning, route: '/(user)/mobile-money' },
  { label: 'Scanner', icon: 'scan', color: COLORS.secondary, route: '/(user)/scan-pay' },
] as const;

export default function WalletScreen() {
  const { colors } = useTheme();
  const { showError } = useNotification();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [wallet, txs] = await Promise.all([
        WalletService.getWallet(),
        TransactionService.getUserTransactions(),
      ]);
      setBalance(wallet.balance ?? 0);
      setTransactions((txs || []).slice(0, 15));
    } catch (e) {
      showError('Erreur de chargement du portefeuille');
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const totalIn = transactions
    .filter((t) => t.type === 'deposit' || t.type === 'receive')
    .reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions
    .filter((t) => t.type !== 'deposit' && t.type !== 'receive')
    .reduce((s, t) => s + t.amount, 0);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      <LinearGradient colors={GRADIENTS.primary} style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Solde disponible</Text>
        <Text style={styles.balanceAmount}>{formatAmount(balance)} Ar</Text>
        <View style={styles.balanceFooter}>
          <View style={styles.balanceStat}>
            <Ionicons name="arrow-down-circle" size={16} color="#A7F3D0" />
            <Text style={styles.balanceStatText}>+{formatAmount(totalIn)} Ar</Text>
          </View>
          <View style={styles.balanceStat}>
            <Ionicons name="arrow-up-circle" size={16} color="#FECACA" />
            <Text style={styles.balanceStatText}>-{formatAmount(totalOut)} Ar</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.actionsRow}>
        {ACTIONS.map((a) => (
          <TouchableOpacity key={a.label} style={styles.actionBtn} onPress={() => router.push(a.route as any)}>
            <View style={[styles.actionIcon, { backgroundColor: a.color + '18' }]}>
              <Ionicons name={a.icon as any} size={22} color={a.color} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.text }]}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Activité récente</Text>
        <TouchableOpacity onPress={() => router.push('/(user)/transactions')}>
          <Text style={styles.seeAll}>Voir tout</Text>
        </TouchableOpacity>
      </View>

      {transactions.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
          <Ionicons name="receipt-outline" size={36} color={COLORS.gray400} />
          <Text style={styles.emptyText}>Aucune transaction</Text>
        </View>
      ) : (
        transactions.map((tx) => {
          const other = getOther(tx);
          const credit = tx.type === 'deposit' || tx.type === 'receive';
          return (
            <View key={tx.id || (tx as any)._id} style={[styles.txRow, { backgroundColor: colors.card }]}>
              <View style={[styles.txIconBg, { backgroundColor: credit ? COLORS.successLight : COLORS.errorLight }]}>
                <Ionicons name={txIcon(tx.type)} size={20} color={credit ? COLORS.success : COLORS.error} />
              </View>
              <View style={styles.txInfo}>
                <Text style={[styles.txTitle, { color: colors.text }]} numberOfLines={1}>
                  {tx.description || (other.firstName ? `${other.firstName} ${other.lastName || ''}` : tx.type)}
                </Text>
                <Text style={styles.txDate}>{formatRelativeTime(tx.createdAt)}</Text>
              </View>
              <Text style={[styles.txAmount, { color: credit ? COLORS.success : COLORS.error }]}>
                {credit ? '+' : '-'}{formatAmount(tx.amount)} Ar
              </Text>
            </View>
          );
        })
      )}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg, paddingTop: 60 },
  balanceCard: { borderRadius: RADIUS.xl, padding: SPACING.xl, marginBottom: SPACING.xl, ...SHADOW.md },
  balanceLabel: { color: 'rgba(255,255,255,0.85)', fontSize: FONT.size.sm },
  balanceAmount: { color: COLORS.white, fontSize: FONT.size.huge, fontWeight: FONT.weight.extrabold, marginTop: 6, marginBottom: SPACING.lg },
  balanceFooter: { flexDirection: 'row', gap: SPACING.lg },
  balanceStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  balanceStatText: { color: COLORS.white, fontSize: FONT.size.sm, fontWeight: FONT.weight.medium },

  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xl },
  actionBtn: { alignItems: 'center', width: '23%' },
  actionIcon: { width: 52, height: 52, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xs },
  actionLabel: { fontSize: FONT.size.xs, fontWeight: FONT.weight.medium, textAlign: 'center' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle: { fontSize: FONT.size.md, fontWeight: FONT.weight.bold },
  seeAll: { color: COLORS.primary, fontWeight: FONT.weight.semibold, fontSize: FONT.size.sm },

  emptyCard: { alignItems: 'center', padding: SPACING.xxxl, borderRadius: RADIUS.lg },
  emptyText: { color: COLORS.gray400, marginTop: SPACING.sm },

  txRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.lg, marginBottom: SPACING.sm, gap: SPACING.md, ...SHADOW.sm },
  txIconBg: { width: 42, height: 42, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1 },
  txTitle: { fontSize: FONT.size.base, fontWeight: FONT.weight.medium },
  txDate: { fontSize: FONT.size.xs, color: COLORS.gray400, marginTop: 2 },
  txAmount: { fontSize: FONT.size.base, fontWeight: FONT.weight.bold },
});