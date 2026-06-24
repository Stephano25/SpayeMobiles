import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { WalletService } from '../../src/services/WalletService';
import { TransactionService } from '../../src/services/TransactionService';
import { COLORS, formatAmount, formatRelativeTime } from '../../src/config';
import { Transaction } from '../../src/types';
import { SafeScreen } from '../../src/components/SafeScreen';
import { useTranslation } from '../../src/services/TranslationService';
import { translateTransactionType } from '../../src/utils/transactionTranslations';

export default function WalletScreen() {
  const { colors } = useTheme();
  const { showError } = useNotification();
  const { t } = useTranslation();
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
      showError(t('error'));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

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

  const actions = [
    { label: t('send'), icon: 'send', color: COLORS.primary, route: '/(user)/send-money' },
    { label: t('receive'), icon: 'qr-code', color: COLORS.success, route: '/(user)/receive-money' },
    { label: t('mobile_money'), icon: 'phone-portrait', color: COLORS.warning, route: '/(user)/mobile-money' },
    { label: t('scan'), icon: 'scan', color: COLORS.secondary, route: '/(user)/scan-pay' },
  ];

  const getOther = (tx: Transaction): any => {
    const incoming = tx.type === 'deposit' || tx.type === 'receive';
    const party = incoming ? tx.senderId : tx.receiverId;
    return party && typeof party === 'object' ? party : {};
  };

  const txIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'deposit':
      case 'receive':
        return 'arrow-down-circle';
      case 'mobile_money':
        return 'phone-portrait';
      default:
        return 'arrow-up-circle';
    }
  };

  return (
    <SafeScreen backgroundColor={colors.background}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={COLORS.primary} 
          />
        }
      >
        <View style={[styles.balanceCard, { backgroundColor: COLORS.primary }]}>
          <Text style={styles.balanceLabel}>{t('balance')}</Text>
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
        </View>

        <View style={styles.actionsRow}>
          {actions.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={styles.actionBtn}
              onPress={() => router.push(a.route as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: a.color + '18' }]}>
                <Ionicons name={a.icon as any} size={22} color={a.color} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.text }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('recent_activity')}</Text>
          <TouchableOpacity onPress={() => router.push('/(user)/transactions')}>
            <Text style={styles.seeAll}>{t('view_all')}</Text>
          </TouchableOpacity>
        </View>

        {transactions.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <Ionicons name="receipt-outline" size={36} color={COLORS.gray400} />
            <Text style={styles.emptyText}>{t('no_transactions')}</Text>
          </View>
        ) : (
          transactions.map((tx) => {
            const other = getOther(tx);
            const credit = tx.type === 'deposit' || tx.type === 'receive';
            return (
              <View key={tx.id || (tx as any)._id} style={[styles.txRow, { backgroundColor: colors.card }]}>
                <View
                  style={[
                    styles.txIconBg,
                    { backgroundColor: credit ? COLORS.successLight : COLORS.errorLight },
                  ]}
                >
                  <Ionicons
                    name={txIcon(tx.type)}
                    size={20}
                    color={credit ? COLORS.success : COLORS.error}
                  />
                </View>
                <View style={styles.txInfo}>
                  <Text style={[styles.txTitle, { color: colors.text }]} numberOfLines={1}>
                    {tx.description ||
                      (other.firstName ? `${other.firstName} ${other.lastName || ''}` : translateTransactionType(tx.type))}
                  </Text>
                  <Text style={styles.txDate}>{formatRelativeTime(tx.createdAt)}</Text>
                </View>
                <Text style={[styles.txAmount, { color: credit ? COLORS.success : COLORS.error }]}>
                  {credit ? '+' : '-'}
                  {formatAmount(tx.amount)} Ar
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
  },
  balanceAmount: {
    color: COLORS.white,
    fontSize: 34,
    fontWeight: 'bold',
    marginTop: 6,
    marginBottom: 16,
  },
  balanceFooter: {
    flexDirection: 'row',
    gap: 16,
  },
  balanceStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  balanceStatText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionBtn: {
    alignItems: 'center',
    width: '23%',
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  seeAll: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 16,
  },
  emptyText: {
    color: COLORS.gray400,
    marginTop: 8,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 8,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  txIconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: { flex: 1 },
  txTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  txDate: {
    fontSize: 12,
    color: COLORS.gray400,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: 'bold',
  },
});