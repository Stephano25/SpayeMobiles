import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { FriendService } from '../../src/services/FriendService';
import { TransactionService } from '../../src/services/TransactionService';
import { WalletService } from '../../src/services/WalletService';
import { COLORS, RADIUS, SPACING, FONT, SHADOW, formatAmount, getInitials, getAvatarColor } from '../../src/config';

const PRESETS = [1000, 5000, 10000, 20000, 50000, 100000];

export default function SendMoneyScreen() {
  const { colors } = useTheme();
  const { showError, showSuccess } = useNotification();

  const [balance, setBalance] = useState(0);
  const [friends, setFriends] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    WalletService.getWallet().then((w) => setBalance(w.balance ?? 0)).catch(() => {});
    FriendService.getFriends().then(setFriends).catch(() => {});
  }, []);

  const filtered = friends.filter((f) => {
    const name = `${f.friend?.firstName || ''} ${f.friend?.lastName || ''}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const numericAmount = Number(amount) || 0;

  const goConfirm = () => {
    if (!selected) return showError('Sélectionnez un destinataire');
    if (numericAmount < 100) return showError('Montant minimum : 100 Ar');
    if (numericAmount > balance) return showError('Solde insuffisant');
    setStep('confirm');
  };

  const confirmSend = async () => {
    setLoading(true);
    try {
      await TransactionService.sendMoney(selected.friend.id, numericAmount, description || undefined);
      setStep('success');
      setTimeout(() => router.replace('/(user)/wallet'), 1800);
    } catch (e: any) {
      showError(e?.response?.data?.message || "Erreur lors de l'envoi");
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={48} color={COLORS.white} />
        </View>
        <Text style={[styles.successTitle, { color: colors.text }]}>Envoi réussi !</Text>
        <Text style={styles.successSub}>
          {formatAmount(numericAmount)} Ar envoyés à {selected?.friend?.firstName}
        </Text>
      </View>
    );
  }

  if (step === 'confirm') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('form')}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Confirmer</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={[styles.confirmCard, { backgroundColor: colors.card }]}>
          <View style={[styles.avatarLg, { backgroundColor: getAvatarColor(selected.friend.firstName) }]}>
            <Text style={styles.avatarLgText}>{getInitials(selected.friend.firstName, selected.friend.lastName)}</Text>
          </View>
          <Text style={[styles.confirmName, { color: colors.text }]}>
            {selected.friend.firstName} {selected.friend.lastName}
          </Text>
          <Text style={styles.confirmAmount}>{formatAmount(numericAmount)} Ar</Text>
          {!!description && <Text style={styles.confirmDesc}>{description}</Text>}

          <View style={styles.divider} />
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Solde avant</Text>
            <Text style={[styles.confirmValue, { color: colors.text }]}>{formatAmount(balance)} Ar</Text>
          </View>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Solde après</Text>
            <Text style={[styles.confirmValue, { color: colors.text }]}>{formatAmount(balance - numericAmount)} Ar</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={confirmSend} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.primaryBtnText}>Confirmer l'envoi</Text>}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Envoyer de l'argent</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.balanceBanner}>
        <Text style={styles.balanceBannerLabel}>Solde disponible</Text>
        <Text style={styles.balanceBannerValue}>{formatAmount(balance)} Ar</Text>
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.card }]}>
        <Ionicons name="search" size={18} color={COLORS.gray400} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Rechercher un ami..."
          placeholderTextColor={COLORS.gray400}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {selected && (
        <View style={styles.selectedChip}>
          <View style={[styles.avatarSm, { backgroundColor: getAvatarColor(selected.friend.firstName) }]}>
            <Text style={styles.avatarSmText}>{getInitials(selected.friend.firstName, selected.friend.lastName)}</Text>
          </View>
          <Text style={styles.selectedChipText}>{selected.friend.firstName} {selected.friend.lastName}</Text>
          <TouchableOpacity onPress={() => setSelected(null)}>
            <Ionicons name="close-circle" size={20} color={COLORS.gray400} />
          </TouchableOpacity>
        </View>
      )}

      {!selected && (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          style={{ maxHeight: 180 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.friendRow} onPress={() => { setSelected(item); setSearch(''); }}>
              <View style={[styles.avatarSm, { backgroundColor: getAvatarColor(item.friend?.firstName || '') }]}>
                <Text style={styles.avatarSmText}>{getInitials(item.friend?.firstName, item.friend?.lastName)}</Text>
              </View>
              <Text style={[styles.friendName, { color: colors.text }]}>{item.friend?.firstName} {item.friend?.lastName}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={search.length > 0 ? <Text style={styles.empty}>Aucun ami trouvé</Text> : null}
        />
      )}

      <Text style={[styles.label, { color: colors.text, marginTop: SPACING.lg }]}>Montant (Ar)</Text>
      <TextInput
        style={[styles.amountInput, { color: colors.text, backgroundColor: colors.card }]}
        placeholder="0"
        placeholderTextColor={COLORS.gray400}
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <View style={styles.presetsRow}>
        {PRESETS.map((p) => (
          <TouchableOpacity key={p} style={[styles.presetBtn, amount === String(p) && styles.presetBtnActive]} onPress={() => setAmount(String(p))}>
            <Text style={[styles.presetText, amount === String(p) && styles.presetTextActive]}>{formatAmount(p)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { color: colors.text }]}>Description (optionnel)</Text>
      <TextInput
        style={[styles.amountInput, { color: colors.text, backgroundColor: colors.card, fontWeight: '400' }]}
        placeholder="Ex: remboursement..."
        placeholderTextColor={COLORS.gray400}
        value={description}
        onChangeText={setDescription}
      />

      <TouchableOpacity style={styles.primaryBtn} onPress={goConfirm}>
        <Text style={styles.primaryBtnText}>Continuer</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.lg, paddingTop: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.lg },
  headerTitle: { fontSize: FONT.size.lg, fontWeight: FONT.weight.bold },

  balanceBanner: { backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.lg },
  balanceBannerLabel: { fontSize: FONT.size.xs, color: COLORS.primary },
  balanceBannerValue: { fontSize: FONT.size.lg, fontWeight: FONT.weight.bold, color: COLORS.primary, marginTop: 2 },

  searchBox: { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, gap: SPACING.sm, ...SHADOW.sm },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: FONT.size.base },

  selectedChip: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.md, padding: SPACING.sm, marginTop: SPACING.sm },
  selectedChipText: { flex: 1, fontWeight: FONT.weight.semibold, color: COLORS.primary },

  friendRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm },
  friendName: { fontSize: FONT.size.base, fontWeight: FONT.weight.medium },
  empty: { textAlign: 'center', color: COLORS.gray400, paddingVertical: SPACING.md },

  avatarSm: { width: 36, height: 36, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  avatarSmText: { color: COLORS.white, fontWeight: FONT.weight.bold, fontSize: FONT.size.sm },
  avatarLg: { width: 72, height: 72, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  avatarLgText: { color: COLORS.white, fontWeight: FONT.weight.bold, fontSize: FONT.size.xl },

  label: { fontSize: FONT.size.sm, fontWeight: FONT.weight.semibold, marginBottom: SPACING.xs, marginTop: SPACING.md },
  amountInput: { borderRadius: RADIUS.md, padding: SPACING.md, fontSize: FONT.size.xl, fontWeight: FONT.weight.bold, ...SHADOW.sm },

  presetsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm },
  presetBtn: { paddingVertical: 6, paddingHorizontal: SPACING.md, borderRadius: RADIUS.full, backgroundColor: COLORS.gray100 },
  presetBtnActive: { backgroundColor: COLORS.primary },
  presetText: { fontSize: FONT.size.xs, color: COLORS.gray600, fontWeight: FONT.weight.medium },
  presetTextActive: { color: COLORS.white },

  primaryBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 16, alignItems: 'center', marginTop: SPACING.xl, ...SHADOW.md },
  primaryBtnText: { color: COLORS.white, fontWeight: FONT.weight.bold, fontSize: FONT.size.base },

  confirmCard: { borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center', ...SHADOW.md },
  confirmName: { fontSize: FONT.size.md, fontWeight: FONT.weight.semibold },
  confirmAmount: { fontSize: FONT.size.xxl, fontWeight: FONT.weight.extrabold, color: COLORS.primary, marginTop: SPACING.sm },
  confirmDesc: { color: COLORS.gray400, marginTop: SPACING.xs },
  divider: { height: 1, backgroundColor: COLORS.gray100, width: '100%', marginVertical: SPACING.lg },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: SPACING.sm },
  confirmLabel: { color: COLORS.gray400, fontSize: FONT.size.sm },
  confirmValue: { fontWeight: FONT.weight.semibold, fontSize: FONT.size.sm },

  successIcon: { width: 96, height: 96, borderRadius: RADIUS.full, backgroundColor: COLORS.success, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg },
  successTitle: { fontSize: FONT.size.xl, fontWeight: FONT.weight.bold, marginBottom: SPACING.sm },
  successSub: { color: COLORS.gray400, textAlign: 'center' },
});