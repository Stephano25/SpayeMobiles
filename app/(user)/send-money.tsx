import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { WalletService } from '../../src/services/WalletService';
import { FriendService } from '../../src/services/FriendService';
import { TransactionService } from '../../src/services/TransactionService';
import { COLORS, formatAmount, getInitials } from '../../src/config';
import { router } from 'expo-router';

export default function SendMoneyScreen() {
  const { colors } = useTheme();
  const { showError, showSuccess } = useNotification();
  const [balance, setBalance] = useState(0);
  const [receiverId, setReceiverId] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [friends, setFriends] = useState<any[]>([]);
  const [showFriendPicker, setShowFriendPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'confirm'>('form');

  const amountPresets = [100, 500, 1000, 5000, 10000, 20000, 50000, 100000];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [wallet, friendsList] = await Promise.all([
        WalletService.getWallet(),
        FriendService.getFriends(),
      ]);
      setBalance(wallet.balance);
      // ✅ Correction : Vérifier que friendsList est un tableau
      setFriends(Array.isArray(friendsList) ? friendsList.filter(f => f.status === 'accepted') : []);
    } catch (error) {
      showError('Erreur chargement');
    }
  };

  const handleSend = () => {
    const amountNum = parseFloat(amount);
    if (!receiverId) return showError('Sélectionnez un destinataire');
    if (isNaN(amountNum) || amountNum < 100) return showError('Montant minimum 100 Ar');
    if (amountNum > balance) return showError('Solde insuffisant');
    setStep('confirm');
  };

  const confirmSend = async () => {
    setIsLoading(true);
    try {
      await TransactionService.sendMoney({ receiverId, amount: parseFloat(amount), description });
      showSuccess(`Envoi de ${formatAmount(parseFloat(amount))} Ar réussi`);
      router.back();
    } catch (error: any) {
      showError(error.response?.data?.message || 'Erreur envoi');
    } finally {
      setIsLoading(false);
    }
  };

  const selectFriend = (friend: any) => {
    setReceiverId(friend.friend.id);
    setReceiverName(`${friend.friend.firstName} ${friend.friend.lastName}`);
    setShowFriendPicker(false);
  };

  if (step === 'confirm') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
          <TouchableOpacity onPress={() => setStep('form')} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirmation</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.confirmCard}>
          <View style={styles.confirmIcon}><Text style={styles.confirmIconText}>✓</Text></View>
          <Text style={styles.confirmTitle}>Vérifiez les informations</Text>
          <View style={styles.confirmDetails}>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Destinataire</Text>
              <Text style={styles.confirmValue}>{receiverName}</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Montant</Text>
              <Text style={[styles.confirmValue, styles.amountValue]}>{formatAmount(parseFloat(amount))} Ar</Text>
            </View>
            {description ? (
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Description</Text>
                <Text style={styles.confirmValue}>{description}</Text>
              </View>
            ) : null}
            <View style={styles.confirmDivider} />
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Solde après</Text>
              <Text style={styles.confirmValue}>{formatAmount(balance - parseFloat(amount))} Ar</Text>
            </View>
          </View>
          <View style={styles.confirmActions}>
            <TouchableOpacity style={[styles.confirmButton, styles.cancelButton]} onPress={() => setStep('form')}>
              <Text style={styles.cancelButtonText}>Retour</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.confirmButton, styles.confirmButtonActive]} onPress={confirmSend} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.confirmButtonText}>Confirmer</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Envoyer de l'argent</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Solde disponible</Text>
        <Text style={styles.balanceAmount}>{formatAmount(balance)} Ar</Text>
      </View>

      <View style={styles.formCard}>
        <TouchableOpacity style={styles.friendSelector} onPress={() => setShowFriendPicker(true)}>
          <Text style={styles.friendSelectorLabel}>Destinataire</Text>
          <Text style={styles.friendSelectorValue}>{receiverName || 'Sélectionner un ami'}</Text>
          <Text style={styles.friendSelectorIcon}>▼</Text>
        </TouchableOpacity>

        <View style={styles.amountContainer}>
          <Text style={styles.inputLabel}>Montant (Ar)</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0"
          />
          <View style={styles.quickAmounts}>
            {amountPresets.map(preset => (
              <TouchableOpacity
                key={preset}
                style={[styles.quickAmountButton, parseFloat(amount) === preset && styles.quickAmountActive]}
                onPress={() => setAmount(preset.toString())}
              >
                <Text style={[styles.quickAmountText, parseFloat(amount) === preset && styles.quickAmountTextActive]}>
                  {formatAmount(preset)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.descriptionContainer}>
          <Text style={styles.inputLabel}>Description (optionnelle)</Text>
          <TextInput
            style={styles.descriptionInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Ex: Remboursement..."
            multiline
          />
        </View>

        <TouchableOpacity
          style={[styles.sendButton, (!receiverId || !amount || parseFloat(amount) > balance) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!receiverId || !amount || parseFloat(amount) > balance}
        >
          <Text style={styles.sendButtonText}>Continuer</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showFriendPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Sélectionner un ami</Text>
              <TouchableOpacity onPress={() => setShowFriendPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {friends.map(friend => (
                <TouchableOpacity key={friend.id} style={styles.friendItem} onPress={() => selectFriend(friend)}>
                  <View style={styles.friendAvatar}>
                    <Text style={styles.friendAvatarText}>
                      {getInitials(friend.friend.firstName, friend.friend.lastName)}
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.friendName, { color: colors.text }]}>
                      {friend.friend.firstName} {friend.friend.lastName}
                    </Text>
                    <Text style={styles.friendEmail}>{friend.friend.email}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              {friends.length === 0 && <Text style={styles.noFriendsText}>Aucun ami. Ajoutez des amis d'abord.</Text>}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  backButton: { padding: 8 },
  backText: { fontSize: 24, color: COLORS.white },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  balanceCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  balanceLabel: { fontSize: 14, color: COLORS.gray600, marginBottom: 8 },
  balanceAmount: { fontSize: 28, fontWeight: 'bold', color: COLORS.primary },
  formCard: { backgroundColor: COLORS.white, marginHorizontal: 20, marginTop: 20, borderRadius: 20, padding: 20, marginBottom: 40 },
  friendSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  friendSelectorLabel: { fontSize: 12, color: COLORS.gray500, position: 'absolute', top: -8, left: 12, backgroundColor: COLORS.white, paddingHorizontal: 4 },
  friendSelectorValue: { fontSize: 16, color: COLORS.gray900 },
  friendSelectorIcon: { fontSize: 12, color: COLORS.gray500 },
  amountContainer: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: COLORS.gray700, marginBottom: 8 },
  amountInput: {
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
  },
  quickAmounts: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 },
  quickAmountButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.gray100 },
  quickAmountActive: { backgroundColor: COLORS.primary },
  quickAmountText: { fontSize: 12, color: COLORS.gray700 },
  quickAmountTextActive: { color: COLORS.white },
  descriptionContainer: { marginBottom: 24 },
  descriptionInput: {
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sendButton: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  sendButtonDisabled: { backgroundColor: COLORS.gray300 },
  sendButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalClose: { fontSize: 20, color: COLORS.gray500, padding: 8 },
  friendItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.gray200, gap: 12 },
  friendAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  friendAvatarText: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  friendName: { fontSize: 16, fontWeight: '500', marginBottom: 2 },
  friendEmail: { fontSize: 12, color: COLORS.gray500 },
  noFriendsText: { textAlign: 'center', color: COLORS.gray500, paddingVertical: 20 },
  confirmCard: { backgroundColor: COLORS.white, marginHorizontal: 20, marginTop: 20, borderRadius: 20, padding: 20, alignItems: 'center' },
  confirmIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.success, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  confirmIconText: { fontSize: 32, color: COLORS.white },
  confirmTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  confirmDetails: { width: '100%', marginBottom: 24 },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  confirmLabel: { fontSize: 14, color: COLORS.gray600 },
  confirmValue: { fontSize: 14, fontWeight: '500', color: COLORS.gray900 },
  amountValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  confirmDivider: { height: 1, backgroundColor: COLORS.gray200, marginVertical: 8 },
  confirmActions: { flexDirection: 'row', gap: 12, width: '100%' },
  confirmButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelButton: { backgroundColor: COLORS.gray100 },
  cancelButtonText: { color: COLORS.gray700, fontWeight: '600' },
  confirmButtonActive: { backgroundColor: COLORS.primary },
  confirmButtonText: { color: COLORS.white, fontWeight: 'bold' },
});