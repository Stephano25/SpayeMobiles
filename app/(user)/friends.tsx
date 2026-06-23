import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { FriendService } from '../../src/services/FriendService';
import { COLORS, getInitials, getAvatarColor } from '../../src/config';

type Tab = 'friends' | 'requests' | 'search';

export default function FriendsScreen() {
  const { colors } = useTheme();
  const { showSuccess, showError } = useNotification();
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFriendsList, setShowFriendsList] = useState(true);
  const [showRequestsList, setShowRequestsList] = useState(true);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);

  const load = useCallback(async () => {
    try {
      const [f, r, s, b] = await Promise.all([
        FriendService.getFriends(),
        FriendService.getFriendRequests(),
        FriendService.getSuggestions(),
        FriendService.getBlockedUsers(),
      ]);
      setFriends(f || []);
      setRequests(r || []);
      setSuggestions(s || []);
      setBlockedUsers(b || []);
    } catch (e) {
      showError('Erreur de chargement');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showError]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await FriendService.searchUsers(searchQuery);
        setSearchResults(res || []);
      } catch {
        setSearchResults([]);
      }
      setSearching(false);
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
  };

  const sendRequest = async (id: string) => {
    try {
      await FriendService.sendFriendRequest(id);
      showSuccess('Demande envoyée');
      load();
      setSearchResults((prevResults) => prevResults.filter((u) => u.id !== id));
      setSuggestions((prevSuggestions) => prevSuggestions.filter((u) => u.id !== id));
    } catch (e: any) {
      showError(e?.response?.data?.message || 'Erreur');
    }
  };

  const accept = async (id: string) => {
    try {
      await FriendService.acceptFriendRequest(id);
      showSuccess('Demande acceptée');
      load();
    } catch {
      showError('Erreur lors de l\'acceptation');
    }
  };

  const decline = async (id: string) => {
    try {
      await FriendService.declineFriendRequest(id);
      setRequests((prevRequests) => prevRequests.filter((r) => r.id !== id));
    } catch {
      showError('Erreur lors du refus');
    }
  };

  const removeFriend = (friendId: string, name: string) => {
    Alert.alert(
      'Supprimer',
      `Voulez-vous vraiment supprimer ${name} de vos amis ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await FriendService.removeFriend(friendId);
              showSuccess('Ami supprimé');
              load();
            } catch {
              showError('Erreur lors de la suppression');
            }
          },
        },
      ]
    );
  };

  const blockUser = (userId: string, name: string) => {
    Alert.alert(
      'Bloquer',
      `Voulez-vous vraiment bloquer ${name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Bloquer',
          style: 'destructive',
          onPress: async () => {
            try {
              await FriendService.blockUser(userId);
              showSuccess('Utilisateur bloqué');
              load();
            } catch {
              showError('Erreur lors du blocage');
            }
          },
        },
      ]
    );
  };

  const unblockUser = async (userId: string, name: string) => {
    Alert.alert(
      'Débloquer',
      `Voulez-vous vraiment débloquer ${name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Débloquer',
          onPress: async () => {
            try {
              await FriendService.unblockUser(userId);
              showSuccess('Utilisateur débloqué');
              load();
            } catch {
              showError('Erreur lors du déblocage');
            }
          },
        },
      ]
    );
  };

  const chatWithFriend = (friendId: string) => {
    router.push({
      pathname: '/(user)/chat',
      params: { userId: friendId },
    });
  };

  const onlineFriends = friends.filter(f => f.friend?.isOnline === true);

  const renderUserCard = (user: any, action: React.ReactNode) => (
    <View style={[styles.userRow, { backgroundColor: colors.card }]} key={user.id}>
      <View style={[styles.avatar, { backgroundColor: getAvatarColor(user.firstName || '') }]}>
        <Text style={styles.avatarText}>
          {getInitials(user.firstName, user.lastName)}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.userName, { color: colors.text }]}>
          {user.firstName} {user.lastName}
        </Text>
        <Text style={styles.userEmail}>{user.email}</Text>
      </View>
      {action}
    </View>
  );

  // 🔥 CORRECTION: Utilisation de onlineFriendDot au lieu de onlineLiveDot
  const renderOnlineFriend = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.onlineFriendItem}
      onPress={() => chatWithFriend(item.friend.id)}
    >
      <View style={[styles.onlineAvatar, { backgroundColor: getAvatarColor(item.friend.firstName) }]}>
        <Text style={styles.onlineAvatarText}>
          {getInitials(item.friend.firstName, item.friend.lastName)}
        </Text>
        <View style={styles.onlineFriendDot} />
      </View>
      <Text style={styles.onlineFriendNameText} numberOfLines={1}>
        {item.friend.firstName}
      </Text>
    </TouchableOpacity>
  );

  const renderFriendItem = ({ item }: { item: any }) => {
    const friend = item.friend || {};
    return (
      <TouchableOpacity
        style={[styles.friendItem, { backgroundColor: colors.card }]}
        onPress={() => chatWithFriend(friend.id)}
      >
        <View style={[styles.friendAvatar, { backgroundColor: getAvatarColor(friend.firstName || '') }]}>
          <Text style={styles.friendAvatarText}>
            {getInitials(friend.firstName, friend.lastName)}
          </Text>
          <View style={[styles.friendOnlineDot, friend.isOnline && styles.friendOnlineDotActive]} />
        </View>
        <View style={styles.friendInfo}>
          <Text style={[styles.friendName, { color: colors.text }]}>
            {friend.firstName} {friend.lastName}
          </Text>
          <Text style={[styles.friendStatus, { color: friend.isOnline ? COLORS.success : COLORS.gray400 }]}>
            {friend.isOnline ? '🟢 En ligne' : 'Hors ligne'}
          </Text>
        </View>
        <View style={styles.friendActions}>
          <TouchableOpacity
            style={styles.friendActionBtn}
            onPress={() => {
              router.push({
                pathname: '/(user)/send-money',
                params: { receiverId: friend.id, receiverName: `${friend.firstName} ${friend.lastName}` },
              });
            }}
          >
            <Ionicons name="cash-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.friendActionBtn}
            onPress={() => {
              Alert.alert(
                'Actions',
                `Que voulez-vous faire avec ${friend.firstName} ?`,
                [
                  { text: 'Annuler', style: 'cancel' },
                  { text: 'Voir le profil', onPress: () => {} },
                  { text: 'Supprimer', onPress: () => removeFriend(item.id, friend.firstName), style: 'destructive' },
                  { text: 'Bloquer', onPress: () => blockUser(friend.id, friend.firstName), style: 'destructive' },
                ]
              );
            }}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={COLORS.gray400} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 12, color: colors.textSecondary }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Amis</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerAction} onPress={() => setShowAddFriend(!showAddFriend)}>
            <Ionicons name="person-add-outline" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction} onPress={() => setShowBlockedUsers(!showBlockedUsers)}>
            <Ionicons name="ban-outline" size={22} color={COLORS.white} />
            {blockedUsers.length > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{blockedUsers.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Search Box */}
        <View style={[styles.searchBox, { backgroundColor: colors.card }]}>
          <Ionicons name="search" size={18} color={COLORS.gray400} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Rechercher par nom, email..."
            placeholderTextColor={COLORS.gray400}
            value={searchQuery}
            onChangeText={(v) => {
              setSearchQuery(v);
            }}
          />
          {searching && <ActivityIndicator size="small" color={COLORS.primary} />}
        </View>

        {/* Add Friend Section */}
        {showAddFriend && (
          <View style={[styles.addFriendCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.addFriendTitle, { color: colors.text }]}>
              <Ionicons name="person-add" size={16} color={COLORS.primary} /> Ajouter un ami
            </Text>

            {searchResults.length > 0 && !searching && (
              <View style={styles.searchResults}>
                <Text style={[styles.resultTitle, { color: colors.textSecondary }]}>Résultats</Text>
                {searchResults.map((user) =>
                  renderUserCard(
                    user,
                    user.isBlocked ? (
                      <View style={styles.badgeGray}><Text style={styles.badgeTextGray}>Bloqué</Text></View>
                    ) : user.isFriend ? (
                      <View style={styles.badgeGreen}><Text style={styles.badgeText}>Ami</Text></View>
                    ) : user.hasPendingRequest ? (
                      <View style={styles.badgeGray}><Text style={styles.badgeTextGray}>Envoyée</Text></View>
                    ) : (
                      <TouchableOpacity style={styles.addBtn} onPress={() => sendRequest(user.id)}>
                        <Ionicons name="person-add" size={16} color={COLORS.white} />
                      </TouchableOpacity>
                    )
                  )
                )}
              </View>
            )}

            {suggestions.length > 0 && !searchQuery && (
              <View style={styles.suggestions}>
                <Text style={[styles.resultTitle, { color: colors.textSecondary }]}>Suggestions</Text>
                {suggestions.slice(0, 5).map((user) =>
                  renderUserCard(
                    user,
                    user.hasPendingRequest ? (
                      <View style={styles.badgeGray}><Text style={styles.badgeTextGray}>Envoyée</Text></View>
                    ) : (
                      <TouchableOpacity style={styles.addBtn} onPress={() => sendRequest(user.id)}>
                        <Ionicons name="person-add" size={16} color={COLORS.white} />
                      </TouchableOpacity>
                    )
                  )
                )}
              </View>
            )}

            {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
              <Text style={styles.noResult}>Aucun résultat</Text>
            )}
          </View>
        )}

        {/* Blocked Users */}
        {showBlockedUsers && (
          <View style={[styles.blockedCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.blockedTitle, { color: colors.text }]}>
              <Ionicons name="ban" size={16} color={COLORS.error} /> Utilisateurs bloqués
            </Text>
            {blockedUsers.length === 0 ? (
              <Text style={[styles.blockedEmpty, { color: colors.textSecondary }]}>Aucun utilisateur bloqué</Text>
            ) : (
              blockedUsers.map((blocked) => {
                const friend = blocked.friend || {};
                return (
                  <View key={blocked.id} style={styles.blockedItem}>
                    <View style={[styles.blockedAvatar, { backgroundColor: getAvatarColor(friend.firstName || '') }]}>
                      <Text style={styles.blockedAvatarText}>
                        {getInitials(friend.firstName, friend.lastName)}
                      </Text>
                    </View>
                    <View style={styles.blockedInfo}>
                      <Text style={[styles.blockedName, { color: colors.text }]}>
                        {friend.firstName} {friend.lastName}
                      </Text>
                      <Text style={[styles.blockedEmail, { color: colors.textSecondary }]}>
                        {friend.email}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.unblockBtn}
                      onPress={() => unblockUser(friend.id, friend.firstName)}
                    >
                      <Text style={styles.unblockBtnText}>Débloquer</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Online Friends */}
        {onlineFriends.length > 0 && (
          <View style={styles.onlineSection}>
            <View style={styles.onlineHeader}>
              <View style={styles.onlineLiveDot} />
              <Text style={[styles.onlineTitle, { color: colors.text }]}>
                En ligne ({onlineFriends.length})
              </Text>
            </View>
            <FlatList
              horizontal
              data={onlineFriends}
              keyExtractor={(item) => item.id}
              renderItem={renderOnlineFriend}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.onlineList}
            />
          </View>
        )}

        {/* Friends List */}
        <View style={[styles.friendsCard, { backgroundColor: colors.card }]}>
          <TouchableOpacity style={styles.friendsHeader} onPress={() => setShowFriendsList(!showFriendsList)}>
            <Ionicons name="people" size={20} color={COLORS.primary} />
            <Text style={[styles.friendsTitle, { color: colors.text }]}>
              Mes amis ({friends.length})
            </Text>
            <Ionicons
              name={showFriendsList ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={COLORS.gray400}
            />
          </TouchableOpacity>

          {showFriendsList && (
            <View style={styles.friendsList}>
              {friends.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={48} color={COLORS.gray400} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Aucun ami</Text>
                  <TouchableOpacity
                    style={styles.emptyBtn}
                    onPress={() => setShowAddFriend(true)}
                  >
                    <Text style={styles.emptyBtnText}>Ajouter des amis</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                friends.map((friend) => renderFriendItem({ item: friend }))
              )}
            </View>
          )}
        </View>

        {/* Friend Requests */}
        {requests.length > 0 && (
          <View style={[styles.requestsCard, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={styles.requestsHeader}
              onPress={() => setShowRequestsList(!showRequestsList)}
            >
              <Ionicons name="notifications" size={20} color={COLORS.warning} />
              <Text style={[styles.requestsTitle, { color: colors.text }]}>
                Demandes reçues ({requests.length})
              </Text>
              <Ionicons
                name={showRequestsList ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={COLORS.gray400}
              />
            </TouchableOpacity>

            {showRequestsList && (
              <View style={styles.requestsList}>
                {requests.map((request) => {
                  const sender = request.sender || {};
                  return (
                    <View key={request.id} style={styles.requestItem}>
                      <View style={[styles.requestAvatar, { backgroundColor: getAvatarColor(sender.firstName || '') }]}>
                        <Text style={styles.requestAvatarText}>
                          {getInitials(sender.firstName, sender.lastName)}
                        </Text>
                      </View>
                      <View style={styles.requestInfo}>
                        <Text style={[styles.requestName, { color: colors.text }]}>
                          {sender.firstName} {sender.lastName}
                        </Text>
                        <Text style={[styles.requestEmail, { color: colors.textSecondary }]}>
                          {sender.email}
                        </Text>
                      </View>
                      <View style={styles.requestActions}>
                        <TouchableOpacity style={styles.acceptBtn} onPress={() => accept(request.id)}>
                          <Ionicons name="checkmark" size={18} color={COLORS.white} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.declineBtn} onPress={() => decline(request.id)}>
                          <Ionicons name="close" size={18} color={COLORS.white} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  headerActions: { flexDirection: 'row', gap: 12 },
  headerAction: { padding: 4, position: 'relative' },
  headerBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  headerBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: 'bold' },

  content: { flex: 1, padding: 12 },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15 },

  addFriendCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  addFriendTitle: { fontSize: 15, fontWeight: '600', marginBottom: 12 },
  searchResults: { marginTop: 8 },
  resultTitle: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  suggestions: { marginTop: 12 },
  noResult: { textAlign: 'center', color: COLORS.gray400, marginTop: 12 },

  blockedCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  blockedTitle: { fontSize: 15, fontWeight: '600', marginBottom: 12 },
  blockedEmpty: { textAlign: 'center', paddingVertical: 12 },
  blockedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray100,
  },
  blockedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  blockedAvatarText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },
  blockedInfo: { flex: 1 },
  blockedName: { fontSize: 14, fontWeight: '500' },
  blockedEmail: { fontSize: 12, marginTop: 2 },
  unblockBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  unblockBtnText: { color: COLORS.white, fontSize: 12, fontWeight: '500' },

  // 🔥 SECTION ONLINE FRIENDS - CORRIGÉE
  onlineSection: {
    backgroundColor: COLORS.successLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  onlineHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  onlineLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  onlineTitle: { fontSize: 13, fontWeight: '600' },
  onlineList: { paddingBottom: 4 },
  onlineFriendItem: { alignItems: 'center', marginRight: 12, width: 56 },
  onlineAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  onlineAvatarText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },
  // 🔥 Correction: utiliser onlineFriendDot
  onlineFriendDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  onlineFriendNameText: { fontSize: 11, marginTop: 4, textAlign: 'center' },

  friendsCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  friendsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  friendsTitle: { flex: 1, fontSize: 15, fontWeight: '600' },
  friendsList: { marginTop: 8 },

  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray100,
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginRight: 10,
  },
  friendAvatarText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },
  friendOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.gray300,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  friendOnlineDotActive: { backgroundColor: COLORS.success },
  friendInfo: { flex: 1 },
  friendName: { fontSize: 14, fontWeight: '500' },
  friendStatus: { fontSize: 12, marginTop: 2 },
  friendActions: { flexDirection: 'row', gap: 4 },
  friendActionBtn: { padding: 6 },

  requestsCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  requestsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requestsTitle: { flex: 1, fontSize: 15, fontWeight: '600' },
  requestsList: { marginTop: 8 },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray100,
  },
  requestAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  requestAvatarText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },
  requestInfo: { flex: 1 },
  requestName: { fontSize: 14, fontWeight: '500' },
  requestEmail: { fontSize: 12, marginTop: 2 },
  requestActions: { flexDirection: 'row', gap: 6 },
  acceptBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },
  userName: { fontSize: 14, fontWeight: '500' },
  userEmail: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },

  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  badgeGreen: {
    backgroundColor: COLORS.successLight,
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  badgeGray: {
    backgroundColor: COLORS.gray100,
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  badgeText: { color: COLORS.success, fontSize: 11, fontWeight: '500' },
  badgeTextGray: { color: COLORS.gray500, fontSize: 11, fontWeight: '500' },

  emptyState: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { fontSize: 15, marginTop: 8 },
  emptyBtn: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
  },
  emptyBtnText: { color: COLORS.white, fontWeight: '500', fontSize: 13 },
});