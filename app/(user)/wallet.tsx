import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { WalletService } from '../../src/services/WalletService';
import { TransactionService } from '../../src/services/TransactionService';
import { Wallet, Transaction } from '../../src/types';
import { COLORS, formatAmount } from '../../src/config';
import { router } from 'expo-router';

export default function WalletScreen() {
  const { colors } = useTheme();
  const { showError } = useNotification();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [walletData, txData] = await Promise.all([
        WalletService.getWallet(),
        TransactionService.getUserTransactions(),
      ]);
      setWallet(walletData);
      setTransactions(txData.slice(0, 10));
    } catch (error) {
      showError('Erreur chargement du portefeuille');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const navigateTo = (route: string) => router.push(route as any);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': case 'receive': return '📥';
      case 'withdrawal': case 'send': return '📤';
      case 'transfer': return '🔄';
      case 'mobile_money': return '📱';
      default: return '💳';
    }
  };

  const getTransactionColor = (type: string) =>
    type === 'deposit' || type === 'receive' ? COLORS.success : COLORS.error;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon Portefeuille</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Solde disponible</Text>
        <Text style={styles.balanceAmount}>{formatAmount(wallet?.balance || 0)} Ar</Text>
        <View style={styles.balanceActions}>
          <TouchableOpacity style={[styles.actionButton, styles.sendButton]} onPress={() => navigateTo('/send-money')}>
            <Text style={styles.actionButtonText}>📤 Envoyer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.receiveButton]} onPress={() => navigateTo('/receive-money')}>
            <Text style={styles.actionButtonText}>📥 Recevoir</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.mobileButton]} onPress={() => navigateTo('/mobile-money')}>
            <Text style={styles.actionButtonText}>📱 Mobile</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={[styles.quickAction, { backgroundColor: colors.card }]} onPress={() => navigateTo('/scan-pay')}>
          <Text style={styles.quickActionIcon}>📷</Text>
          <Text style={[styles.quickActionLabel, { color: colors.text }]}>Scanner</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickAction, { backgroundColor: colors.card }]} onPress={() => navigateTo('/transactions')}>
          <Text style={styles.quickActionIcon}>📜</Text>
          <Text style={[styles.quickActionLabel, { color: colors.text }]}>Historique</Text>
        </TouchableOpacity>
      </View>

      {transactions.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Transactions récentes</Text>
          {transactions.map((tx) => (
            <View key={tx.id} style={[styles.transactionItem, { backgroundColor: colors.card }]}>
              <View style={[styles.transactionIcon, { backgroundColor: getTransactionColor(tx.type) + '20' }]}>
                <Text style={styles.transactionIconText}>{getTransactionIcon(tx.type)}</Text>
              </View>
              <View style={styles.transactionInfo}>
                <Text style={[styles.transactionDesc, { color: colors.text }]}>{tx.description || tx.type}</Text>
                <Text style={styles.transactionDate}>{new Date(tx.createdAt).toLocaleDateString('fr-MG')}</Text>
              </View>
              <Text style={[styles.transactionAmount, { color: getTransactionColor(tx.type) }]}>
                {tx.type === 'deposit' || tx.type === 'receive' ? '+' : '-'}{formatAmount(tx.amount)} Ar
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  backButton: { padding: 8 },
  backText: { fontSize: 24, color: COLORS.white },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  balanceCard: { backgroundColor: COLORS.white, marginHorizontal: 20, marginTop: 20, borderRadius: 20, padding: 20, shadowColor: COLORS.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  balanceLabel: { fontSize: 14, color: COLORS.gray600, marginBottom: 8 },
  balanceAmount: { fontSize: 32, fontWeight: 'bold', color: COLORS.primary, marginBottom: 20 },
  balanceActions: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  sendButton: { backgroundColor: COLORS.primary },
  receiveButton: { backgroundColor: COLORS.success },
  mobileButton: { backgroundColor: COLORS.warning },
  actionButtonText: { color: COLORS.white, fontWeight: '600' },
  quickActions: { flexDirection: 'row', marginHorizontal: 20, marginTop: 20, gap: 12 },
  quickAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8, shadowColor: COLORS.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  quickActionIcon: { fontSize: 20 },
  quickActionLabel: { fontSize: 14, fontWeight: '500' },
  recentSection: { marginHorizontal: 20, marginTop: 24, marginBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  transactionItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 8 },
  transactionIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  transactionIconText: { fontSize: 20 },
  transactionInfo: { flex: 1 },
  transactionDesc: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  transactionDate: { fontSize: 12, color: COLORS.gray500 },
  transactionAmount: { fontSize: 16, fontWeight: 'bold' },
});