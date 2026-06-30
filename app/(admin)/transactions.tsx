import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { AdminService } from '../../src/services/AdminService';
import { COLORS, formatAmount, formatDateTime } from '../../src/config';

export default function AdminTransactionsScreen() {
  const { colors } = useTheme();
  const { showError } = useNotification();
  const navigation = useNavigation();
  const [txns, setTxns] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await AdminService.getAllTransactions();
      const sortedData = Array.isArray(data) 
        ? data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        : [];
      setTxns(sortedData);
    } catch (error) {
      showError('Erreur chargement des transactions');
      setTxns([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transactions</Text>
        <View style={{ width: 40 }} />
      </View>
      <FlatList
        data={txns}
        keyExtractor={(item) => item.id || item._id || Math.random().toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.id, { color: colors.text }]}>ID: {item.id?.slice(-8) || item._id?.slice(-8) || 'N/A'}</Text>
            <Text style={{ color: colors.text }}>Montant : {formatAmount(item.amount)} Ar</Text>
            <Text style={{ color: colors.text }}>Type : {item.type}</Text>
            <Text style={{ color: colors.text }}>Statut : {item.status}</Text>
            <Text style={{ color: colors.text }}>Date : {formatDateTime(item.createdAt)}</Text>
            {item.sender && (
              <Text style={{ color: colors.text }}>
                Expéditeur : {item.sender.firstName} {item.sender.lastName}
              </Text>
            )}
            {item.receiver && (
              <Text style={{ color: colors.text }}>
                Destinataire : {item.receiver.firstName} {item.receiver.lastName}
              </Text>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.empty}>Aucune transaction</Text>
          </View>
        }
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
  card: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  id: { fontWeight: 'bold', marginBottom: 6 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  empty: { textAlign: 'center', marginTop: 40, color: COLORS.gray500, fontSize: 16 },
});