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
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { WalletService } from '../../src/services/WalletService';
import { TransactionService } from '../../src/services/TransactionService';
import { COLORS, formatAmount, getInitials } from '../../src/config';
import { SafeScreen } from '../../src/components/SafeScreen';
import { useTranslation } from '../../src/services/TranslationService';
import { translateTransactionType } from '../../src/utils/transactionTranslations';

export default function UserHome() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { showError } = useNotification();
  const { t } = useTranslation();
  const [balance, setBalance] = useState(0);
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [wallet, tx] = await Promise.all([
        WalletService.getWallet(),
        TransactionService.getUserTransactions(),
      ]);
      setBalance(wallet.balance || 0);
      setRecentTx((tx || []).slice(0, 3));
    } catch (e) {
      showError(t('error_loading'));
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

  const quickActions = [
    { label: t('send'), icon: 'arrow-up-circle-outline', color: COLORS.primary, route: '/(user)/send-money' },
    { label: t('receive'), icon: 'arrow-down-circle-outline', color: COLORS.success, route: '/(user)/receive-money' },
    { label: t('mobile_money'), icon: 'phone-portrait-outline', color: COLORS.warning, route: '/(user)/mobile-money' },
    { label: t('scan_qr'), icon: 'qr-code-outline', color: COLORS.secondary, route: '/(user)/scan-pay' },
    { label: t('friends'), icon: 'people-outline', color: COLORS.info, route: '/(user)/friends' },
    { label: t('messages'), icon: 'chatbubbles-outline', color: COLORS.primary, route: '/(user)/chat' },
    { label: t('transactions'), icon: 'time-outline', color: COLORS.gray600, route: '/(user)/transactions' },
    { label: t('settings'), icon: 'settings-outline', color: COLORS.gray600, route: '/(user)/settings' },
  ];

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'receive':
        return 'arrow-down-circle';
      case 'withdrawal':
      case 'send':
        return 'arrow-up-circle';
      case 'mobile_money':
        return 'phone-portrait';
      default:
        return 'swap-horizontal';
    }
  };

  const getTransactionColor = (type: string) =>
    type === 'deposit' || type === 'receive' ? COLORS.success : COLORS.error;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-MG', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  return (
    <SafeScreen backgroundColor={colors.background} withTabBar={false}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{t('home')}</Text>
              <Text style={styles.userName}>
                {user?.firstName || 'Dazz'} {user?.lastName || 'Remie'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.avatar}
              onPress={() => router.push('/(user)/profile')}
            >
              <Text style={styles.avatarText}>
                {getInitials(user?.firstName || 'Dazz', user?.lastName || 'Remie')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.balanceBox}>
            <Text style={styles.balanceLabel}>{t('balance')}</Text>
            <Text style={styles.balanceAmount}>{formatAmount(balance)} Ar</Text>
          </View>
        </View>

        <View style={styles.actionsGrid}>
          {quickActions.slice(0, 4).map((a) => (
            <TouchableOpacity
              key={a.label}
              style={[styles.actionCard, { backgroundColor: colors.card }]}
              onPress={() => router.push(a.route as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: a.color + '20' }]}>
                <Ionicons name={a.icon as any} size={22} color={a.color} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.text }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.actionsGrid}>
          {quickActions.slice(4, 8).map((a) => (
            <TouchableOpacity
              key={a.label}
              style={[styles.actionCard, { backgroundColor: colors.card }]}
              onPress={() => router.push(a.route as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: a.color + '20' }]}>
                <Ionicons name={a.icon as any} size={22} color={a.color} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.text }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('recent_activity')}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(user)/transactions')}>
              <Text style={styles.seeAll}>{t('view_all')}</Text>
            </TouchableOpacity>
          </View>

          {recentTx.length === 0 ? (
            <Text style={styles.empty}>{t('no_transactions')}</Text>
          ) : (
            recentTx.map((tx) => {
              const isCredit = tx.type === 'deposit' || tx.type === 'receive';
              return (
                <View
                  key={tx.id || tx._id}
                  style={[styles.txItem, { backgroundColor: colors.card }]}
                >
                  <View
                    style={[
                      styles.txIcon,
                      { backgroundColor: getTransactionColor(tx.type) + '20' },
                    ]}
                  >
                    <Ionicons
                      name={getTransactionIcon(tx.type) as any}
                      size={20}
                      color={getTransactionColor(tx.type)}
                    />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={[styles.txDesc, { color: colors.text }]} numberOfLines={2}>
                      {tx.description || translateTransactionType(tx.type)}
                    </Text>
                    <Text style={styles.txDate}>
                      {formatDate(tx.createdAt)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.txAmount,
                      { color: isCredit ? COLORS.success : COLORS.error },
                    ]}
                  >
                    {isCredit ? '+' : '-'}
                    {formatAmount(tx.amount)} Ar
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  userName: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  balanceBox: { marginTop: 20 },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  balanceAmount: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  actionCard: {
    width: '22%',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  section: { marginTop: 24, paddingHorizontal: 20, marginBottom: 40 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: 'bold' },
  seeAll: { color: COLORS.primary, fontSize: 13, fontWeight: '500' },
  empty: { textAlign: 'center', color: COLORS.gray500, marginTop: 20 },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 14, fontWeight: '500' },
  txDate: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: 'bold' },
});