// app/(user)/UserHome.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { useAuth } from '../../src/context/AuthContext';
import { WalletService } from '../../src/services/WalletService';
import { TransactionService } from '../../src/services/TransactionService';
import { COLORS, formatAmount, getInitials, getAvatarColor } from '../../src/config/colors';
import { SafeScreen } from '../../src/components/SafeScreen';
import { useTranslation } from '../../src/services/TranslationService';
import { getBaseUrl } from '../../src/config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function UserHome() {
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  const { showError } = useNotification();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [balance, setBalance] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const menuItems = [
    { icon: 'wallet-outline', label: t('wallet'), route: 'Wallet' },
    { icon: 'send-outline', label: t('send'), route: 'SendMoney' },
    { icon: 'qr-code-outline', label: t('receive'), route: 'ReceiveMoney' },
    { icon: 'phone-portrait-outline', label: t('mobile_money'), route: 'MobileMoney' },
    { icon: 'scan-outline', label: t('scan'), route: 'ScanPay' },
    { icon: 'people-outline', label: t('friends'), route: 'Friends' },
    { icon: 'chatbubble-outline', label: t('messages'), route: 'Chat' },
    { icon: 'receipt-outline', label: t('transactions'), route: 'Transactions' },
    { icon: 'person-outline', label: t('profile'), route: 'Profile' },
    { icon: 'settings-outline', label: t('settings'), route: 'Settings' },
  ];

  const loadData = useCallback(async () => {
    try {
      const [balanceData, statsData] = await Promise.all([
        WalletService.getBalance(),
        TransactionService.getUserDashboardStats(),
      ]);
      setBalance(balanceData.balance || 0);
      setStats(statsData);
    } catch (error) {
      showError(t('error_loading'));
    } finally {
      setIsLoading(false);
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

  const getAvatarGradient = () => {
    if (!user) return '#7c3aed';
    return getAvatarColor(user.firstName + user.lastName);
  };

  const navigateTo = (route: string) => {
    navigation.navigate(route as never);
  };

  const handleLogout = async () => {
    await logout();
  };

  const testBackend = async () => {
    try {
      const baseUrl = await getBaseUrl();
      console.log('🔍 Base URL:', baseUrl);
      
      const response = await fetch(`${baseUrl}/api/health`);
      const data = await response.json();
      console.log('✅ Backend response:', data);
      
      Alert.alert('Succès', 'Backend accessible !');
    } catch (error) {
      console.error('❌ Erreur backend:', error);
      Alert.alert('Erreur', 'Backend non accessible');
    }
  };

  const renderTransaction = (tx: any) => {
    const isCredit = tx.type === 'deposit' || tx.type === 'receive';
    return (
      <View key={tx.id} style={[styles.txItem, { backgroundColor: colors.card }]}>
        <View style={[styles.txIcon, { backgroundColor: isCredit ? COLORS.success + '20' : COLORS.error + '20' }]}>
          <Ionicons name={isCredit ? 'arrow-down' : 'arrow-up'} size={20} color={isCredit ? COLORS.success : COLORS.error} />
        </View>
        <View style={styles.txInfo}>
          <Text style={[styles.txDesc, { color: colors.text }]}>
            {tx.description || t('transfer')}
          </Text>
          <Text style={[styles.txDate, { color: colors.textSecondary }]}>
            {new Date(tx.createdAt).toLocaleDateString('fr-MG')}
          </Text>
        </View>
        <Text style={[styles.txAmount, { color: isCredit ? COLORS.success : COLORS.error }]}>
          {isCredit ? '+' : '-'}{formatAmount(tx.amount)}
        </Text>
      </View>
    );
  };

  return (
    <SafeScreen backgroundColor={colors.background}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        <View style={[styles.welcomeCard, { backgroundColor: colors.card }]}>
          <View style={styles.welcomeHeader}>
            <View style={styles.avatarContainer}>
              {user?.profilePicture && !imageError ? (
                <Image
                  source={{ uri: user.profilePicture }}
                  style={styles.avatar}
                  onError={() => setImageError(true)}
                />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: getAvatarGradient() }]}>
                  <Text style={styles.avatarText}>{getInitials(user?.firstName || '', user?.lastName || '')}</Text>
                </View>
              )}
            </View>
            <View style={styles.welcomeText}>
              <Text style={[styles.welcomeTitle, { color: colors.text }]}>{t('welcome')}</Text>
              <Text style={[styles.welcomeName, { color: colors.text }]}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={[styles.welcomeEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
            </View>
          </View>

          <View style={styles.balanceSection}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('loading')}</Text>
              </View>
            ) : (
              <View style={styles.balanceContainer}>
                <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>{t('balance')}</Text>
                <Text style={styles.balanceAmount}>{formatAmount(balance)}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.testBtn, { backgroundColor: COLORS.primary + '20' }]}
            onPress={testBackend}
          >
            <Ionicons name="server-outline" size={16} color={COLORS.primary} />
            <Text style={[styles.testBtnText, { color: COLORS.primary }]}>Tester Backend</Text>
          </TouchableOpacity>

          <View style={styles.userActionsRow}>
            <TouchableOpacity
              style={[styles.userActionBtn, { backgroundColor: COLORS.success }]}
              onPress={() => navigation.navigate('ScanPay' as never, { type: 'deposit' })}
            >
              <Ionicons name="qr-code" size={20} color={COLORS.white} />
              <Text style={styles.userActionText}>Scanner Dépôt</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.userActionBtn, { backgroundColor: COLORS.error }]}
              onPress={() => navigation.navigate('ScanPay' as never, { type: 'withdraw' })}
            >
              <Ionicons name="qr-code" size={20} color={COLORS.white} />
              <Text style={styles.userActionText}>Scanner Retrait</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.menuGrid}>
          <View style={styles.menuGridInner}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.route}
                style={[styles.menuCard, { backgroundColor: colors.card }]}
                onPress={() => navigateTo(item.route)}
                activeOpacity={0.7}
              >
                <Ionicons name={item.icon as any} size={28} color={COLORS.primary} />
                <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {stats && !isLoading && (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <View style={styles.statIcon}>
                <Ionicons name="swap-horizontal" size={22} color={COLORS.primary} />
              </View>
              <View style={styles.statInfo}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('transactions')}</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalTransactions || 0}</Text>
              </View>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <View style={styles.statIcon}>
                <Ionicons name="trending-up" size={22} color={COLORS.primary} />
              </View>
              <View style={styles.statInfo}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('largest')}</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {stats.largestTransaction ? formatAmount(stats.largestTransaction.amount) : '0 Ar'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {stats?.lastThreeTransactions && stats.lastThreeTransactions.length > 0 && !isLoading && (
          <View style={[styles.txCard, { backgroundColor: colors.card }]}>
            <View style={styles.txHeader}>
              <Text style={[styles.txTitle, { color: colors.text }]}>{t('recent_activity')}</Text>
              <TouchableOpacity onPress={() => navigateTo('Transactions')}>
                <Text style={[styles.viewAll, { color: COLORS.primary }]}>{t('view_all')}</Text>
              </TouchableOpacity>
            </View>
            {stats.lastThreeTransactions.map(renderTransaction)}
          </View>
        )}

        {(!stats || !stats.lastThreeTransactions || stats.lastThreeTransactions.length === 0) && !isLoading && (
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <Ionicons name="receipt-outline" size={56} color={COLORS.gray400} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('no_transactions')}</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('start_transaction')}</Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: COLORS.primary }]}
              onPress={() => navigateTo('ScanPay')}
            >
              <Text style={styles.emptyBtnText}>{t('scan_qr')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: COLORS.error }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
          <Text style={styles.logoutText}>{t('logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  welcomeCard: {
    margin: 16,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  welcomeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatarContainer: { marginRight: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: COLORS.white, fontWeight: 'bold', fontSize: 18 },
  welcomeText: { flex: 1 },
  welcomeTitle: { fontSize: 12, fontWeight: '600' },
  welcomeName: { fontSize: 16, fontWeight: '700' },
  welcomeEmail: { fontSize: 13, marginTop: 2 },
  balanceSection: { paddingTop: 16, borderTopWidth: 0.5, borderTopColor: COLORS.gray200 },
  loadingContainer: { alignItems: 'center', paddingVertical: 8 },
  loadingText: { fontSize: 14 },
  balanceContainer: { alignItems: 'center' },
  balanceLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  balanceAmount: { fontSize: 32, fontWeight: 'bold', color: COLORS.success, marginTop: 4 },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  testBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  userActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  userActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  userActionText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  menuGrid: { paddingHorizontal: 12, marginBottom: 8 },
  menuGridInner: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  menuCard: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  menuLabel: { fontSize: 10, fontWeight: '500', textAlign: 'center', marginTop: 4 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 12 },
  statCard: { flex: 1, padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  statIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.primary + '20', alignItems: 'center', justifyContent: 'center' },
  statInfo: { flex: 1 },
  statLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 16, fontWeight: 'bold' },
  txCard: { margin: 16, padding: 16, borderRadius: 20 },
  txHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  txTitle: { fontSize: 16, fontWeight: 'bold' },
  viewAll: { fontWeight: '600', fontSize: 14 },
  txItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderRadius: 12, paddingHorizontal: 10, marginBottom: 6 },
  txIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 14, fontWeight: '600' },
  txDate: { fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: 'bold' },
  emptyCard: { margin: 16, padding: 40, borderRadius: 20, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 12 },
  emptyText: { fontSize: 14, marginTop: 4, textAlign: 'center' },
  emptyBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  emptyBtnText: { color: COLORS.white, fontWeight: 'bold' },
  logoutBtn: { marginHorizontal: 16, padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, marginBottom: 24 },
  logoutText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
});