// app/(admin)/friends.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { FriendService } from '../../src/services/FriendService';
import { COLORS, getInitials, getAvatarColor } from '../../src/config/colors';
import { SafeScreen } from '../../src/components/SafeScreen';
import { useTranslation } from '../../src/services/TranslationService';
import { useAuth } from '../../src/context/AuthContext';

interface Friend {
  id: string;
  userId: string;
  friendId: string;
  status: string;
  friend?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isOnline?: boolean;
  };
}

interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface SearchUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isFriend: boolean;
  hasPendingRequest: boolean;
  hasIncomingRequest?: boolean;
  requestId?: string;
  isBlocked?: boolean;
}

export default function AdminFriendsScreen() {
  const { colors } = useTheme();
  const { showSuccess, showError } = useNotification();
  const { t } = useTranslation();
  const { getCurrentUser } = useAuth();
  const navigation = useNavigation();
  const user = getCurrentUser();
  const isSuperAdmin = user?.role === 'super_admin';

  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [suggestions, setSuggestions] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [f, r, s] = await Promise.all([
        FriendService.getFriends(),
        FriendService.getFriendRequests(),
        FriendService.getSuggestions(),
      ]);
      setFriends(f || []);
      setRequests(r || []);
      setSuggestions(s || []);
    } catch (error) {
      showError(t('error_loading'));
    } finally {
      setLoading(false);
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

  const searchUsers = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await FriendService.searchUsers(query);
      setSearchResults(results || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const sendRequest = async (userId: string) => {
    try {
      const cleanId = String(userId).replace(/[{}"'\s]/g, '').trim();
      
      if (!/^[0-9a-fA-F]{24}$/.test(cleanId)) {
        showError('ID utilisateur invalide');
        return;
      }
      
      await FriendService.sendFriendRequest(cleanId);
      showSuccess(t('send_request'));
      loadData();
      setSearchResults((prev: SearchUser[]) => prev.filter((u: SearchUser) => u.id !== userId));
    } catch (error) {
      showError(t('error'));
    }
  };

  const acceptRequest = async (requestId: string) => {
    try {
      await FriendService.acceptFriendRequest(requestId);
      showSuccess(t('accept'));
      loadData();
    } catch {
      showError(t('error'));
    }
  };

  const declineRequest = async (requestId: string) => {
    try {
      await FriendService.declineFriendRequest(requestId);
      setRequests((prev: FriendRequest[]) => prev.filter((r: FriendRequest) => r.id !== requestId));
    } catch {
      showError(t('error'));
    }
  };

  const removeFriend = (friendId: string, name: string) => {
    Alert.alert(
      t('remove'),
      `${t('confirm_delete')} ${name} ?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              await FriendService.removeFriend(friendId);
              showSuccess(t('success'));
              loadData();
            } catch {
              showError(t('error'));
            }
          },
        },
      ]
    );
  };

  const chatWithFriend = (friendId: string) => {
    navigation.navigate('AdminChat' as never);
  };

  const onlineFriends = friends.filter((f: Friend) => f.friend?.isOnline === true);

  const renderFriend = ({ item }: { item: Friend }) => {
    const friend = item.friend || { firstName: '', lastName: '', id: '' };
    return (
      <TouchableOpacity
        key={item.id}
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
            {friend.isOnline ? t('online') : t('offline')}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.friendAction}
          onPress={() => removeFriend(item.id, friend.firstName)}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderRequest = ({ item }: { item: FriendRequest }) => {
    const sender = item.sender || { firstName: '', lastName: '', email: '' };
    return (
      <View key={item.id} style={[styles.requestItem, { backgroundColor: colors.card }]}>
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
          <TouchableOpacity style={styles.acceptBtn} onPress={() => acceptRequest(item.id)}>
            <Ionicons name="checkmark" size={18} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.declineBtn} onPress={() => declineRequest(item.id)}>
            <Ionicons name="close" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeScreen backgroundColor={colors.background}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 12, color: colors.textSecondary }}>{t('loading')}</Text>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen backgroundColor={colors.background}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('friends')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.container}>
        <View style={[styles.searchBox, { backgroundColor: colors.card }]}>
          <Ionicons name="search" size={20} color={COLORS.gray400} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('search_friends')}
            placeholderTextColor={COLORS.gray400}
            value={searchQuery}
            onChangeText={searchUsers}
          />
          {searching && <ActivityIndicator size="small" color={COLORS.primary} />}
        </View>

        {onlineFriends.length > 0 && (
          <View style={styles.onlineSection}>
            <Text style={[styles.onlineTitle, { color: colors.text }]}>
              {t('online')} ({onlineFriends.length})
            </Text>
            <FlatList
              horizontal
              data={onlineFriends}
              keyExtractor={(item: Friend) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.onlineItem}
                  onPress={() => chatWithFriend(item.friend?.id || '')}
                >
                  <View style={[styles.onlineAvatar, { backgroundColor: getAvatarColor(item.friend?.firstName || '') }]}>
                    <Text style={styles.onlineAvatarText}>
                      {getInitials(item.friend?.firstName, item.friend?.lastName)}
                    </Text>
                    <View style={styles.onlineDot} />
                  </View>
                  <Text style={[styles.onlineName, { color: colors.text }]} numberOfLines={1}>
                    {item.friend?.firstName}
                  </Text>
                </TouchableOpacity>
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.onlineList}
            />
          </View>
        )}

        {searchResults.length > 0 && searchQuery.length >= 2 && (
          <View style={[styles.resultsCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.resultsTitle, { color: colors.text }]}>Résultats</Text>
            {searchResults.map((user: SearchUser) => (
              <View key={user.id} style={styles.resultItem}>
                <View style={[styles.resultAvatar, { backgroundColor: getAvatarColor(user.firstName || '') }]}>
                  <Text style={styles.resultAvatarText}>
                    {getInitials(user.firstName, user.lastName)}
                  </Text>
                </View>
                <View style={styles.resultInfo}>
                  <Text style={[styles.resultName, { color: colors.text }]}>
                    {user.firstName} {user.lastName}
                  </Text>
                  <Text style={[styles.resultEmail, { color: colors.textSecondary }]}>
                    {user.email}
                  </Text>
                </View>
                {user.isFriend ? (
                  <View style={styles.friendTag}>
                    <Text style={styles.friendTagText}>Ami</Text>
                  </View>
                ) : user.hasPendingRequest ? (
                  <View style={styles.pendingTag}>
                    <Text style={styles.pendingTagText}>En attente</Text>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.addBtn} onPress={() => sendRequest(user.id)}>
                    <Ionicons name="person-add" size={18} color={COLORS.white} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {requests.length > 0 && (
          <View style={[styles.requestsCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.requestsTitle, { color: colors.text }]}>
              {t('friend_requests')} ({requests.length})
            </Text>
            <FlatList
              data={requests}
              keyExtractor={(item: FriendRequest) => item.id}
              renderItem={renderRequest}
              scrollEnabled={false}
            />
          </View>
        )}

        <View style={[styles.friendsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.friendsTitle, { color: colors.text }]}>
            {t('my_friends')} ({friends.length})
          </Text>
          <FlatList
            data={friends}
            keyExtractor={(item: Friend) => item.id}
            renderItem={renderFriend}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
            }
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color={COLORS.gray400} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {t('no_friends')}
                </Text>
              </View>
            }
          />
        </View>

        <View style={[styles.adminInfoCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.adminInfoText, { color: colors.textSecondary }]}>
            <Ionicons name="shield-checkmark" size={16} color={COLORS.primary} /> 
            {isSuperAdmin ? 'Super Administrateur' : 'Administrateur'} - {t('friends')}
          </Text>
        </View>
      </View>
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
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white, flex: 1, marginLeft: 8 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, marginLeft: 8 },
  onlineSection: { paddingHorizontal: 12, marginBottom: 12 },
  onlineTitle: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  onlineList: { paddingBottom: 4 },
  onlineItem: { alignItems: 'center', marginRight: 12, width: 56 },
  onlineAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  onlineAvatarText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },
  onlineDot: {
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
  onlineName: { fontSize: 11, marginTop: 4, textAlign: 'center' },
  resultsCard: { margin: 12, padding: 12, borderRadius: 16 },
  resultsTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray200,
  },
  resultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  resultAvatarText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 14, fontWeight: '500' },
  resultEmail: { fontSize: 12 },
  friendTag: { backgroundColor: COLORS.successLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  friendTagText: { color: COLORS.success, fontSize: 11, fontWeight: '600' },
  pendingTag: { backgroundColor: COLORS.warningLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  pendingTagText: { color: COLORS.warning, fontSize: 11, fontWeight: '600' },
  addBtn: {
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestsCard: { margin: 12, padding: 12, borderRadius: 16 },
  requestsTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    marginBottom: 6,
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
  requestEmail: { fontSize: 12 },
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
  friendsCard: { margin: 12, padding: 12, borderRadius: 16 },
  friendsTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    marginBottom: 4,
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    position: 'relative',
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
  friendAction: { padding: 8 },
  emptyContainer: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { fontSize: 14, marginTop: 8 },
  adminInfoCard: { margin: 12, padding: 12, borderRadius: 12, alignItems: 'center' },
  adminInfoText: { fontSize: 12 },
});