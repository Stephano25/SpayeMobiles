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
import { router } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { AdminService } from '../../src/services/AdminService';
import { COLORS, formatAmount } from '../../src/config';
import { useTranslation } from '../../src/services/TranslationService';
import { LinearGradient } from 'expo-linear-gradient';

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
      <TouchableOpacity onPress={() => router.push(route as any)} activeOpacity={0.85}>
        <LinearGradient
          colors={cardColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientCard}
        >
          <View style={styles.cardIconWrap}>
            <Ionicons name={icon as any} size={22} color="rgba(255,255,255,0.95)" />
          </View>
          <Text style={styles.cardValue}>{value}</Text>
          <Text style={styles.cardLabel}>{label}</Text>
          <View style={styles.cardArrow}>
            <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.7)" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function AdminDashboard() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const headerOpacity = useRef(new Animated.Value(0)).current;

  const load = async () => {
    try {
      const data = await AdminService.getDashboardStats();
      setStats(data);
    } catch {}
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
      label: t('total_users'),
      value: stats?.totalUsers ?? '—',
      icon: 'people',
      colors: ['#6366f1', '#8b5cf6'] as [string, string],
      route: '/(admin)/users',
    },
    {
      label: t('total_transactions'),
      value: stats?.totalTransactions ?? '—',
      icon: 'swap-horizontal',
      colors: ['#10b981', '#059669'] as [string, string],
      route: '/(admin)/transactions',
    },
    {
      label: t('total_volume'),
      value: stats ? `${formatAmount(stats.totalVolume)} Ar` : '—',
      icon: 'wallet',
      colors: ['#f59e0b', '#d97706'] as [string, string],
      route: '/(admin)/stats',
    },
    {
      label: t('settings'),
      value: '',
      icon: 'settings',
      colors: ['#3b82f6', '#2563eb'] as [string, string],
      route: '/(admin)/settings',
    },
  ];

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
      <LinearGradient
        colors={['#4f46e5', '#7c3aed']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Animated.View style={{ opacity: headerOpacity }}>
          <View style={styles.headerBadge}>
            <View style={styles.headerDot} />
            <Text style={styles.headerBadgeText}>Admin Panel</Text>
          </View>
          <Text style={styles.headerTitle}>{t('dashboard')}</Text>
          <Text style={styles.headerSubtitle}>{t('overview')}</Text>

          {stats && (
            <View style={styles.quickStats}>
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{stats.activeUsers ?? 0}</Text>
                <Text style={styles.quickStatLabel}>{t('active_users')}</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{stats.totalTransactions ?? 0}</Text>
                <Text style={styles.quickStatLabel}>{t('transactions')}</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{formatAmount(stats.totalVolume ?? 0)}</Text>
                <Text style={styles.quickStatLabel}>Ar</Text>
              </View>
            </View>
          )}
        </Animated.View>
      </LinearGradient>

      {/* Cards Grid */}
      <View style={styles.grid}>
        {cards.map((c, i) => (
          <AnimatedStatCard key={c.label} {...c} delay={i * 80} />
        ))}
      </View>

      {/* Recent Activity */}
      {stats?.recentTransactions && stats.recentTransactions.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('recent_activity')}
          </Text>
          {stats.recentTransactions.slice(0, 3).map((tx: any) => (
            <View key={tx.id || tx._id} style={[styles.activityRow, { backgroundColor: colors.card }]}>
              <View style={[styles.activityIcon, { backgroundColor: COLORS.primary + '15' }]}>
                <Ionicons name="swap-horizontal" size={18} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.activityDesc, { color: colors.text }]}>
                  {tx.type || 'transaction'}
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
            onPress={() => router.push('/(admin)/transactions')}
          >
            <Text style={styles.viewAllText}>{t('view_all')}</Text>
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
  viewAllText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
});