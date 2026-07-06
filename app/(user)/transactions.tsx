// app/(user)/transactions.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { TransactionService } from '../../src/services/TransactionService';
import { COLORS, formatAmount, formatDateTime } from '../../src/config';
import { SafeScreen } from '../../src/components/SafeScreen';
import { useTranslation } from '../../src/services/TranslationService';

const getTransactionTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    deposit: 'Dépôt',
    withdrawal: 'Retrait',
    transfer: 'Transfert',
    payment: 'Paiement',
    mobile_money: 'Mobile Money',
    receive: 'Réception',
    send: 'Envoi',
  };
  return labels[type] || type;
};

const getTransactionTypeIcon = (type: string): keyof typeof Ionicons.glyphMap => {
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

const isCreditType = (type: string): boolean => {
  return ['deposit', 'receive'].includes(type);
};

export default function TransactionsScreen() {
  const { colors } = useTheme();
  const { showError } = useNotification();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const data = await TransactionService.getUserTransactions();
      setTransactions(data || []);
    } catch (error) {
      showError(t('error_loading'));
    } finally {
      setLoading(false);
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

  const renderItem = ({ item }: { item: any }) => {
    const isCredit = isCreditType(item.type);
    return (
      <View style={[styles.item, { backgroundColor: colors.card }]}>
        <View style={[styles.iconContainer, { backgroundColor: isCredit ? COLORS.successLight : COLORS.errorLight }]}>
          <Ionicons name={getTransactionTypeIcon(item.type)} size={20} color={isCredit ? COLORS.success : COLORS.error} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.desc, { color: colors.text }]}>
            {item.description || getTransactionTypeLabel(item.type)}
          </Text>
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            {formatDateTime(item.createdAt)}
          </Text>
          <Text style={[
            styles.status,
            item.status === 'completed' ? styles.statusCompleted : styles.statusPending
          ]}>
            {item.status === 'completed' ? t('completed') : t('pending')}
          </Text>
        </View>
        <Text style={[styles.amount, { color: isCredit ? COLORS.success : COLORS.error }]}>
          {isCredit ? '+' : '-'}{formatAmount(item.amount)} Ar
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeScreen backgroundColor={colors.background}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 12, color: colors.textSecondary }}>{t('loading')}</Text>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen backgroundColor={colors.background}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('transaction_history')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        contentContainerStyle={[styles.list, transactions.length === 0 && styles.emptyList]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color={COLORS.gray400} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('no_transactions')}</Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: COLORS.primary }]}
              onPress={() => navigation.navigate('SendMoney' as never)}
            >
              <Text style={styles.emptyBtnText}>{t('send')}</Text>
            </TouchableOpacity>
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
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white, flex: 1, marginLeft: 8 },
  list: { padding: 16, paddingBottom: 30 },
  emptyList: { flexGrow: 1 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: { flex: 1 },
  desc: { fontSize: 14, fontWeight: '600' },
  date: { fontSize: 11, marginTop: 2 },
  status: { fontSize: 10, fontWeight: '600', marginTop: 2, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  statusCompleted: { color: COLORS.success, backgroundColor: COLORS.successLight },
  statusPending: { color: COLORS.warning, backgroundColor: COLORS.warningLight },
  amount: { fontSize: 14, fontWeight: 'bold' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, marginTop: 12 },
  emptyBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  emptyBtnText: { color: COLORS.white, fontWeight: 'bold' },
});