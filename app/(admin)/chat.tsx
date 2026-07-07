// app/(admin)/chat.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { useAuth } from '../../src/context/AuthContext';
import { ChatService, Message, Conversation } from '../../src/services/ChatService';
import { COLORS, formatTime, getInitials, getAvatarColor } from '../../src/config/colors';
import { SafeScreen } from '../../src/components/SafeScreen';
import { useTranslation } from '../../src/services/TranslationService';

export default function AdminChatScreen() {
  const { colors } = useTheme();
  const { showError } = useNotification();
  const { t } = useTranslation();
  const { getCurrentUser } = useAuth();
  const navigation = useNavigation();
  const user = getCurrentUser();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      const data = await ChatService.getConversations();
      setConversations(data || []);
    } catch (error) {
      showError(t('error_loading'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showError, t]);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
      setupSocketListeners();
      return () => {
        ChatService.reset();
      };
    }, [loadConversations])
  );

  const setupSocketListeners = () => {
    ChatService.onNewMessage((msg: Message) => {
      handleNewMessage(msg);
    });
    ChatService.onTyping((data: { userId: string; isTyping: boolean }) => {
      if (selectedUser && data.userId === selectedUser.userId) {
        setIsTyping(data.isTyping);
      }
    });
    ChatService.onOnlineStatus((data: { userId: string; isOnline: boolean }) => {
      updateOnlineStatus(data.userId, data.isOnline);
    });
  };

  const handleNewMessage = (msg: Message) => {
    if (selectedUser && msg.senderId === selectedUser.userId) {
      setMessages((prev: Message[]) => [...prev, msg]);
      scrollToBottom();
    }
    updateConversationLastMessage(msg);
  };

  const updateConversationLastMessage = (msg: Message) => {
    setConversations((prev: Conversation[]) => {
      const updated = prev.map((conv: Conversation) => {
        if (conv.userId === msg.senderId || conv.userId === msg.receiverId) {
          return {
            ...conv,
            lastMessage: {
              content: msg.content || 'Message',
              type: msg.type || 'text',
              createdAt: msg.createdAt || new Date(),
            },
            lastMessageTime: msg.createdAt || new Date(),
          };
        }
        return conv;
      });
      return updated.sort((a: Conversation, b: Conversation) => 
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );
    });
  };

  const updateOnlineStatus = (userId: string, isOnline: boolean) => {
    setConversations((prev: Conversation[]) =>
      prev.map((conv: Conversation) =>
        conv.userId === userId ? { ...conv, isOnline } : conv
      )
    );
    if (selectedUser && selectedUser.userId === userId) {
      setSelectedUser({ ...selectedUser, isOnline });
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const selectConversation = async (conv: Conversation) => {
    setSelectedUser(conv);
    setMessages([]);
    try {
      const data = await ChatService.getMessages(conv.userId);
      setMessages(data || []);
      scrollToBottom();
      await ChatService.markAsRead(conv.userId);
    } catch (error) {
      showError(t('error_loading'));
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || sending) return;
    
    setSending(true);
    const content = newMessage.trim();
    const tempId = 'temp-' + Date.now();
    
    const tempMessage: Message = {
      id: tempId,
      senderId: user?.id || '',
      receiverId: selectedUser.userId,
      content,
      type: 'text',
      isRead: false,
      isDelivered: false,
      createdAt: new Date(),
    };
    
    setMessages((prev: Message[]) => [...prev, tempMessage]);
    setNewMessage('');
    scrollToBottom();

    try {
      await ChatService.sendMessage({
        receiverId: selectedUser.userId,
        type: 'text',
        content,
      });
    } catch (error) {
      showError(t('error'));
      setMessages((prev: Message[]) => prev.filter((msg: Message) => msg.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const onTyping = () => {
    if (!selectedUser) return;
    ChatService.sendTyping(selectedUser.userId, true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      if (selectedUser) ChatService.sendTyping(selectedUser.userId, false);
    }, 1500);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
  };

  const filteredConversations = conversations.filter((conv: Conversation) =>
    `${conv.firstName} ${conv.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={[
        styles.convItem,
        { backgroundColor: selectedUser?.userId === item.userId ? COLORS.primary + '18' : 'transparent' }
      ]}
      onPress={() => selectConversation(item)}
    >
      <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.firstName + item.lastName) }]}>
        <Text style={styles.avatarText}>{getInitials(item.firstName, item.lastName)}</Text>
        {item.isOnline && <View style={styles.onlineDot} />}
      </View>
      <View style={styles.convInfo}>
        <View style={styles.convHeader}>
          <Text style={[styles.convName, { color: colors.text }]}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={[styles.convTime, { color: colors.textSecondary }]}>
            {formatTime(item.lastMessageTime)}
          </Text>
        </View>
        <View style={styles.convPreview}>
          <Text style={[styles.convPreviewText, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.lastMessage?.content || 'Nouvelle conversation'}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.senderId === user?.id;
    return (
      <View style={[styles.msgRow, isOwn ? styles.msgRowOwn : styles.msgRowOther]}>
        <View style={[
          styles.msgBubble,
          isOwn ? styles.msgBubbleOwn : styles.msgBubbleOther,
          { backgroundColor: isOwn ? COLORS.primary : colors.card }
        ]}>
          <Text style={[
            styles.msgText,
            { color: isOwn ? COLORS.white : colors.text }
          ]}>
            {item.content || ''}
          </Text>
          <Text style={[
            styles.msgTime,
            { color: isOwn ? 'rgba(255,255,255,0.6)' : colors.textSecondary }
          ]}>
            {formatTime(item.createdAt)}
          </Text>
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
        <Text style={styles.headerTitle}>{t('messages')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.container}>
        {!selectedUser ? (
          <>
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

            <FlatList
              data={filteredConversations}
              keyExtractor={(item: Conversation) => item.userId}
              renderItem={renderConversation}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
              }
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="chatbubbles-outline" size={48} color={COLORS.gray400} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {t('no_conversations')}
                  </Text>
                </View>
              }
            />
          </>
        ) : (
          <KeyboardAvoidingView
            style={styles.chatContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <View style={[styles.chatHeader, { backgroundColor: colors.card }]}>
              <TouchableOpacity onPress={() => setSelectedUser(null)} style={styles.chatBack}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <View style={[styles.chatAvatar, { backgroundColor: getAvatarColor(selectedUser.firstName + selectedUser.lastName) }]}>
                <Text style={styles.chatAvatarText}>
                  {getInitials(selectedUser.firstName, selectedUser.lastName)}
                </Text>
                {selectedUser.isOnline && <View style={styles.chatOnlineDot} />}
              </View>
              <View style={styles.chatUserInfo}>
                <Text style={[styles.chatUserName, { color: colors.text }]}>
                  {selectedUser.firstName} {selectedUser.lastName}
                </Text>
                <Text style={[styles.chatUserStatus, { color: selectedUser.isOnline ? COLORS.success : colors.textSecondary }]}>
                  {isTyping ? t('typing') : (selectedUser.isOnline ? t('online') : t('offline'))}
                </Text>
              </View>
            </View>

            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item: Message) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.messagesList}
              onContentSizeChange={scrollToBottom}
            />

            <View style={[styles.composer, { backgroundColor: colors.card }]}>
              <TextInput
                style={[styles.composerInput, { color: colors.text, backgroundColor: colors.background }]}
                value={newMessage}
                onChangeText={(text) => {
                  setNewMessage(text);
                  onTyping();
                }}
                placeholder={t('type_message')}
                placeholderTextColor={COLORS.gray400}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: COLORS.primary }]}
                onPress={sendMessage}
                disabled={!newMessage.trim() || sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Ionicons name="send" size={20} color={COLORS.white} />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
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
  listContent: { paddingHorizontal: 12, paddingBottom: 20 },
  convItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  avatarText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
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
  convInfo: { flex: 1 },
  convHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convName: { fontSize: 15, fontWeight: '600' },
  convTime: { fontSize: 11 },
  convPreview: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  convPreviewText: { fontSize: 13, flex: 1, marginRight: 8 },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 6,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, marginTop: 12 },
  chatContainer: { flex: 1 },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray200,
  },
  chatBack: { padding: 4, marginRight: 8 },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    position: 'relative',
  },
  chatAvatarText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },
  chatOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  chatUserInfo: { flex: 1 },
  chatUserName: { fontSize: 15, fontWeight: '600' },
  chatUserStatus: { fontSize: 12 },
  messagesList: { padding: 12, paddingBottom: 20 },
  msgRow: { marginBottom: 8 },
  msgRowOwn: { alignItems: 'flex-end' },
  msgRowOther: { alignItems: 'flex-start' },
  msgBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 16,
  },
  msgBubbleOwn: {
    borderBottomRightRadius: 4,
  },
  msgBubbleOther: {
    borderBottomLeftRadius: 4,
  },
  msgText: { fontSize: 14, lineHeight: 20 },
  msgTime: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.gray200,
    gap: 8,
  },
  composerInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 15,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});