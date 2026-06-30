import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { TransactionService } from '../../src/services/TransactionService';
import { COLORS, formatAmount, formatDateTime } from '../../src/config';
import { SafeScreen } from '../../src/components/SafeScreen';
import { useTranslation } from '../../src/services/TranslationService';
import { translateTransactionType, translateTransactionStatus } from '../../src/utils/transactionTranslations';

export default function TransactionsScreen() {
  const { colors } = useTheme();
  const { showError } = useNotification();
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await TransactionService.getUserTransactions();
      const sortedData = Array.isArray(data) 
        ? data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        : [];
      setTransactions(sortedData);
    } catch (error) {
      showError(t('error_loading'));
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [showError, t]);

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

  const getTransactionSign = (type: string) => {
    const creditTypes = ['deposit', 'receive', 'refund'];
    return creditTypes.includes(type) ? '+' : '-';
  };

  const renderItem = useCallback(({ item }: { item: any }) => {
    const isCredit = getTransactionSign(item.type) === '+';
    return (
      <View style={[styles.item, { backgroundColor: colors.card }]}>
        <View style={styles.left}>
          <Text style={[styles.desc, { color: colors.text }]}>
            {translateTransactionType(item.type)}
          </Text>
          <Text style={styles.date}>{formatDateTime(item.createdAt)}</Text>
          {item.status && (
            <Text style={[
              styles.status,
              item.status === 'completed' ? styles.statusCompleted : styles.statusPending
            ]}>
              {translateTransactionStatus(item.status)}
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
  }, [colors]);

  const keyExtractor = useCallback((item: any) => {
    return item.id || item._id || Math.random().toString();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 12, color: colors.textSecondary }}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <SafeScreen backgroundColor={colors.background}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('transaction_history')}</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <FlatList
        data={transactions}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          transactions.length === 0 && styles.emptyContent
        ]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color={COLORS.gray400} />
            <Text style={styles.empty}>{t('no_transactions')}</Text>
          </View>
        }
      />
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
  listContent: {
    padding: 16,
    paddingBottom: 30,
    flexGrow: 1,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
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
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingTop: 60 
  },
  empty: { 
    textAlign: 'center', 
    marginTop: 16, 
    color: COLORS.gray500, 
    fontSize: 16 
  },
});