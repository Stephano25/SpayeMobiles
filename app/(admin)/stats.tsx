import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { AdminService } from '../../src/services/AdminService';
import { COLORS, formatAmount } from '../../src/config';
import { router } from 'expo-router';

export default function AdminStatsScreen() {
  const { colors } = useTheme();
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { load(); }, []);
  const load = async () => { const data = await AdminService.getDashboardStats(); setStats(data); };
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (!stats) return <View style={{ flex: 1, justifyContent: 'center' }}><Text>Chargement...</Text></View>;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Statistiques</Text><View style={{ width: 40 }} />
      </View>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={styles.kpi}>Total utilisateurs : {stats.totalUsers}</Text>
        <Text style={styles.kpi}>Utilisateurs actifs : {stats.activeUsers}</Text>
        <Text style={styles.kpi}>Transactions : {stats.totalTransactions}</Text>
        <Text style={styles.kpi}>Volume total : {formatAmount(stats.totalVolume)} Ar</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  backText: { fontSize: 24, color: COLORS.white },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  card: { margin: 20, padding: 20, borderRadius: 16 },
  kpi: { fontSize: 16, marginVertical: 8 },
});