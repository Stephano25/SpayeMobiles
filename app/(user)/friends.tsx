import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Modal,
  Image,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { FriendService } from '../../src/services/FriendService';
import { COLORS, getInitials, getAvatarColor } from '../../src/config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from '../../src/services/TranslationService';

type Tab = 'friends' | 'requests' | 'search';

export default function FriendsScreen() {
  const { colors } = useTheme();
  const { showSuccess, showError } = useNotification();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
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

  // États pour QR Code
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [showQRScannerModal, setShowQRScannerModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const qrCodeRef = useRef<any>(null);

  // Charger les amis
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
      showError(t('error_loading'));
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

  // Recherche
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

  // Actions des amis
  const sendRequest = async (id: string) => {
    try {
      await FriendService.sendFriendRequest(id);
      showSuccess(t('send_request'));
      load();
      setSearchResults((prevResults) => prevResults.filter((u) => u.id !== id));
      setSuggestions((prevSuggestions) => prevSuggestions.filter((u) => u.id !== id));
    } catch (e: any) {
      showError(e?.response?.data?.message || t('error'));
    }
  };

  const accept = async (id: string) => {
    try {
      await FriendService.acceptFriendRequest(id);
      showSuccess(t('accept'));
      load();
    } catch {
      showError(t('error'));
    }
  };

  const decline = async (id: string) => {
    try {
      await FriendService.declineFriendRequest(id);
      setRequests((prevRequests) => prevRequests.filter((r) => r.id !== id));
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
              load();
            } catch {
              showError(t('error'));
            }
          },
        },
      ]
    );
  };

  const blockUser = (userId: string, name: string) => {
    Alert.alert(
      t('block'),
      `${t('confirm_delete')} ${name} ?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('block'),
          style: 'destructive',
          onPress: async () => {
            try {
              await FriendService.blockUser(userId);
              showSuccess(t('success'));
              load();
            } catch {
              showError(t('error'));
            }
          },
        },
      ]
    );
  };

  const unblockUser = async (userId: string, name: string) => {
    Alert.alert(
      t('unblock'),
      `${t('confirm_delete')} ${name} ?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('unblock'),
          onPress: async () => {
            try {
              await FriendService.unblockUser(userId);
              showSuccess(t('success'));
              load();
            } catch {
              showError(t('error'));
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

  // ============================================================
  // FONCTIONS QR CODE
  // ============================================================

  const generateMyQRCode = () => {
    try {
      const userData = {
        type: 'friend_request',
        userId: 'user-id-example',
        userName: 'Mon Profil',
        timestamp: Date.now(),
      };
      
      const jsonData = JSON.stringify(userData);
      setQrCodeData(jsonData);
      setShowQRCodeModal(true);
    } catch (error) {
      showError(t('error'));
    }
  };

  const shareQRCode = async () => {
    try {
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeData)}`;
      
      await Share.share({
        message: `Ajoutez-moi sur SPaye ! Scannez ce QR code :\n${qrImageUrl}\n\nOu utilisez mon ID : ${qrCodeData}`,
        title: t('my_qr_code'),
      });
    } catch (error) {
      showError(t('error'));
    }
  };

  const copyQRCode = async () => {
    try {
      await Clipboard.setStringAsync(qrCodeData);
      showSuccess(t('copy'));
    } catch (error) {
      showError(t('error'));
    }
  };

  const handleScanQRCode = async () => {
    const { status } = await requestCameraPermission();
    
    if (status === 'granted') {
      setHasPermission(true);
      setShowQRScannerModal(true);
      setIsScanning(true);
    } else {
      Alert.alert(
        t('scan_qr_code'),
        t('scan_hint'),
        [
          { text: t('cancel'), style: 'cancel' },
          { text: 'Autoriser', onPress: requestCameraPermission },
        ]
      );
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (isScanning) {
      setIsScanning(false);
      setScannedData(data);
      setShowQRScannerModal(false);
      
      try {
        const parsedData = JSON.parse(data);
        
        if (parsedData.type === 'friend_request' && parsedData.userId) {
          Alert.alert(
            t('add_friend'),
            `Voulez-vous ajouter ${parsedData.userName || 'cet utilisateur'} comme ami ?`,
            [
              { text: t('cancel'), style: 'cancel', onPress: () => setIsScanning(true) },
              {
                text: t('add_friend'),
                onPress: () => {
                  sendFriendRequestFromQR(parsedData.userId);
                },
              },
            ]
          );
        } else {
          Alert.alert(
            t('add_friend'),
            'Voulez-vous ajouter cet utilisateur comme ami ?',
            [
              { text: t('cancel'), style: 'cancel', onPress: () => setIsScanning(true) },
              {
                text: t('add_friend'),
                onPress: () => {
                  sendFriendRequestFromQR(data);
                },
              },
            ]
          );
        }
      } catch (error) {
        Alert.alert(
          t('add_friend'),
          'Voulez-vous ajouter cet utilisateur comme ami ?',
          [
            { text: t('cancel'), style: 'cancel', onPress: () => setIsScanning(true) },
            {
              text: t('add_friend'),
              onPress: () => {
                sendFriendRequestFromQR(data);
              },
            },
          ]
        );
      }
    }
  };

  const sendFriendRequestFromQR = async (userId: string) => {
    try {
      await FriendService.sendFriendRequest(userId);
      showSuccess(t('send_request'));
      load();
    } catch (error: any) {
      showError(error?.response?.data?.message || t('error'));
    }
  };

  const closeQRScanner = () => {
    setIsScanning(false);
    setShowQRScannerModal(false);
    setScannedData(null);
  };

  // ============================================================
  // RENDU
  // ============================================================

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
            {friend.isOnline ? t('online') : t('offline')}
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
                t('settings'),
                `${t('confirm')} ${friend.firstName} ?`,
                [
                  { text: t('cancel'), style: 'cancel' },
                  { text: t('profile'), onPress: () => {} },
                  { text: t('remove'), onPress: () => removeFriend(item.id, friend.firstName), style: 'destructive' },
                  { text: t('block'), onPress: () => blockUser(friend.id, friend.firstName), style: 'destructive' },
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
        <Text style={{ marginTop: 12, color: colors.textSecondary }}>{t('loading')}</Text>
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
        <Text style={styles.headerTitle}>{t('my_friends')}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerAction} onPress={generateMyQRCode}>
            <Ionicons name="qr-code" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction} onPress={handleScanQRCode}>
            <Ionicons name="scan" size={22} color={COLORS.white} />
          </TouchableOpacity>
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
        contentContainerStyle={{ 
          paddingBottom: insets.bottom > 0 ? insets.bottom + 20 : 30 
        }}
      >
        {/* Search Box */}
        <View style={[styles.searchBox, { backgroundColor: colors.card }]}>
          <Ionicons name="search" size={18} color={COLORS.gray400} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('search_friends')}
            placeholderTextColor={COLORS.gray400}
            value={searchQuery}
            onChangeText={(v) => {
              setSearchQuery(v);
            }}
          />
          {searching && <ActivityIndicator size="small" color={COLORS.primary} />}
        </View>

        {/* QR Code Actions */}
        <View style={[styles.qrActionsCard, { backgroundColor: colors.card }]}>
          <TouchableOpacity style={styles.qrActionBtn} onPress={generateMyQRCode}>
            <View style={[styles.qrActionIcon, { backgroundColor: COLORS.primary + '18' }]}>
              <Ionicons name="qr-code" size={24} color={COLORS.primary} />
            </View>
            <Text style={[styles.qrActionText, { color: colors.text }]}>{t('my_qr_code')}</Text>
            <Text style={[styles.qrActionSub, { color: colors.textSecondary }]}>{t('share_contact')}</Text>
          </TouchableOpacity>
          
          <View style={styles.qrDivider} />
          
          <TouchableOpacity style={styles.qrActionBtn} onPress={handleScanQRCode}>
            <View style={[styles.qrActionIcon, { backgroundColor: COLORS.success + '18' }]}>
              <Ionicons name="scan" size={24} color={COLORS.success} />
            </View>
            <Text style={[styles.qrActionText, { color: colors.text }]}>{t('scan_qr_code')}</Text>
            <Text style={[styles.qrActionSub, { color: colors.textSecondary }]}>{t('add_by_qr')}</Text>
          </TouchableOpacity>
        </View>

        {/* Add Friend Section */}
        {showAddFriend && (
          <View style={[styles.addFriendCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.addFriendTitle, { color: colors.text }]}>
              <Ionicons name="person-add" size={16} color={COLORS.primary} /> {t('add_friend')}
            </Text>

            {searchResults.length > 0 && !searching && (
              <View style={styles.searchResults}>
                <Text style={[styles.resultTitle, { color: colors.textSecondary }]}>{t('results')}</Text>
                {searchResults.map((user) =>
                  renderUserCard(
                    user,
                    user.isBlocked ? (
                      <View style={styles.badgeGray}><Text style={styles.badgeTextGray}>{t('block')}</Text></View>
                    ) : user.isFriend ? (
                      <View style={styles.badgeGreen}><Text style={styles.badgeText}>{t('friends')}</Text></View>
                    ) : user.hasPendingRequest ? (
                      <View style={styles.badgeGray}><Text style={styles.badgeTextGray}>{t('send_request')}</Text></View>
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
                <Text style={[styles.resultTitle, { color: colors.textSecondary }]}>{t('suggestions')}</Text>
                {suggestions.slice(0, 5).map((user) =>
                  renderUserCard(
                    user,
                    user.hasPendingRequest ? (
                      <View style={styles.badgeGray}><Text style={styles.badgeTextGray}>{t('send_request')}</Text></View>
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
              <Text style={styles.noResult}>{t('no_result')}</Text>
            )}
          </View>
        )}

        {/* Blocked Users */}
        {showBlockedUsers && (
          <View style={[styles.blockedCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.blockedTitle, { color: colors.text }]}>
              <Ionicons name="ban" size={16} color={COLORS.error} /> {t('blocked_users')}
            </Text>
            {blockedUsers.length === 0 ? (
              <Text style={[styles.blockedEmpty, { color: colors.textSecondary }]}>{t('no_result')}</Text>
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
                      <Text style={styles.unblockBtnText}>{t('unblock')}</Text>
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
                {t('online')} ({onlineFriends.length})
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
              {t('my_friends')} ({friends.length})
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
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('no_friends')}</Text>
                  <TouchableOpacity
                    style={styles.emptyBtn}
                    onPress={() => setShowAddFriend(true)}
                  >
                    <Text style={styles.emptyBtnText}>{t('add_friend')}</Text>
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
                {t('friend_requests')} ({requests.length})
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

      {/* MODAL QR CODE */}
      <Modal
        visible={showQRCodeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowQRCodeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('my_qr_code')}</Text>
              <TouchableOpacity onPress={() => setShowQRCodeModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.qrCodeContainer}>
              {qrCodeData ? (
                <Image
                  source={{ 
                    uri: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeData)}` 
                  }}
                  style={styles.qrCodeImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.qrCodePlaceholder}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
              )}
            </View>

            <Text style={[styles.qrCodeHint, { color: colors.textSecondary }]}>
              {t('scan_hint')}
            </Text>

            <View style={styles.qrModalActions}>
              <TouchableOpacity style={[styles.qrModalBtn, styles.qrModalBtnOutline]} onPress={copyQRCode}>
                <Ionicons name="copy-outline" size={20} color={COLORS.primary} />
                <Text style={[styles.qrModalBtnText, { color: COLORS.primary }]}>{t('copy')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.qrModalBtn, styles.qrModalBtnPrimary]} onPress={shareQRCode}>
                <Ionicons name="share-outline" size={20} color={COLORS.white} />
                <Text style={[styles.qrModalBtnText, { color: COLORS.white }]}>{t('share')}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.closeModalBtn} 
              onPress={() => setShowQRCodeModal(false)}
            >
              <Text style={styles.closeModalBtnText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL SCANNER QR CODE */}
      <Modal
        visible={showQRScannerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeQRScanner}
      >
        <View style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <TouchableOpacity onPress={closeQRScanner}>
              <Ionicons name="close" size={28} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>{t('scan_qr_code')}</Text>
            <View style={{ width: 28 }} />
          </View>

          <View style={styles.scannerWrapper}>
            {hasPermission ? (
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
                barcodeScannerSettings={{
                  barcodeTypes: ['qr'],
                }}
              />
            ) : (
              <View style={styles.scannerPermissionView}>
                <Ionicons name="camera-outline" size={64} color={COLORS.gray400} />
                <Text style={styles.scannerPermissionText}>
                  {t('scan_hint')}
                </Text>
                <TouchableOpacity 
                  style={styles.scannerPermissionBtn}
                  onPress={requestCameraPermission}
                >
                  <Text style={styles.scannerPermissionBtnText}>Autoriser</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {/* Cadre de scan */}
            <View style={styles.scanFrame}>
              <View style={[styles.scanCorner, styles.scanCornerTL]} />
              <View style={[styles.scanCorner, styles.scanCornerTR]} />
              <View style={[styles.scanCorner, styles.scanCornerBL]} />
              <View style={[styles.scanCorner, styles.scanCornerBR]} />
              <View style={styles.scanLine} />
            </View>
          </View>

          <Text style={styles.scannerHint}>
            {t('scan_hint')}
          </Text>
        </View>
      </Modal>
    </View>
  );
}

