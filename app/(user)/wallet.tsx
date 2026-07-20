// app/(user)/wallet.tsx
// ─────────────────────────────────────────────────────────────
//  SPAYE · User Wallet Screen
//  ✅ Correction : clés uniques pour les transactions
//  ✅ Utilisation de apiGet, apiPost
//  ✅ Correction du bouton ReceiveMoney
// ─────────────────────────────────────────────────────────────

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { WalletService } from '../../src/services/WalletService';
import { TransactionService } from '../../src/services/TransactionService';
import { COLORS, formatAmount } from '../../src/config/colors';
import { SafeScreen } from '../../src/components/SafeScreen';
import { useTranslation } from '../../src/services/TranslationService';

export default function WalletScreen() {
  const { colors } = useTheme();
  const { showError, showSuccess } = useNotification();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [walletData, txData] = await Promise.all([
        WalletService.getWallet(),
        TransactionService.getUserTransactions(),
      ]);
      setWallet(walletData);
      setTransactions((txData || []).slice(0, 10));
    } catch (error) {
      showError(t('error_loading'));
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [showError, t]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const totalDeposits = transactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = transactions
    .filter(t => t.type === 'withdrawal' || t.type === 'transfer' || t.type === 'payment')
    .reduce((sum, t) => sum + t.amount, 0);

  const navigateTo = (route: string, params?: any) => {
    navigation.navigate(route as never, params as never);
  };

  const getTransactionIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
      deposit: 'arrow-down',
      withdrawal: 'arrow-up',
      transfer: 'swap-horizontal',
      payment: 'card',
      mobile_money: 'phone-portrait',
      receive: 'arrow-down',
      send: 'arrow-up',
    };
    return icons[type] || 'receipt';
  };

  const isExpense = (type: string) => {
    return ['withdrawal', 'transfer', 'payment', 'mobile_money', 'send'].includes(type);
  };

  // ✅ Gestion du bouton Recevoir
  const handleReceive = async () => {
    try {
      // ✅ Générer le QR Code pour recevoir de l'argent
      const result = await WalletService.generateReceiveQRCode();
      
      if (result && result.qrCode) {
        // ✅ Naviguer vers l'écran d'affichage du QR Code
        navigation.navigate('ReceiveMoney' as never, { 
          qrCode: result.qrCode,
          qrData: result.data,
          expiresAt: result.expiresAt
        } as never);
      } else {
        showError('Erreur lors de la génération du QR Code');
      }
    } catch (error: any) {
      console.error('❌ Erreur génération QR:', error);
      showError(error?.message || 'Erreur lors de la génération du QR Code');
    }
  };

  return (
    <SafeScreen backgroundColor={colors.background}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('wallet')}</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        <View style={[styles.balanceCard, { backgroundColor: '#1a1830' }]}>
          <Text style={styles.balanceLabel}>{t('balance')}</Text>
          <Text style={styles.balanceAmount}>{formatAmount(wallet?.balance || 0)} Ar</Text>
          <View style={styles.balanceActions}>
            <TouchableOpacity style={[styles.balBtn, styles.balBtnPrimary]} onPress={() => navigateTo('SendMoney')}>
              <Ionicons name="send" size={18} color="#1a1200" />
              <Text style={styles.balBtnText}>{t('send')}</Text>
            </TouchableOpacity>
            {/* ✅ Bouton Recevoir corrigé */}
            <TouchableOpacity style={styles.balBtn} onPress={handleReceive}>
              <Ionicons name="qr-code" size={18} color={COLORS.white} />
              <Text style={[styles.balBtnText, { color: COLORS.white }]}>{t('receive')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.balBtn} onPress={() => navigateTo('MobileMoney')}>
              <Ionicons name="phone-portrait" size={18} color={COLORS.white} />
              <Text style={[styles.balBtnText, { color: COLORS.white }]}>{t('mobile_money')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.quickActions}>
          {[
            { icon: 'send', label: t('send'), route: 'SendMoney' },
            { icon: 'scan', label: t('scan'), route: 'ScanPay' },
            { icon: 'phone-portrait', label: t('mobile_money'), route: 'MobileMoney' },
            { icon: 'receipt', label: t('history'), route: 'Transactions' },
          ].map((item) => (
            <TouchableOpacity
              key={item.route}
              style={[styles.quickBtn, { backgroundColor: colors.card }]}
              onPress={() => navigateTo(item.route)}
            >
              <Ionicons name={item.icon as any} size={22} color={COLORS.primary} />
              <Text style={[styles.quickLabel, { color: colors.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.successLight }]}>
              <Ionicons name="arrow-down" size={16} color={COLORS.success} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{formatAmount(totalDeposits)}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('deposits')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.errorLight }]}>
              <Ionicons name="arrow-up" size={16} color={COLORS.error} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{formatAmount(totalWithdrawals)}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('withdrawals')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name="swap-horizontal" size={16} color={COLORS.primary} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{transactions.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('transactions')}</Text>
          </View>
        </View>

        <View style={[styles.txCard, { backgroundColor: colors.card }]}>
          <View style={styles.txHeader}>
            <Text style={[styles.txTitle, { color: colors.text }]}>{t('recent_activity')}</Text>
            <TouchableOpacity onPress={() => navigateTo('Transactions')}>
              <Text style={[styles.viewAll, { color: COLORS.primary }]}>{t('view_all')}</Text>
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={COLORS.gray400} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('no_transactions')}</Text>
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: COLORS.primary }]}
                onPress={() => navigateTo('SendMoney')}
              >
                <Text style={styles.emptyBtnText}>{t('send')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            transactions.map((tx, index) => {
              const expense = isExpense(tx.type);
              return (
                <TouchableOpacity
                  key={tx.id || tx._id || `tx-${index}`}
                  style={styles.txItem}
                  onPress={() => navigation.navigate('Transactions' as never)}
                >
                  <View style={[styles.txIcon, { backgroundColor: expense ? COLORS.errorLight : COLORS.successLight }]}>
                    <Ionicons name={getTransactionIcon(tx.type)} size={17} color={expense ? COLORS.error : COLORS.success} />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={[styles.txDesc, { color: colors.text }]}>
                      {tx.description || t(tx.type || 'transfer')}
                    </Text>
                    <Text style={[styles.txDate, { color: colors.textSecondary }]}>
                      {new Date(tx.createdAt).toLocaleDateString('fr-MG')}
                    </Text>
                    <View style={styles.txStatus}>
                      <Text style={[styles.txStatusText, tx.status === 'completed' ? styles.statusCompleted : styles.statusPending]}>
                        {tx.status === 'completed' ? t('completed') : t('pending')}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.txAmount, { color: expense ? COLORS.error : COLORS.success }]}>
                    {expense ? '-' : '+'}{formatAmount(tx.amount)} Ar
                  </Text>
                </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  refreshBtn: { padding: 4 },
  balanceCard: {
    margin: 16,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    color: COLORS.white,
    fontSize: 34,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  balanceActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  balBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    gap: 6,
  },
  balBtnPrimary: {
    backgroundColor: '#e8c96a',
  },
  balBtnText: {
    fontWeight: '600',
    fontSize: 13,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  quickBtn: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  quickLabel: { fontSize: 11, fontWeight: '500', marginTop: 4 },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: { fontSize: 16, fontWeight: 'bold' },
  statLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  txCard: { margin: 16, padding: 16, borderRadius: 20 },
  txHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  txTitle: { fontSize: 16, fontWeight: 'bold' },
  viewAll: { fontWeight: '600', fontSize: 14 },
  txItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: COLORS.gray100 },
  txIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 13, fontWeight: '500' },
  txDate: { fontSize: 10, marginTop: 1 },
  txStatus: { flexDirection: 'row', marginTop: 2 },
  txStatusText: { fontSize: 9, fontWeight: '600', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  statusCompleted: { color: COLORS.success, backgroundColor: COLORS.successLight },
  statusPending: { color: COLORS.warning, backgroundColor: COLORS.warningLight },
  txAmount: { fontSize: 13, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { fontSize: 14, marginTop: 8 },
  emptyBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  emptyBtnText: { color: COLORS.white, fontWeight: 'bold' },
});