import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ScrollView } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { FriendService } from '../../src/services/FriendService';
import { COLORS, getInitials } from '../../src/config';
import { router } from 'expo-router';

export default function FriendsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [friendsData, requestsData, suggestionsData] = await Promise.all([
        FriendService.getFriends(),
        FriendService.getFriendRequests(),
        FriendService.getSuggestions(),
      ]);
      setFriends(friendsData.filter(f => f.status === 'accepted'));
      setRequests(requestsData);
      setSuggestions(suggestionsData);
    } catch (error) { showError('Erreur chargement'); } finally { setLoading(false); }
  };

  const searchUsers = async () => {
    if (searchQuery.length < 2) return;
    try {
      const res = await FriendService.searchUsers(searchQuery);
      setSearchResults(res);
    } catch (error) { showError('Erreur recherche'); }
  };

  const sendRequest = async (userId: string) => {
    try {
      await FriendService.sendFriendRequest(userId);
      showSuccess('Demande envoyée');
      setShowAddModal(false);
      setSearchQuery('');
      setSearchResults([]);
      loadData();
    } catch (error: any) { showError(error.response?.data?.message || 'Erreur'); }
  };

  const acceptRequest = async (requestId: string) => {
    try { await FriendService.acceptFriendRequest(requestId); showSuccess('Ami ajouté'); loadData(); } catch (error) { showError('Erreur'); }
  };

  const declineRequest = async (requestId: string) => {
    try { await FriendService.declineFriendRequest(requestId); loadData(); } catch (error) { showError('Erreur'); }
  };

  const removeFriend = async (friendId: string) => {
    try { await FriendService.removeFriend(friendId); showSuccess('Ami supprimé'); loadData(); } catch (error) { showError('Erreur'); }
  };

  const chatWith = (friendId: string) => router.push({ pathname: '/(user)/chat', params: { friendId } });

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Chargement...</Text></View>;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Text style={styles.backText}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Amis</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}><Text style={styles.addButton}>+</Text></TouchableOpacity>
      </View>

      {requests.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Demandes reçues ({requests.length})</Text>
          {requests.map(req => (
            <View key={req.id} style={[styles.requestCard, { backgroundColor: colors.card }]}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(req.sender.firstName, req.sender.lastName)}</Text></View>
              <View style={{ flex: 1 }}><Text style={{ fontWeight: 'bold' }}>{req.sender.firstName} {req.sender.lastName}</Text><Text>{req.sender.email}</Text></View>
              <TouchableOpacity style={styles.acceptBtn} onPress={() => acceptRequest(req.id)}><Text style={{ color: COLORS.white }}>✓</Text></TouchableOpacity>
              <TouchableOpacity style={styles.declineBtn} onPress={() => declineRequest(req.id)}><Text style={{ color: COLORS.white }}>✗</Text></TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Mes amis ({friends.length})</Text>
        <FlatList
          data={friends}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={[styles.friendCard, { backgroundColor: colors.card }]}>
              <TouchableOpacity style={styles.friendInfo} onPress={() => chatWith(item.friend.id)}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(item.friend.firstName, item.friend.lastName)}</Text></View>
                <View><Text style={{ fontWeight: 'bold' }}>{item.friend.firstName} {item.friend.lastName}</Text><Text>{item.friend.email}</Text></View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeFriend(item.id)}><Text style={{ fontSize: 20, color: COLORS.error }}>🗑️</Text></TouchableOpacity>
            </View>
          )}
        />
      </View>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Ajouter un ami</Text>
            <TextInput style={[styles.searchInput, { borderColor: colors.border, color: colors.text }]} placeholder="Email ou téléphone" value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={searchUsers} />
            {searchResults.length > 0 && searchResults.map(user => (
              <View key={user.id} style={styles.resultItem}>
                <Text>{user.firstName} {user.lastName} ({user.email})</Text>
                <TouchableOpacity onPress={() => sendRequest(user.id)}><Text style={{ color: COLORS.primary }}>Ajouter</Text></TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity onPress={() => setShowAddModal(false)} style={{ marginTop: 20, alignSelf: 'center' }}><Text style={{ color: COLORS.error }}>Fermer</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  backButton: { padding: 8 }, backText: { fontSize: 24, color: COLORS.white },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  addButton: { fontSize: 28, color: COLORS.white, paddingHorizontal: 12 },
  section: { marginHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  requestCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8, gap: 12 },
  friendCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, marginBottom: 8 },
  friendInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  acceptBtn: { backgroundColor: COLORS.success, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  declineBtn: { backgroundColor: COLORS.error, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' },
  modalContent: { marginHorizontal: 20, borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  searchInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16 },
  resultItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 },
});