// ============================================================
// STYLES - INCHANGÉS
// ============================================================
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
  qrActionsCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  qrActionBtn: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  qrActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  qrActionText: { fontSize: 13, fontWeight: '600' },
  qrActionSub: { fontSize: 10, marginTop: 2 },
  qrDivider: { width: 1, backgroundColor: COLORS.gray200, marginHorizontal: 8 },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  qrCodeContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  qrCodeImage: { width: 240, height: 240, borderRadius: 12 },
  qrCodePlaceholder: { width: 240, height: 240, alignItems: 'center', justifyContent: 'center' },
  qrCodeHint: { textAlign: 'center', fontSize: 13, marginTop: 8 },
  qrModalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  qrModalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  qrModalBtnPrimary: { backgroundColor: COLORS.primary },
  qrModalBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  qrModalBtnText: { fontWeight: '600', fontSize: 14 },
  closeModalBtn: { marginTop: 12, paddingVertical: 10, alignItems: 'center' },
  closeModalBtnText: { color: COLORS.gray500, fontWeight: '500', fontSize: 14 },
  scannerContainer: { flex: 1, backgroundColor: '#000' },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  scannerTitle: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  scannerWrapper: { flex: 1, position: 'relative' },
  scannerPermissionView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a2e',
    padding: 20,
  },
  scannerPermissionText: {
    color: COLORS.white,
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  scannerPermissionBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 16,
  },
  scannerPermissionBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  scanFrame: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    right: '10%',
    bottom: '20%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanCorner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: COLORS.white,
    borderWidth: 3,
  },
  scanCornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderRadius: 4,
  },
  scanCornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderRadius: 4,
  },
  scanCornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderRadius: 4,
  },
  scanCornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderRadius: 4,
  },
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: '10%',
    right: '10%',
    height: 3,
    backgroundColor: 'rgba(99, 102, 241, 0.6)',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  scannerHint: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
});