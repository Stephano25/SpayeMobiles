// app/(admin)/index.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Dimensions,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { AdminService } from '../../src/services/AdminService';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, formatAmount } from '../../src/config/colors';
import * as Clipboard from 'expo-clipboard';
import { QRScanner } from '../../src/components/QRScanner';

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
  const { showError, showSuccess } = useNotification();
  const { getCurrentUser } = useAuth();
  const navigation = useNavigation();
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const headerOpacity = useRef(new Animated.Value(0)).current;

  // États pour QR Code - Génération
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [qrAction, setQrAction] = useState<'deposit' | 'withdraw'>('deposit');
  const [generatingQR, setGeneratingQR] = useState(false);
  const [qrExpiresAt, setQrExpiresAt] = useState<string>('');

  // États pour Scanner QR - Utilise QRScanner
  const [showScanner, setShowScanner] = useState(false);
  const [scannerType, setScannerType] = useState<'deposit' | 'withdraw'>('deposit');
  const [scannedData, setScannedData] = useState<any>(null);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [processing, setProcessing] = useState(false);
  const [isWeb, setIsWeb] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    setIsSuperAdmin(user?.role === 'super_admin');
    setIsWeb(Platform.OS === 'web');
  }, []);

  const load = async () => {
    try {
      const data = await AdminService.getDashboardStats();
      setStats(data);
      await loadCommissions();
    } catch (error) {
      showError('Erreur chargement du tableau de bord');
    }
  };

  // ✅ Chargement des commissions
  const loadCommissions = useCallback(async () => {
    try {
      const data = await AdminService.getCommissionStats();
      setStats(prev => ({
        ...prev,
        totalCommission: data.totalCommission || 0,
        commissionTransactions: data.commissionTransactions || 0,
        recentCommissions: data.recentCommissions || [],
        commissionRate: data.commissionRate || 0.5,
        myCommission: data.myCommission || 0,
        myCommissionTransactions: data.myCommissionTransactions || 0,
      }));
    } catch (error) {
      console.error('Erreur chargement commissions:', error);
    }
  }, []);

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

  // ✅ Génération de QR Code
  const generateQRCode = async (type: 'deposit' | 'withdraw') => {
    setQrAction(type);
    setGeneratingQR(true);
    setShowQRModal(true);
    setQrCodeImage(null);

    try {
      const response = await AdminService.generateQRCode(type);
      const imageUrl = response.qrCodeImage || response.qrCode;
      if (imageUrl) {
        setQrCodeImage(imageUrl);
        setQrCodeData(response.qrCode || JSON.stringify(response));
        setQrExpiresAt(response.expiresAt || new Date(Date.now() + 5 * 60000).toISOString());
        showSuccess(`QR Code de ${type === 'deposit' ? 'dépôt' : 'retrait'} généré`);
      } else {
        showError('Erreur: QR Code non reçu');
      }
    } catch (error: any) {
      showError(error?.message || 'Erreur lors de la génération');
    } finally {
      setGeneratingQR(false);
    }
  };

  // ✅ Ouvrir le scanner
  const openScanner = (type: 'deposit' | 'withdraw') => {
    setScannerType(type);
    setScannedData(null);
    setShowTransactionForm(false);
    setAmount('');
    setDescription('');
    setShowScanner(true);
  };

  // ✅ Traitement du QR Code scanné
  const handleScanResult = (data: string) => {
    setShowScanner(false);
    
    try {
      console.log('📱 QR Code scanné par Admin:', data);
      
      let parsedData;
      try {
        parsedData = JSON.parse(data);
      } catch {
        parsedData = { qrCode: data, type: 'simple' };
      }

      setScannedData(parsedData);

      if (parsedData.type === 'admin_transaction' || parsedData.action) {
        const action = parsedData.action || scannerType;
        Alert.alert(
          action === 'deposit' ? '💰 Dépôt' : '💸 Retrait',
          `QR Code ${action === 'deposit' ? 'de dépôt' : 'de retrait'} détecté\n\n` +
          `Utilisateur: ${parsedData.userName || parsedData.adminName || 'Non spécifié'}`,
          [
            { 
              text: 'Annuler', 
              style: 'cancel',
              onPress: () => {
                setScannedData(null);
              }
            },
            {
              text: 'Continuer',
              onPress: () => {
                setShowTransactionForm(true);
                if (parsedData.amount) {
                  setAmount(String(parsedData.amount));
                }
                if (parsedData.userId) {
                  setScannedData({ ...parsedData, userId: parsedData.userId });
                }
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'QR Code scanné',
          `Données: ${data.substring(0, 50)}...`,
          [
            { 
              text: 'Fermer', 
              onPress: () => {
                setScannedData(null);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Erreur traitement QR:', error);
      showError('QR Code invalide');
      setScannedData(null);
    }
  };

  // ✅ Traitement de la transaction (Dépôt/Retrait Admin)
  const handleTransaction = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum < 100) {
      showError('Montant minimum: 100 Ar');
      return;
    }

    const userId = scannedData?.userId;
    if (!userId) {
      showError('ID utilisateur non trouvé');
      return;
    }

    setProcessing(true);
    try {
      const action = scannedData?.action || scannerType;
      const qrData = scannedData?.qrCode || JSON.stringify(scannedData);

      if (action === 'deposit') {
        await AdminService.depositMoney(userId, amountNum, description || 'Dépôt via QR Code Admin', qrData);
        showSuccess(`Dépôt de ${formatAmount(amountNum)} Ar effectué`);
      } else {
        await AdminService.withdrawMoney(userId, amountNum, description || 'Retrait via QR Code Admin', qrData);
        showSuccess(`Retrait de ${formatAmount(amountNum)} Ar effectué`);
      }

      setShowTransactionForm(false);
      setScannedData(null);
      setAmount('');
      setDescription('');
      load();
    } catch (error: any) {
      showError(error?.message || 'Erreur lors de la transaction');
    } finally {
      setProcessing(false);
    }
  };

  const copyQRCode = async () => {
    try {
      await Clipboard.setStringAsync(qrCodeData);
      showSuccess('QR Code copié dans le presse-papier');
    } catch {
      showError('Erreur lors de la copie');
    }
  };

  const shareQRCode = async () => {
    try {
      showSuccess('QR Code partagé');
    } catch {
      showError('Erreur lors du partage');
    }
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
    { icon: 'wallet-outline', label: 'Portefeuille', route: 'AdminWallet' },
    { icon: 'people', label: 'Utilisateurs', route: 'AdminUsers' },
    { icon: 'people-outline', label: 'Amis', route: 'AdminFriends' },
    { icon: 'chatbubble-outline', label: 'Messages', route: 'AdminChat' },
    { icon: 'receipt', label: 'Transactions', route: 'AdminTransactions' },
    { icon: 'phone-portrait-outline', label: 'Mobile Money', route: 'AdminMobileMoney' },
    { icon: 'bar-chart', label: 'Statistiques', route: 'AdminStats' },
    { icon: 'person', label: 'Mon Profil', route: 'AdminProfile' },
    { icon: 'settings', label: 'Paramètres', route: 'AdminSettings' },
  ];

  if (isSuperAdmin) {
    menuItems.splice(2, 0, { icon: 'shield', label: 'Administrateurs', route: 'AdminAdmins' });
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

      {/* ✅ Actions Admin - Génération QR Code + Scanner */}
      <View style={styles.actionsContainer}>
        <Text style={[styles.actionsTitle, { color: colors.text }]}>Opérations rapides</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card }]}
            onPress={() => generateQRCode('deposit')}
          >
            <View style={[styles.actionIcon, { backgroundColor: COLORS.success + '18' }]}>
              <Ionicons name="qr-code" size={28} color={COLORS.success} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.text }]}>Générer QR</Text>
            <Text style={[styles.actionSub, { color: colors.textSecondary }]}>Dépôt</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card }]}
            onPress={() => generateQRCode('withdraw')}
          >
            <View style={[styles.actionIcon, { backgroundColor: COLORS.error + '18' }]}>
              <Ionicons name="qr-code" size={28} color={COLORS.error} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.text }]}>Générer QR</Text>
            <Text style={[styles.actionSub, { color: colors.textSecondary }]}>Retrait</Text>
          </TouchableOpacity>
        </View>

        {/* ✅ Scanner QR pour Admin */}
        <View style={styles.scannerRow}>
          <TouchableOpacity
            style={[styles.scannerCard, { backgroundColor: colors.card }]}
            onPress={() => openScanner('deposit')}
          >
            <View style={[styles.scannerIcon, { backgroundColor: COLORS.success + '18' }]}>
              <Ionicons name="scan" size={28} color={COLORS.success} />
            </View>
            <Text style={[styles.scannerLabel, { color: colors.text }]}>
              {isWeb ? 'Simuler Dépôt' : 'Scanner Dépôt'}
            </Text>
            <Text style={[styles.scannerSub, { color: colors.textSecondary }]}>
              {isWeb ? 'Simuler QR pour dépôt' : 'Scanner QR pour dépôt'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.scannerCard, { backgroundColor: colors.card }]}
            onPress={() => openScanner('withdraw')}
          >
            <View style={[styles.scannerIcon, { backgroundColor: COLORS.error + '18' }]}>
              <Ionicons name="scan" size={28} color={COLORS.error} />
            </View>
            <Text style={[styles.scannerLabel, { color: colors.text }]}>
              {isWeb ? 'Simuler Retrait' : 'Scanner Retrait'}
            </Text>
            <Text style={[styles.scannerSub, { color: colors.textSecondary }]}>
              {isWeb ? 'Simuler QR pour retrait' : 'Scanner QR pour retrait'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ✅ COMMISSIONS - SUPER ADMIN */}
      {stats && isSuperAdmin && (
        <View style={styles.commissionSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="receipt-long" size={20} color={COLORS.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Commissions perçues
            </Text>
            <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
              Taux: {stats.commissionRate || 0.5}%
            </Text>
          </View>

          <View style={styles.commissionGrid}>
            <View style={[styles.commissionCard, { backgroundColor: colors.card }]}>
              <Ionicons name="cash" size={24} color={COLORS.success} />
              <Text style={[styles.commissionValue, { color: colors.text }]}>
                {formatAmount(stats.totalCommission || 0)} Ar
              </Text>
              <Text style={[styles.commissionLabel, { color: colors.textSecondary }]}>
                Total commissions
              </Text>
            </View>

            <View style={[styles.commissionCard, { backgroundColor: colors.card }]}>
              <Ionicons name="receipt" size={24} color={COLORS.primary} />
              <Text style={[styles.commissionValue, { color: colors.text }]}>
                {stats.commissionTransactions || 0}
              </Text>
              <Text style={[styles.commissionLabel, { color: colors.textSecondary }]}>
                Transactions avec commission
              </Text>
            </View>
          </View>

          {stats.recentCommissions && stats.recentCommissions.length > 0 && (
            <View style={[styles.recentCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.recentTitle, { color: colors.text }]}>
                <Ionicons name="history" size={16} color={COLORS.primary} /> Dernières commissions
              </Text>
              {stats.recentCommissions.slice(0, 3).map((c: any) => (
                <View key={c.id} style={styles.commissionItem}>
                  <View style={styles.commissionItemIcon}>
                    <Ionicons name="payments" size={16} color={COLORS.success} />
                  </View>
                  <View style={styles.commissionItemInfo}>
                    <Text style={[styles.commissionItemName, { color: colors.text }]}>
                      {c.userName || 'Utilisateur'}
                    </Text>
                    <Text style={[styles.commissionItemSub, { color: colors.textSecondary }]}>
                      Commission: {formatAmount(c.commission)} Ar sur {formatAmount(c.amount)} Ar
                    </Text>
                  </View>
                  <Text style={[styles.commissionItemDate, { color: colors.textSecondary }]}>
                    {new Date(c.createdAt).toLocaleDateString('fr-MG')}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

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

      {/* ✅ Modal QR Code - Génération */}
      <Modal
        visible={showQRModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowQRModal(false);
          setQrCodeImage(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                QR Code {qrAction === 'deposit' ? 'Dépôt' : 'Retrait'}
              </Text>
              <TouchableOpacity onPress={() => {
                setShowQRModal(false);
                setQrCodeImage(null);
              }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {generatingQR ? (
              <View style={styles.qrLoading}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={[styles.qrLoadingText, { color: colors.textSecondary }]}>Génération...</Text>
              </View>
            ) : (
              <>
                {qrCodeImage && (
                  <View style={styles.qrImageWrapper}>
                    <Image source={{ uri: qrCodeImage }} style={styles.qrImage} resizeMode="contain" />
                    <Text style={[styles.qrExpiry, { color: colors.textSecondary }]}>
                      Expire le: {new Date(qrExpiresAt).toLocaleString('fr-MG')}
                    </Text>
                  </View>
                )}
                <View style={styles.qrActions}>
                  <TouchableOpacity style={[styles.qrActionBtn, { backgroundColor: COLORS.primary }]} onPress={copyQRCode}>
                    <Ionicons name="copy" size={20} color={COLORS.white} />
                    <Text style={styles.qrActionText}>Copier</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.qrActionBtn, { backgroundColor: COLORS.success }]} onPress={shareQRCode}>
                    <Ionicons name="share" size={20} color={COLORS.white} />
                    <Text style={styles.qrActionText}>Partager</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ✅ Modal Scanner - Utilise QRScanner */}
      <Modal
        visible={showScanner}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowScanner(false);
        }}
      >
        <QRScanner
          onScan={(data) => {
            handleScanResult(data);
          }}
          onClose={() => {
            setShowScanner(false);
          }}
          title={scannerType === 'deposit' ? 'Scanner Dépôt' : 'Scanner Retrait'}
          scannerType={scannerType}
        />
      </Modal>

      {/* ✅ Modal Formulaire Transaction */}
      <Modal
        visible={showTransactionForm}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowTransactionForm(false);
          setScannedData(null);
          setAmount('');
          setDescription('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {scannerType === 'deposit' ? '💰 Dépôt' : '💸 Retrait'}
              </Text>
              <TouchableOpacity onPress={() => {
                setShowTransactionForm(false);
                setScannedData(null);
                setAmount('');
                setDescription('');
              }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {scannedData?.userName && (
              <Text style={[styles.userInfoText, { color: colors.text }]}>
                Utilisateur: {scannedData.userName}
              </Text>
            )}

            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="Montant (Ar)"
              placeholderTextColor={COLORS.gray400}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="Description (optionnelle)"
              placeholderTextColor={COLORS.gray400}
              value={description}
              onChangeText={setDescription}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => {
                  setShowTransactionForm(false);
                  setScannedData(null);
                  setAmount('');
                  setDescription('');
                }}
              >
                <Text style={styles.modalBtnCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={handleTransaction}
                disabled={processing || !amount || parseFloat(amount) < 100}
              >
                {processing ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.modalBtnConfirmText}>
                    {scannerType === 'deposit' ? 'Déposer' : 'Retirer'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  actionsContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  actionsTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 12,
  },
  actionCard: {
    flex: 1,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  actionSub: {
    fontSize: 11,
    textAlign: 'center',
  },
  scannerRow: {
    flexDirection: 'row',
    gap: 14,
  },
  scannerCard: {
    flex: 1,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  scannerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  scannerLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  scannerSub: {
    fontSize: 11,
    textAlign: 'center',
  },
  commissionSection: { marginTop: 16, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', flex: 1 },
  sectionSub: { fontSize: 12, marginLeft: 'auto' },
  commissionGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  commissionCard: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
  commissionValue: { fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  commissionLabel: { fontSize: 11, marginTop: 2 },
  recentCard: { padding: 16, borderRadius: 16 },
  recentTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  commissionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: COLORS.gray100 },
  commissionItemIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.successLight, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  commissionItemInfo: { flex: 1 },
  commissionItemName: { fontSize: 13, fontWeight: '500' },
  commissionItemSub: { fontSize: 11 },
  commissionItemDate: { fontSize: 11 },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  qrLoading: { alignItems: 'center', padding: 40 },
  qrLoadingText: { marginTop: 12, fontSize: 14 },
  qrImageWrapper: { alignItems: 'center', padding: 20 },
  qrImage: { width: 200, height: 200 },
  qrExpiry: { fontSize: 12, marginTop: 8 },
  qrActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  qrActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, gap: 8 },
  qrActionText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },
  userInfoText: { fontSize: 14, textAlign: 'center', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: COLORS.gray100 },
  modalBtnCancelText: { color: COLORS.gray600, fontWeight: '600' },
  modalBtnConfirm: { backgroundColor: COLORS.primary },
  modalBtnConfirmText: { color: COLORS.white, fontWeight: 'bold' },
});