// app/(user)/send-money.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { WalletService } from '../../src/services/WalletService';
import { FriendService } from '../../src/services/FriendService';
import { COLORS, formatAmount } from '../../src/config/colors';
import { SafeScreen } from '../../src/components/SafeScreen';
import { useTranslation } from '../../src/services/TranslationService';

export default function SendMoneyScreen() {
  const { colors } = useTheme();
  const { showSuccess, showError } = useNotification();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [balance, setBalance] = useState(0);
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [balanceData, friendsData] = await Promise.all([
        WalletService.getBalance(),
        FriendService.getFriends(),
      ]);
      setBalance(balanceData.balance || 0);
      setFriends(friendsData || []);
    } catch (error) {
      showError(t('error_loading'));
    }
  };

  const filteredFriends = friends.filter(f =>
    (f.friend?.firstName + ' ' + f.friend?.lastName)
      .toLowerCase()
      .includes(searchQuery.toLowerCase()) ||
    f.friend?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = async () => {
    if (!selectedFriend) {
      showError(t('select_recipient'));
      return;
    }
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum < 100) {
      showError(t('min_amount'));
      return;
    }
    if (amountNum > balance) {
      showError(t('insufficient_balance'));
      return;
    }

    setLoading(true);
    try {
      await WalletService.sendMoney({
        receiverId: selectedFriend.friend.id,
        amount: amountNum,
        description: description || t('transfer'),
      });
      showSuccess(t('success'));
      navigation.goBack();
    } catch (error) {
      showError(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [1000, 5000, 10000, 20000, 50000, 100000];

  return (
    <SafeScreen backgroundColor={colors.background}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('send')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Balance */}
        <View style={[styles.balanceCard, { backgroundColor: '#1a1830' }]}>
          <Text style={styles.balanceLabel}>{t('balance')}</Text>
          <Text style={styles.balanceAmount}>{formatAmount(balance)} Ar</Text>
        </View>

        {/* Search Friend */}
        <View style={[styles.searchBox, { backgroundColor: colors.card }]}>
          <Ionicons name="search" size={20} color={COLORS.gray400} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('search_friends')}
            placeholderTextColor={COLORS.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Friend List */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.friendScroll}>
          {filteredFriends.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[
                styles.friendChip,
                { backgroundColor: selectedFriend?.id === f.id ? COLORS.primary : colors.card },
              ]}
              onPress={() => setSelectedFriend(f)}
            >
              <View style={[styles.friendAvatar, { backgroundColor: COLORS.primary }]}>
                <Text style={styles.friendAvatarText}>
                  {(f.friend?.firstName?.charAt(0) || '') + (f.friend?.lastName?.charAt(0) || '')}
                </Text>
              </View>
              <Text style={[
                styles.friendName,
                { color: selectedFriend?.id === f.id ? COLORS.white : colors.text }
              ]}>
                {f.friend?.firstName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Selected Friend */}
        {selectedFriend && (
          <View style={[styles.selectedCard, { backgroundColor: colors.card }]}>
            <View style={styles.selectedRow}>
              <View style={[styles.selectedAvatar, { backgroundColor: COLORS.primary }]}>
                <Text style={styles.selectedAvatarText}>
                  {(selectedFriend.friend?.firstName?.charAt(0) || '') + (selectedFriend.friend?.lastName?.charAt(0) || '')}
                </Text>
              </View>
              <View style={styles.selectedInfo}>
                <Text style={[styles.selectedName, { color: colors.text }]}>
                  {selectedFriend.friend?.firstName} {selectedFriend.friend?.lastName}
                </Text>
                <Text style={[styles.selectedEmail, { color: colors.textSecondary }]}>
                  {selectedFriend.friend?.email}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedFriend(null)}>
                <Ionicons name="close" size={24} color={COLORS.gray400} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Amount */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.label, { color: colors.text }]}>{t('amount')}</Text>
          <TextInput
            style={[styles.amountInput, { color: colors.text }]}
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            placeholderTextColor={COLORS.gray400}
            keyboardType="numeric"
          />
          <Text style={[styles.currency, { color: colors.textSecondary }]}>Ar</Text>

          <View style={styles.quickAmounts}>
            {quickAmounts.map((a) => (
              <TouchableOpacity
                key={a}
                style={[styles.quickBtn, { backgroundColor: colors.background }]}
                onPress={() => setAmount(String(a))}
              >
                <Text style={[styles.quickText, { color: colors.text }]}>{formatAmount(a)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={[styles.descInput, { color: colors.text, borderColor: colors.border }]}
            value={description}
            onChangeText={setDescription}
            placeholder={t('description')}
            placeholderTextColor={COLORS.gray400}
          />
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: COLORS.primary }]}
          onPress={handleSend}
          disabled={loading || !selectedFriend || !amount || parseFloat(amount) > balance}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="send" size={20} color={COLORS.white} />
              <Text style={styles.sendText}>{t('send')}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  balanceCard: { margin: 16, padding: 20, borderRadius: 16 },
  balanceLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  balanceAmount: { color: COLORS.white, fontSize: 28, fontWeight: 'bold', marginTop: 4 },
  searchBox: { margin: 16, paddingHorizontal: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, marginLeft: 8 },
  friendScroll: { paddingHorizontal: 16, marginBottom: 8 },
  friendChip: { alignItems: 'center', padding: 10, borderRadius: 12, marginRight: 10, minWidth: 70 },
  friendAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  friendAvatarText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },
  friendName: { fontSize: 11, fontWeight: '500', marginTop: 4, textAlign: 'center' },
  selectedCard: { marginHorizontal: 16, padding: 12, borderRadius: 12 },
  selectedRow: { flexDirection: 'row', alignItems: 'center' },
  selectedAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  selectedAvatarText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },
  selectedInfo: { flex: 1, marginLeft: 10 },
  selectedName: { fontSize: 14, fontWeight: '600' },
  selectedEmail: { fontSize: 12 },
  card: { marginHorizontal: 16, padding: 16, borderRadius: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  amountInput: { fontSize: 32, fontWeight: 'bold', padding: 0 },
  currency: { fontSize: 14, marginTop: 4 },
  quickAmounts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 12 },
  quickBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  quickText: { fontSize: 13, fontWeight: '600' },
  descInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 15, marginTop: 4 },
  sendBtn: { margin: 16, padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  sendText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
});