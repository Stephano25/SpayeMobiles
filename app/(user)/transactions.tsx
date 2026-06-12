import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { TransactionService } from '../../src/services/TransactionService';
import { COLORS, formatAmount, formatDateTime, getInitials } from '../../src/config';
import { router } from 'expo-router';

export default function TransactionsScreen() {
  const { colors } = useTheme();
  const { showError } = useNotification();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const data = await TransactionService.getUserTransactions();
      setTransactions(data.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) { showError('Erreur chargement'); }
  };

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Transactions</Text><View style={{ width: 40 }} />
      </View>
      <FlatList
        data={transactions}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={[styles.item, { backgroundColor: colors.card }]}>
            <View style={styles.left}>
              <Text style={styles.desc}>{item.description || item.type}</Text>
              <Text style={styles.date}>{formatDateTime(item.createdAt)}</Text>
            </View>
            <Text style={[styles.amount, item.type === 'deposit' ? styles.positive : styles.negative]}>
              {item.type === 'deposit' ? '+' : '-'}{formatAmount(item.amount)} Ar
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucune transaction</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  backText: { fontSize: 24, color: COLORS.white },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, marginHorizontal: 20, marginBottom: 8, borderRadius: 12 },
  desc: { fontSize: 14, fontWeight: '500' },
  date: { fontSize: 12, color: COLORS.gray500, marginTop: 4 },
  amount: { fontSize: 16, fontWeight: 'bold' },
  positive: { color: COLORS.success },
  negative: { color: COLORS.error },
  empty: { textAlign: 'center', marginTop: 40, color: COLORS.gray500 },
});