import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { TransactionService } from '../../src/services/TransactionService';
import { COLORS, formatAmount, formatDateTime } from '../../src/config';
import { router } from 'expo-router';

export default function TransactionsScreen() {
  const { colors } = useTheme();
  const { showError } = useNotification();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await TransactionService.getUserTransactions();
      // S'assurer que data est un tableau
      const sortedData = Array.isArray(data) 
        ? data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        : [];
      setTransactions(sortedData);
    } catch (error) {
      showError('Erreur chargement des transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const getTransactionColor = (type: string) => {
    const creditTypes = ['deposit', 'receive', 'refund'];
    return creditTypes.includes(type) ? COLORS.success : COLORS.error;
  };

  const getTransactionSign = (type: string) => {
    const creditTypes = ['deposit', 'receive', 'refund'];
    return creditTypes.includes(type) ? '+' : '-';
  };

  const renderItem = ({ item }: { item: any }) => {
    const isCredit = getTransactionSign(item.type) === '+';
    return (
      <View style={[styles.item, { backgroundColor: colors.card }]}>
        <View style={styles.left}>
          <Text style={[styles.desc, { color: colors.text }]}>
            {item.description || item.type}
          </Text>
          <Text style={styles.date}>{formatDateTime(item.createdAt)}</Text>
          {item.status && (
            <Text style={[
              styles.status,
              item.status === 'completed' ? styles.statusCompleted : styles.statusPending
            ]}>
              {item.status}
            </Text>
          )}
        </View>
        <Text style={[
          styles.amount,
          { color: isCredit ? COLORS.success : COLORS.error }
        ]}>
          {isCredit ? '+' : '-'}{formatAmount(item.amount)} Ar
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 12, color: colors.textSecondary }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transactions</Text>
        <View style={{ width: 40 }} />
      </View>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id || item._id || Math.random().toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.empty}>Aucune transaction</Text>
          </View>
        }
        contentContainerStyle={transactions.length === 0 ? styles.emptyContent : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 24, color: COLORS.white },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  left: { flex: 1, marginRight: 12 },
  desc: { fontSize: 14, fontWeight: '500' },
  date: { fontSize: 12, color: COLORS.gray500, marginTop: 4 },
  status: { fontSize: 11, marginTop: 4, fontWeight: '500' },
  statusCompleted: { color: COLORS.success },
  statusPending: { color: COLORS.warning },
  amount: { fontSize: 16, fontWeight: 'bold' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  empty: { textAlign: 'center', marginTop: 40, color: COLORS.gray500, fontSize: 16 },
  emptyContent: { flexGrow: 1 },
});