// app/(admin)/index.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { AdminService } from '../../src/services/AdminService';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, formatAmount } from '../../src/config/colors';

const { width } = Dimensions.get('window');

function AnimatedStatCard({ label, value, icon, colors: cardColors, route, delay }: {
  label: string;
  value: string | number;
  icon: string;
  colors: [string, string];
  route: string;
  delay: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  const navigation = useNavigation();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }], width: '47%' }}>
      <TouchableOpacity 
        onPress={() => navigation.navigate(route as never)} 
        activeOpacity={0.85}
        style={styles.gradientCard}
      >
        <View style={[styles.gradientCard, { backgroundColor: cardColors[0] }]}>
          <View style={styles.cardIconWrap}>
            <Ionicons name={icon as any} size={22} color="rgba(255,255,255,0.95)" />
          </View>
          <Text style={styles.cardValue}>{value}</Text>
          <Text style={styles.cardLabel}>{label}</Text>
          <View style={styles.cardArrow}>
            <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.7)" />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function AdminDashboard() {
  const { colors, isDark } = useTheme();
  const { showError } = useNotification();
  const { getCurrentUser } = useAuth();
  const navigation = useNavigation();
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const user = getCurrentUser();
    setIsSuperAdmin(user?.role === 'super_admin');
  }, []);

  const load = async () => {
    try {
      const data = await AdminService.getDashboardStats();
      setStats(data);
    } catch (error) {
      showError('Erreur chargement du tableau de bord');
    }
  };

  useEffect(() => {
    load();
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const cards = [
    {
      label: 'Utilisateurs',
      value: stats?.totalUsers ?? '—',
      icon: 'people',
      colors: ['#6366f1', '#8b5cf6'] as [string, string],
      route: 'AdminUsers',
    },
    {
      label: 'Transactions',
      value: stats?.totalTransactions ?? '—',
      icon: 'swap-horizontal',
      colors: ['#10b981', '#059669'] as [string, string],
      route: 'AdminTransactions',
    },
    {
      label: 'Volume total',
      value: stats ? `${formatAmount(stats.totalVolume)} Ar` : '—',
      icon: 'wallet',
      colors: ['#f59e0b', '#d97706'] as [string, string],
      route: 'AdminStats',
    },
    {
      label: 'Paramètres',
      value: '',
      icon: 'settings',
      colors: ['#3b82f6', '#2563eb'] as [string, string],
      route: 'AdminSettings',
    },
  ];

  const menuItems = [
    { icon: 'person', label: 'Mon Profil', route: 'AdminProfile' },
    { icon: 'people', label: 'Utilisateurs', route: 'AdminUsers' },
    { icon: 'receipt', label: 'Transactions', route: 'AdminTransactions' },
    { icon: 'bar-chart', label: 'Statistiques', route: 'AdminStats' },
    { icon: 'settings', label: 'Paramètres', route: 'AdminSettings' },
  ];

  if (isSuperAdmin) {
    menuItems.push({ icon: 'shield', label: 'Administrateurs', route: 'AdminAdmins' });
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.primary]}
          tintColor={COLORS.primary}
        />
      }
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <Animated.View style={{ opacity: headerOpacity }}>
          <View style={styles.headerBadge}>
            <View style={styles.headerDot} />
            <Text style={styles.headerBadgeText}>Admin Panel</Text>
          </View>
          <Text style={styles.headerTitle}>Tableau de bord</Text>
          <Text style={styles.headerSubtitle}>Vue d'ensemble</Text>

          {stats && (
            <View style={styles.quickStats}>
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{stats.activeUsers ?? 0}</Text>
                <Text style={styles.quickStatLabel}>Actifs</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{stats.totalTransactions ?? 0}</Text>
                <Text style={styles.quickStatLabel}>Transactions</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{formatAmount(stats.totalVolume ?? 0)}</Text>
                <Text style={styles.quickStatLabel}>Volume</Text>
              </View>
            </View>
          )}
        </Animated.View>
      </View>

      {/* Cards Grid */}
      <View style={styles.grid}>
        {cards.map((c, i) => (
          <AnimatedStatCard key={c.label} {...c} delay={i * 80} />
        ))}
      </View>

      {/* Menu Grid */}
      <View style={styles.menuSection}>
        <Text style={[styles.menuTitle, { color: colors.text }]}>Gestion rapide</Text>
        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuCard, { backgroundColor: colors.card }]}
              onPress={() => navigation.navigate(item.route as never)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: COLORS.primary + '18' }]}>
                <Ionicons name={item.icon as any} size={24} color={COLORS.primary} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      {stats?.recentTransactions && stats.recentTransactions.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Activité récente</Text>
          {stats.recentTransactions.slice(0, 3).map((tx: any) => (
            <View key={tx.id || tx._id} style={[styles.activityRow, { backgroundColor: colors.card }]}>
              <View style={[styles.activityIcon, { backgroundColor: COLORS.primary + '15' }]}>
                <Ionicons name="swap-horizontal" size={18} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.activityDesc, { color: colors.text }]}>
                  {tx.type || 'Transaction'}
                </Text>
                <Text style={[styles.activityDate, { color: colors.textSecondary }]}>
                  {new Date(tx.createdAt).toLocaleDateString('fr-MG')}
                </Text>
              </View>
              <Text style={[styles.activityAmount, { color: COLORS.success }]}>
                {formatAmount(tx.amount)} Ar
              </Text>
            </View>
          ))}
          <TouchableOpacity
            style={[styles.viewAllBtn, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('AdminTransactions' as never)}
          >
            <Text style={[styles.viewAllText, { color: COLORS.primary }]}>Voir tout</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 64,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  headerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#a5f3fc',
  },
  headerBadgeText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    marginBottom: 24,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  quickStat: { flex: 1, alignItems: 'center' },
  quickStatValue: { fontSize: 18, fontWeight: '800', color: '#fff' },
  quickStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 2, textTransform: 'uppercase' },
  quickStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 4 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 14,
    justifyContent: 'space-between',
  },
  gradientCard: {
    borderRadius: 20,
    padding: 18,
    minHeight: 140,
    position: 'relative',
  },
  cardIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  cardLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
    fontWeight: '500',
  },
  cardArrow: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuSection: { paddingHorizontal: 20, marginTop: 28 },
  menuTitle: { fontSize: 17, fontWeight: '700', marginBottom: 14 },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  menuCard: {
    width: (width - 60) / 3,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  menuLabel: { fontSize: 12, fontWeight: '500', textAlign: 'center' },
  section: { paddingHorizontal: 20, marginTop: 28 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 14 },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityDesc: { fontSize: 14, fontWeight: '600' },
  activityDate: { fontSize: 11, marginTop: 2 },
  activityAmount: { fontSize: 14, fontWeight: '700' },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 14,
    marginTop: 4,
    gap: 8,
  },
  viewAllText: { fontWeight: '600', fontSize: 14 },
});