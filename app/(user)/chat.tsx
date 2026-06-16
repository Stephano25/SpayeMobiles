import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { ChatService } from '../../src/services/ChatService';
import { FriendService } from '../../src/services/FriendService';
import { COLORS, formatTime, getInitials, getAvatarColor } from '../../src/config';
import { router, useLocalSearchParams } from 'expo-router';

export default function ChatScreen() {
  const { colors } = useTheme();
  const { user, getToken } = useAuth();
  const { showError } = useNotification();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showConversations, setShowConversations] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  // Charger les conversations et les messages
  useEffect(() => {
    const initChat = async () => {
      const token = getToken();
      if (token) {
        await ChatService.connect(token);
      }
      await loadConversations();
      if (userId) {
        await loadMessages(userId);
        const conv = conversations.find(c => c.userId === userId);
        if (conv) setSelectedUser(conv);
      }
      setLoading(false);
    };
    initChat();

    // Écouter les nouveaux messages
    const unsub = ChatService.onNewMessage((msg) => {
      if (selectedUser && msg.senderId === selectedUser.userId) {
        setMessages(prev => [...prev, msg]);
        ChatService.markAsRead(selectedUser.userId);
      }
      // Mettre à jour la liste des conversations
      loadConversations();
    });

    // Écouter le statut en ligne
    const unsubOnline = ChatService.onOnlineStatus((data) => {
      setConversations(prev => 
        prev.map(c => 
          c.userId === data.userId ? { ...c, isOnline: data.isOnline } : c
        )
      );
    });

    return () => {
      unsub?.();
      unsubOnline?.();
      ChatService.disconnect();
    };
  }, []);

  // Charger les conversations
  const loadConversations = async () => {
    try {
      const convs = await ChatService.getConversations();
      setConversations(convs || []);
    } catch (error) {
      console.error('Erreur chargement conversations:', error);
    }
  };

  // Charger les messages d'un utilisateur
  const loadMessages = async (otherUserId: string) => {
    try {
      const msgs = await ChatService.getMessages(otherUserId);
      setMessages(msgs.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ));
      // Marquer comme lu
      await ChatService.markAsRead(otherUserId);
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    } catch (error) {
      showError('Erreur chargement des messages');
    }
  };

  // Sélectionner une conversation
  const selectConversation = async (conv: any) => {
    setSelectedUser(conv);
    setShowConversations(false);
    await loadMessages(conv.userId);
  };

  // Envoyer un message
  const sendMessage = () => {
    if (!newMessage.trim() || !selectedUser || sending) return;
    
    setSending(true);
    const tempId = 'temp-' + Date.now();
    const tempMsg = {
      id: tempId,
      senderId: user?.id,
      receiverId: selectedUser.userId,
      type: 'text',
      content: newMessage.trim(),
      isRead: false,
      isDelivered: false,
      createdAt: new Date().toISOString(),
    };
    
    // Ajouter le message temporairement
    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');
    setTimeout(() => flatListRef.current?.scrollToEnd(), 100);

    // Envoyer via socket
    ChatService.sendMessage({
      receiverId: selectedUser.userId,
      type: 'text',
      content: newMessage.trim(),
    });

    setSending(false);
  };

  // Revenir à la liste des conversations
  const goBackToList = () => {
    setShowConversations(true);
    setSelectedUser(null);
    setMessages([]);
  };

  // Rendu d'un message
  const renderMessage = ({ item }: { item: any }) => {
    const isOwn = item.senderId === user?.id;
    return (
      <View
        style={[
          styles.messageRow,
          isOwn ? styles.rowRight : styles.rowLeft,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isOwn ? styles.bubbleRight : styles.bubbleLeft,
            { backgroundColor: isOwn ? COLORS.primary : colors.card }
          ]}
        >
          <Text style={[
            styles.messageText,
            { color: isOwn ? COLORS.white : colors.text }
          ]}>
            {item.content || (item.type === 'emoji' ? item.emoji : '')}
          </Text>
          <Text style={[
            styles.time,
            { color: isOwn ? 'rgba(255,255,255,0.7)' : COLORS.gray500 }
          ]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  // Rendu d'une conversation dans la liste
  const renderConversation = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.convItem, { backgroundColor: colors.card }]}
      onPress={() => selectConversation(item)}
    >
      <View style={[styles.convAvatar, { backgroundColor: getAvatarColor(item.firstName) }]}>
        <Text style={styles.convAvatarText}>
          {getInitials(item.firstName, item.lastName)}
        </Text>
        {item.isOnline && <View style={styles.onlineDot} />}
      </View>
      <View style={styles.convInfo}>
        <Text style={[styles.convName, { color: colors.text }]}>
          {item.firstName} {item.lastName}
        </Text>
        <Text style={[styles.convLastMsg, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.lastMessage?.content || 'Aucun message'}
        </Text>
      </View>
      <View style={styles.convMeta}>
        <Text style={styles.convTime}>
          {item.lastMessageTime ? formatTime(item.lastMessageTime) : ''}
        </Text>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        {selectedUser && !showConversations ? (
          <>
            <TouchableOpacity onPress={goBackToList} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <View style={styles.headerUserInfo}>
              <View style={[styles.headerAvatar, { backgroundColor: getAvatarColor(selectedUser.firstName) }]}>
                <Text style={styles.headerAvatarText}>
                  {getInitials(selectedUser.firstName, selectedUser.lastName)}
                </Text>
              </View>
              <View>
                <Text style={styles.headerName}>
                  {selectedUser.firstName} {selectedUser.lastName}
                </Text>
                <Text style={styles.headerStatus}>
                  {selectedUser.isOnline ? '🟢 En ligne' : 'Hors ligne'}
                </Text>
              </View>
            </View>
            <TouchableOpacity>
              <Ionicons name="call-outline" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Messages</Text>
            <TouchableOpacity onPress={() => router.push('/(user)/friends')}>
              <Ionicons name="people-outline" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </>
        )}
      </View>

      {showConversations || !selectedUser ? (
        // Liste des conversations
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.userId}
          renderItem={renderConversation}
          contentContainerStyle={styles.convList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color={COLORS.gray400} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Aucune conversation
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.push('/(user)/friends')}
              >
                <Text style={styles.emptyBtnText}>Ajouter des amis</Text>
              </TouchableOpacity>
            </View>
          }
        />
      ) : (
        // Zone de chat
        <>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          />

          {/* Zone de saisie */}
          <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
            <TouchableOpacity>
              <Ionicons name="happy-outline" size={24} color={COLORS.gray500} />
            </TouchableOpacity>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Écrire un message..."
              placeholderTextColor={COLORS.gray400}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, !newMessage.trim() && styles.sendBtnDisabled]}
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
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginLeft: 8,
  },
  headerUserInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerAvatarText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  headerName: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  headerStatus: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },

  convList: { padding: 12, paddingBottom: 20 },
  convItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  convAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  convAvatarText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  convInfo: {
    flex: 1,
    marginLeft: 12,
  },
  convName: {
    fontSize: 16,
    fontWeight: '600',
  },
  convLastMsg: {
    fontSize: 14,
    marginTop: 2,
  },
  convMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  convTime: {
    fontSize: 12,
    color: COLORS.gray400,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },

  messagesList: { padding: 12, paddingBottom: 20 },
  messageRow: { marginVertical: 4 },
  rowRight: { alignItems: 'flex-end' },
  rowLeft: { alignItems: 'flex-start' },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
  },
  bubbleRight: {
    borderBottomRightRadius: 4,
  },
  bubbleLeft: {
    borderBottomLeftRadius: 4,
  },
  messageText: { fontSize: 15 },
  time: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    gap: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  emptyBtn: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  emptyBtnText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
});