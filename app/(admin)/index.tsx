import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { AdminService } from '../../src/services/AdminService';
import { COLORS, formatAmount } from '../../src/config';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminDashboard() {
  const { colors } = useTheme();
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await AdminService.getDashboardStats();
      setStats(data);
    } catch (e) {
      // garde des valeurs par défaut si l'API échoue
    }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const cards = [
    { label: 'Utilisateurs', value: stats?.totalUsers ?? '—', icon: 'people-outline', color: COLORS.primary, route: '/(admin)/users' },
    { label: 'Transactions', value: stats?.totalTransactions ?? '—', icon: 'swap-horizontal-outline', color: COLORS.success, route: '/(admin)/transactions' },
    { label: 'Volume total', value: stats ? `${formatAmount(stats.totalVolume)} Ar` : '—', icon: 'wallet-outline', color: COLORS.warning, route: '/(admin)/stats' },
    { label: 'Paramètres', value: '', icon: 'settings-outline', color: COLORS.secondary, route: '/(admin)/settings' },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <Text style={styles.headerTitle}>Tableau de bord</Text>
        <Text style={styles.headerSubtitle}>Vue d'ensemble de la plateforme</Text>
      </View>

      <View style={styles.grid}>
        {cards.map((c) => (
          <TouchableOpacity
            key={c.label}
            style={[styles.card, { backgroundColor: colors.card }]}
            onPress={() => router.push(c.route as any)}
          >
            <View style={[styles.iconWrap, { backgroundColor: c.color + '20' }]}>
              <Ionicons name={c.icon as any} size={24} color={c.color} />
            </View>
            <Text style={[styles.cardValue, { color: colors.text }]}>{c.value}</Text>
            <Text style={styles.cardLabel}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.white },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12, marginTop: -16 },
  card: {
    width: '47%',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cardValue: { fontSize: 20, fontWeight: 'bold' },
  cardLabel: { fontSize: 13, color: COLORS.gray500, marginTop: 4 },
});