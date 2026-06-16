import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
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
  const [tab, setTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [f, r, s] = await Promise.all([
        FriendService.getFriends(),
        FriendService.getFriendRequests(),
        FriendService.getSuggestions(),
      ]);
      setFriends(f || []);
      setRequests(r || []);
      setSuggestions(s || []);
    } catch (e) {
      showError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

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
      } catch {}
      setSearching(false);
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const sendRequest = async (id: string) => {
    try {
      await FriendService.sendFriendRequest(id);
      showSuccess('Demande envoyée');
      load();
      setSearchResults((prev) => prev.filter((u) => u.id !== id));
      setSuggestions((prev) => prev.filter((u) => u.id !== id));
    } catch (e: any) {
      showError(e?.response?.data?.message || 'Erreur');
    }
  };

  const accept = async (id: string) => {
    try {
      await FriendService.acceptFriendRequest(id);
      showSuccess('Demande acceptée');
      load();
    } catch {}
  };

  const decline = async (id: string) => {
    try {
      await FriendService.declineFriendRequest(id);
      load();
    } catch {}
  };

  const renderUserCard = (user: any, action: React.ReactNode) => (
    <View style={[styles.userRow, { backgroundColor: colors.card }]} key={user.id}>
      <View style={[styles.avatar, { backgroundColor: getAvatarColor(user.firstName) }]}>
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Mes amis</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.card }]}>
        <Ionicons name="search" size={18} color={COLORS.gray400} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Rechercher par nom, email..."
          placeholderTextColor={COLORS.gray400}
          value={searchQuery}
          onChangeText={(v) => {
            setSearchQuery(v);
            setTab(v.length >= 2 ? 'search' : 'friends');
          }}
        />
        {searching && <ActivityIndicator size="small" color={COLORS.primary} />}
      </View>

      {tab !== 'search' && (
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'friends' && styles.tabBtnActive]}
            onPress={() => setTab('friends')}
          >
            <Text style={[styles.tabText, tab === 'friends' && styles.tabTextActive]}>
              Amis ({friends.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'requests' && styles.tabBtnActive]}
            onPress={() => setTab('requests')}
          >
            <Text style={[styles.tabText, tab === 'requests' && styles.tabTextActive]}>
              Demandes ({requests.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : tab === 'search' ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
          renderItem={({ item }) =>
            renderUserCard(
              item,
              item.isFriend ? (
                <View style={styles.badgeGreen}>
                  <Text style={styles.badgeText}>Ami</Text>
                </View>
              ) : item.hasPendingRequest ? (
                <View style={styles.badgeGray}>
                  <Text style={styles.badgeTextGray}>Envoyée</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.addBtn} onPress={() => sendRequest(item.id)}>
                  <Ionicons name="person-add" size={16} color={COLORS.white} />
                </TouchableOpacity>
              )
            )
          }
          ListEmptyComponent={
            !searching ? <Text style={styles.empty}>Aucun résultat</Text> : null
          }
        />
      ) : tab === 'requests' ? (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
          renderItem={({ item }) =>
            renderUserCard(
              item.sender || {},
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={styles.acceptBtn} onPress={() => accept(item.id)}>
                  <Ionicons name="checkmark" size={18} color={COLORS.white} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.declineBtn} onPress={() => decline(item.id)}>
                  <Ionicons name="close" size={18} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            )
          }
          ListEmptyComponent={<Text style={styles.empty}>Aucune demande en attente</Text>}
        />
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
          renderItem={({ item }) => {
            const f = item.friend || {};
            return (
              <TouchableOpacity
                onPress={() =>
                  router.push({ pathname: '/(user)/chat', params: { userId: f.id } })
                }
              >
                {renderUserCard(
                  f,
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: f.isOnline ? COLORS.success : COLORS.gray300 },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          }}
          ListHeaderComponent={
            suggestions.length > 0 ? (
              <View style={{ marginBottom: 16 }}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Suggestions
                </Text>
                {suggestions.slice(0, 5).map((u) =>
                  renderUserCard(
                    u,
                    <TouchableOpacity style={styles.addBtn} onPress={() => sendRequest(u.id)}>
                      <Ionicons name="person-add" size={16} color={COLORS.white} />
                    </TouchableOpacity>
                  )
                )}
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colors.text, marginTop: 16 },
                  ]}
                >
                  Mes amis
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={<Text style={styles.empty}>Aucun ami pour le moment</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 60 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15 },
  tabs: { flexDirection: 'row', gap: 8, marginTop: 12 },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.gray100,
  },
  tabBtnActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '500', color: COLORS.gray600 },
  tabTextActive: { color: COLORS.white },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLORS.white, fontWeight: 'bold' },
  userName: { fontSize: 15, fontWeight: '600' },
  userEmail: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeGreen: {
    backgroundColor: COLORS.successLight,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeGray: {
    backgroundColor: COLORS.gray100,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeText: { color: COLORS.success, fontSize: 12, fontWeight: '600' },
  badgeTextGray: { color: COLORS.gray500, fontSize: 12, fontWeight: '600' },
  empty: { textAlign: 'center', color: COLORS.gray400, marginTop: 40 },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
});