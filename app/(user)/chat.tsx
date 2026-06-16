import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Modal,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
  Image,
  Linking,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { ChatService } from '../../src/services/ChatService';
import { FriendService } from '../../src/services/FriendService';
import { COLORS, formatTime, getInitials, getAvatarColor, formatDateTime } from '../../src/config';

const { width } = Dimensions.get('window');

// Émojis (comme dans Angular)
const EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
  '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
  '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
  '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥',
  '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
  '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '💀', '👻', '👽',
  '🤖', '💩', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🙈', '🙉', '🙊', '💋', '💌',
  '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '❤️', '🧡', '💛', '💚', '💙', '💜',
  '🤎', '🖤', '🤍', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬', '👁️', '🗣️', '👤', '👥',
  '👣', '🧠', '🩸', '🩻', '💪', '🦵', '🦶', '👂', '🦻', '👃', '👀', '🧬', '🦷', '👅', '👄', '💋'
];

export default function ChatScreen() {
  const { colors } = useTheme();
  const { user, getToken } = useAuth();
  const { showError, showSuccess, showInfo, showWarning } = useNotification();
  const { userId } = useLocalSearchParams<{ userId: string }>();

  // États (comme dans Angular)
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<any>(null);
  const [onlineFriends, setOnlineFriends] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showConversationsList, setShowConversationsList] = useState(true);

  const flatListRef = useRef<FlatList>(null);
  const messageContainerRef = useRef<View>(null);
  const fileInputRef = useRef<any>(null);

  // Initialisation (comme ngOnInit)
  useEffect(() => {
    const userData = user;
    setCurrentUserId(userData?.id || '');
    setIsVoiceSupported(!!('MediaRecorder' in window || 'webkitSpeechRecognition' in window));
    
    const initChat = async () => {
      const token = getToken();
      if (token) {
        await ChatService.connect(token);
      }
      await loadConversations();
      await loadOnlineFriends();
      setupSocketListeners();
      setLoading(false);
    };
    initChat();

    return () => {
      ChatService.disconnect();
    };
  }, []);

  // Charger les messages si un userId est passé en paramètre
  useEffect(() => {
    if (userId && conversations.length > 0) {
      const existing = conversations.find(c => c.userId === userId);
      if (existing) {
        selectConversation(existing);
      } else {
        startChat(userId);
      }
    }
  }, [userId, conversations]);

  // ============================================================
  // MÉTHODES (comme dans Angular)
  // ============================================================

  // loadConversations()
  const loadConversations = async () => {
    try {
      const convs = await ChatService.getConversations();
      setConversations(convs.sort((a, b) =>
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      ));
    } catch (error) {
      console.error('Erreur chargement conversations:', error);
    }
  };

  // loadOnlineFriends()
  const loadOnlineFriends = async () => {
    try {
      const friends = await FriendService.getFriends();
      const accepted = friends.filter(f => f.status === 'accepted');
      setOnlineFriends(accepted.filter(f => f.friend?.isOnline === true));
    } catch (error) {
      console.error('Erreur chargement amis en ligne:', error);
    }
  };

  // setupSocketListeners()
  const setupSocketListeners = () => {
    ChatService.onNewMessage((msg) => {
      handleNewMessage(msg);
    });

    ChatService.onTyping((data) => {
      if (data && selectedContact && data.userId === selectedContact.userId) {
        setIsTyping(data.isTyping);
      }
    });

    ChatService.onOnlineStatus((data) => {
      if (!data) return;
      setConversations(prev =>
        prev.map(c =>
          c.userId === data.userId ? { ...c, isOnline: data.isOnline } : c
        )
      );
      loadOnlineFriends();
    });
  };

  // handleNewMessage()
  const handleNewMessage = (message: any) => {
    // Si le message est pour la conversation sélectionnée
    if (selectedContact && message.senderId === selectedContact.userId) {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
      ChatService.markAsRead(selectedContact.userId);
    }

    // Mettre à jour la liste des conversations
    setConversations(prev => {
      const convIndex = prev.findIndex(c => c.userId === message.senderId);
      if (convIndex !== -1) {
        const updatedConv = { ...prev[convIndex] };
        updatedConv.lastMessage = {
          content: message.content || (message.type === 'emoji' ? message.emoji : '[Média]'),
          type: message.type,
          createdAt: message.createdAt
        };
        updatedConv.lastMessageTime = message.createdAt;
        if (selectedContact?.userId !== message.senderId) {
          updatedConv.unreadCount = (updatedConv.unreadCount || 0) + 1;
        }
        const newConvs = [...prev];
        newConvs[convIndex] = updatedConv;
        return newConvs.sort((a, b) =>
          new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
        );
      }
      return prev;
    });
  };

  // selectConversation()
  const selectConversation = async (conv: any) => {
    setSelectedContact(conv);
    setShowConversationsList(false);
    setMessages([]);
    try {
      const msgs = await ChatService.getMessages(conv.userId);
      setMessages(msgs.sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ));
      scrollToBottom();
      await ChatService.markAsRead(conv.userId);
      setConversations(prev =>
        prev.map(c =>
          c.userId === conv.userId ? { ...c, unreadCount: 0 } : c
        )
      );
    } catch (error) {
      showError('Erreur chargement des messages');
    }
  };

  // filteredConversations (getter)
  const filteredConversations = () => {
    if (!searchQuery) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter(conv =>
      `${conv.firstName} ${conv.lastName}`.toLowerCase().includes(query)
    );
  };

  // sendMessage()
  const sendMessage = () => {
    if (!newMessage.trim() || !selectedContact || isSending) return;

    setIsSending(true);
    const tempId = 'temp-' + Date.now();
    const tempMsg = {
      id: tempId,
      senderId: currentUserId,
      receiverId: selectedContact.userId,
      type: 'text',
      content: newMessage.trim(),
      isRead: false,
      isDelivered: false,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');
    scrollToBottom();

    ChatService.sendMessage({
      receiverId: selectedContact.userId,
      type: 'text',
      content: tempMsg.content,
    });

    ChatService.sendTyping(selectedContact.userId, false);
    setTimeout(() => setIsSending(false), 500);
  };

  // sendEmoji()
  const sendEmoji = (emoji: string) => {
    if (!selectedContact) return;

    const tempMsg = {
      id: 'temp-emoji-' + Date.now(),
      senderId: currentUserId,
      receiverId: selectedContact.userId,
      type: 'emoji',
      emoji: emoji,
      isRead: false,
      isDelivered: false,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempMsg]);
    scrollToBottom();

    ChatService.sendMessage({
      receiverId: selectedContact.userId,
      type: 'emoji',
      emoji: emoji,
    });

    setShowEmojiPicker(false);
  };

  // onTyping()
  const onTyping = () => {
    if (!selectedContact) return;
    ChatService.sendTyping(selectedContact.userId, true);
    clearTimeout(typingTimeout);
    const timeout = setTimeout(() => {
      if (selectedContact) {
        ChatService.sendTyping(selectedContact.userId, false);
      }
    }, 1000);
    setTypingTimeout(timeout);
  };

  // scrollToBottom()
  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // startChat()
  const startChat = async (friendId: string) => {
    const existing = conversations.find(c => c.userId === friendId);
    if (existing) {
      selectConversation(existing);
    } else {
      try {
        const friends = await FriendService.getFriends();
        const friend = friends.find(f => f.friend?.id === friendId)?.friend;
        if (friend) {
          const newConv = {
            userId: friend.id,
            firstName: friend.firstName,
            lastName: friend.lastName,
            profilePicture: friend.profilePicture,
            lastMessage: { content: '', type: 'text', createdAt: new Date() },
            lastMessageTime: new Date().toISOString(),
            unreadCount: 0,
            isOnline: friend.isOnline || false,
          };
          setConversations(prev => [newConv, ...prev]);
          selectConversation(newConv);
        }
      } catch (error) {
        showError('Erreur lors du démarrage de la conversation');
      }
    }
  };

  // toggleEmojiPicker()
  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  // uploadFile()
  const uploadFile = async () => {
    if (!selectedContact) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const file = {
          uri: asset.uri,
          name: asset.fileName || 'file.jpg',
          type: asset.mimeType || 'image/jpeg',
          size: asset.fileSize || 0,
        };

        // Vérifier la taille du fichier (max 150 Mo comme dans Angular)
        if (file.size > 150 * 1024 * 1024) {
          showError('Fichier trop volumineux (max 150 Mo)');
          return;
        }

        setIsSending(true);
        const uploadResult = await ChatService.uploadFile(file);
        const type = file.type?.startsWith('image/') ? 'image' : 'file';

        const tempMsg = {
          id: 'temp-file-' + Date.now(),
          senderId: currentUserId,
          receiverId: selectedContact.userId,
          type: type as any,
          fileUrl: uploadResult.url,
          fileName: uploadResult.fileName || file.name,
          fileSize: uploadResult.fileSize || file.size || 0,
          isRead: false,
          isDelivered: false,
          createdAt: new Date().toISOString(),
        };

        setMessages(prev => [...prev, tempMsg]);
        scrollToBottom();

        ChatService.sendMessage({
          receiverId: selectedContact.userId,
          type: type as any,
          fileUrl: uploadResult.url,
          fileName: uploadResult.fileName || file.name,
          fileSize: uploadResult.fileSize || file.size || 0,
        });

        setIsSending(false);
        showSuccess('Fichier envoyé');
      }
    } catch (error) {
      showError('Erreur lors de l\'upload');
      setIsSending(false);
    }
  };

  // startCall()
  const startCall = (type: 'audio' | 'video') => {
    if (!selectedContact) return;
    if (!selectedContact.isOnline) {
      showWarning('Utilisateur hors ligne');
      return;
    }
    showInfo(`Appel ${type} démarré avec ${selectedContact.firstName}`);
  };

  // startVoiceRecording()
  const startVoiceRecording = () => {
    showInfo('Fonctionnalité de message vocal bientôt disponible');
  };

  // sendMoney()
  const sendMoney = () => {
    if (!selectedContact) return;
    Alert.prompt(
      'Envoyer de l\'argent',
      `Montant à envoyer à ${selectedContact.firstName}:`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Envoyer',
          onPress: (amount) => {
            if (amount && !isNaN(Number(amount)) && Number(amount) > 0) {
              const tempMsg = {
                id: 'temp-money-' + Date.now(),
                senderId: currentUserId,
                receiverId: selectedContact.userId,
                type: 'money',
                moneyTransfer: { amount: Number(amount), status: 'pending' },
                isRead: false,
                isDelivered: false,
                createdAt: new Date().toISOString(),
              };
              setMessages(prev => [...prev, tempMsg]);
              scrollToBottom();
              ChatService.sendMessage({
                receiverId: selectedContact.userId,
                type: 'money',
                moneyTransfer: { amount: Number(amount) }
              });
            }
          }
        }
      ]
    );
  };

  // blockUser()
  const blockUser = async () => {
    if (!selectedContact) return;
    Alert.alert(
      'Bloquer l\'utilisateur',
      `Voulez-vous vraiment bloquer ${selectedContact.firstName} ${selectedContact.lastName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Bloquer',
          style: 'destructive',
          onPress: async () => {
            try {
              await FriendService.blockUser(selectedContact.userId);
              showSuccess('Utilisateur bloqué');
              setSelectedContact(prev => ({ ...prev, isOnline: false }));
              loadOnlineFriends();
            } catch (error) {
              showError('Erreur lors du blocage');
            }
          }
        }
      ]
    );
  };

  // viewProfile()
  const viewProfile = () => {
    if (!selectedContact) return;
    router.push({
      pathname: '/(user)/profile',
      params: { userId: selectedContact.userId }
    });
  };

  // goBack()
  const goBack = () => {
    router.back();
  };

  const goBackToList = () => {
    setShowConversationsList(true);
    setSelectedContact(null);
    setMessages([]);
  };

  // ============================================================
  // RENDU (comme le template Angular)
  // ============================================================

  const renderMessage = ({ item }: { item: any }) => {
    const isOwn = item.senderId === currentUserId;
    const content = item.content || (item.type === 'emoji' ? item.emoji : '');

    return (
      <View style={[styles.messageRow, isOwn ? styles.rowRight : styles.rowLeft]}>
        <View style={[
          styles.bubble,
          isOwn ? styles.bubbleRight : styles.bubbleLeft,
          { backgroundColor: isOwn ? COLORS.primary : colors.card }
        ]}>
          {item.type === 'image' ? (
            <TouchableOpacity 
              onPress={() => Linking.openURL(item.fileUrl)}
              style={styles.imageMessage}
            >
              <Image 
                source={{ uri: item.fileUrl }} 
                style={styles.messageImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : item.type === 'file' ? (
            <TouchableOpacity 
              onPress={() => Linking.openURL(item.fileUrl)}
              style={[styles.fileMessage, { backgroundColor: isOwn ? 'rgba(255,255,255,0.2)' : COLORS.gray100 }]}
            >
              <Ionicons 
                name="document-outline" 
                size={24} 
                color={isOwn ? COLORS.white : COLORS.primary} 
              />
              <Text style={[styles.fileName, { color: isOwn ? COLORS.white : colors.text }]}>
                {item.fileName || 'Fichier'}
              </Text>
            </TouchableOpacity>
          ) : item.type === 'money' ? (
            <View style={styles.moneyMessage}>
              <Ionicons name="cash-outline" size={20} color={isOwn ? COLORS.white : COLORS.success} />
              <Text style={[styles.moneyText, { color: isOwn ? COLORS.white : COLORS.success }]}>
                💰 {item.moneyTransfer?.amount || 0} Ar
              </Text>
            </View>
          ) : (
            <Text style={[styles.messageText, { color: isOwn ? COLORS.white : colors.text }]}>
              {content}
            </Text>
          )}
          <Text style={[styles.time, { color: isOwn ? 'rgba(255,255,255,0.7)' : COLORS.gray500 }]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  const renderConversation = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.convItem,
        selectedContact?.userId === item.userId && styles.convItemActive,
        { backgroundColor: selectedContact?.userId === item.userId ? COLORS.primaryLight : colors.card }
      ]}
      onPress={() => selectConversation(item)}
      activeOpacity={0.7}
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

  const renderOnlineFriend = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.onlineFriendItem}
      onPress={() => startChat(item.friend.id)}
      activeOpacity={0.7}
    >
      <View style={[styles.onlineAvatar, { backgroundColor: getAvatarColor(item.friend.firstName) }]}>
        <Text style={styles.onlineAvatarText}>
          {getInitials(item.friend.firstName, item.friend.lastName)}
        </Text>
        <View style={styles.liveDot} />
      </View>
      <Text style={styles.onlineFriendName} numberOfLines={1}>
        {item.friend.firstName} {item.friend.lastName}
      </Text>
    </TouchableOpacity>
  );

  // ============================================================
  // AFFICHAGE PRINCIPAL
  // ============================================================
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Layout comme Angular: conversations-panel | chat-area | online-friends-panel */}
        <View style={styles.chatLayout}>
          
          {/* PANEL CONVERSATIONS (gauche) */}
          {showConversationsList || !selectedContact ? (
            <View style={[styles.conversationsPanel, { backgroundColor: colors.card }]}>
              {/* Search Box */}
              <View style={styles.searchBox}>
                <Ionicons name="search" size={18} color={COLORS.gray400} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Rechercher..."
                  placeholderTextColor={COLORS.gray400}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {/* Conversations List */}
              <FlatList
                data={filteredConversations()}
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
            </View>
          ) : (
            // CHAT AREA (centre)
            <View style={[styles.chatArea, { backgroundColor: colors.background }]}>
              {/* Chat Header */}
              <View style={[styles.chatHeader, { backgroundColor: colors.card }]}>
                <TouchableOpacity onPress={goBackToList} style={styles.backBtn}>
                  <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.contactInfo} onPress={viewProfile}>
                  <View style={[styles.avatarLarge, { backgroundColor: getAvatarColor(selectedContact?.firstName || '') }]}>
                    <Text style={styles.avatarLargeText}>
                      {getInitials(selectedContact?.firstName, selectedContact?.lastName)}
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.contactName, { color: colors.text }]}>
                      {selectedContact?.firstName} {selectedContact?.lastName}
                    </Text>
                    <Text style={styles.contactStatus}>
                      {isTyping ? (
                        <Text style={styles.typingText}>En train d'écrire...</Text>
                      ) : selectedContact?.isOnline ? (
                        <Text style={styles.onlineText}>🟢 En ligne</Text>
                      ) : (
                        <Text style={styles.offlineText}>Hors ligne</Text>
                      )}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.chatActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => startCall('audio')}>
                    <Ionicons name="call-outline" size={22} color={colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => startCall('video')}>
                    <Ionicons name="videocam-outline" size={22} color={colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionBtn}
                    onPress={() => {
                      Alert.alert(
                        'Options',
                        'Choisissez une action',
                        [
                          { text: 'Envoyer de l\'argent', onPress: sendMoney },
                          { text: 'Voir le profil', onPress: viewProfile },
                          { text: 'Bloquer', onPress: blockUser, style: 'destructive' },
                          { text: 'Annuler', style: 'cancel' },
                        ]
                      );
                    }}
                  >
                    <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Messages Container */}
              <View style={styles.messagesContainer} ref={messageContainerRef}>
                <FlatList
                  ref={flatListRef}
                  data={messages}
                  keyExtractor={(item) => item.id}
                  renderItem={renderMessage}
                  contentContainerStyle={styles.messagesList}
                  onContentSizeChange={scrollToBottom}
                />
              </View>

              {/* Message Input Area */}
              <View style={[styles.messageInputArea, { backgroundColor: colors.card }]}>
                <TouchableOpacity onPress={toggleEmojiPicker}>
                  <Ionicons name="happy-outline" size={24} color={COLORS.gray500} />
                </TouchableOpacity>
                <TouchableOpacity onPress={uploadFile}>
                  <Ionicons name="attach-outline" size={24} color={COLORS.gray500} />
                </TouchableOpacity>
                {isVoiceSupported && (
                  <TouchableOpacity onPress={startVoiceRecording}>
                    <Ionicons name="mic-outline" size={24} color={COLORS.gray500} />
                  </TouchableOpacity>
                )}
                <TextInput
                  style={[styles.messageInput, { color: colors.text }]}
                  placeholder="Écrire un message..."
                  placeholderTextColor={COLORS.gray400}
                  value={newMessage}
                  onChangeText={setNewMessage}
                  onSubmitEditing={sendMessage}
                  onChange={onTyping}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.sendBtn, !newMessage.trim() && styles.sendBtnDisabled]}
                  onPress={sendMessage}
                  disabled={!newMessage.trim() || isSending}
                >
                  {isSending ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Ionicons name="send" size={20} color={COLORS.white} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Emoji Picker */}
              {showEmojiPicker && (
                <View style={[styles.emojiPicker, { backgroundColor: colors.card }]}>
                  <FlatList
                    data={EMOJIS}
                    keyExtractor={(item) => item}
                    numColumns={8}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.emojiItem}
                        onPress={() => sendEmoji(item)}
                      >
                        <Text style={styles.emojiText}>{item}</Text>
                      </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.emojiGrid}
                  />
                  <TouchableOpacity style={styles.emojiClose} onPress={() => setShowEmojiPicker(false)}>
                    <Text style={styles.emojiCloseText}>Fermer</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* PANEL AMIS EN LIGNE (droite) - toujours visible */}
          {showConversationsList && (
            <View style={[styles.onlineFriendsPanel, { backgroundColor: colors.card }]}>
              <Text style={[styles.onlinePanelTitle, { color: colors.text }]}>
                En ligne ({onlineFriends.length})
              </Text>
              <FlatList
                data={onlineFriends}
                keyExtractor={(item) => item.id}
                renderItem={renderOnlineFriend}
                contentContainerStyle={styles.onlineList}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ============================================================
// STYLES (inspirés du CSS Angular)
// ============================================================
const styles = StyleSheet.create({
  container: { flex: 1 },

  chatLayout: {
    flex: 1,
    flexDirection: 'row',
  },

  // ── CONVERSATIONS PANEL ──
  conversationsPanel: {
    width: 300,
    borderRightWidth: 0.5,
    borderRightColor: COLORS.gray200,
    display: 'flex',
    flexDirection: 'column',
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray200,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 14,
    marginLeft: 8,
  },

  convList: { padding: 8 },
  convItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 11,
    borderRadius: 12,
    marginBottom: 2,
  },
  convItemActive: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    paddingLeft: 8,
  },
  convAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  convAvatarText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 15,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  convInfo: { flex: 1, marginLeft: 12 },
  convName: { fontSize: 14, fontWeight: '600' },
  convLastMsg: { fontSize: 12, marginTop: 2 },
  convMeta: { alignItems: 'flex-end' },
  convTime: { fontSize: 11, color: COLORS.gray400 },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    marginTop: 4,
  },
  unreadText: { color: COLORS.white, fontSize: 11, fontWeight: 'bold' },

  // ── CHAT AREA ──
  chatArea: {
    flex: 1,
    flexDirection: 'column',
  },

  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray200,
  },
  backBtn: { padding: 4 },

  contactInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  avatarLarge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLargeText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  contactName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  contactStatus: {
    fontSize: 12,
    marginLeft: 10,
  },
  typingText: { color: COLORS.primary, fontStyle: 'italic' },
  onlineText: { color: COLORS.success },
  offlineText: { color: COLORS.gray400 },

  chatActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: { padding: 4 },

  messagesContainer: {
    flex: 1,
    padding: 20,
  },
  messagesList: {
    paddingBottom: 20,
  },

  messageRow: { marginVertical: 5 },
  rowRight: { alignItems: 'flex-end' },
  rowLeft: { alignItems: 'flex-start' },
  bubble: {
    maxWidth: '68%',
    padding: 10,
    paddingHorizontal: 15,
    borderRadius: 18,
  },
  bubbleRight: { borderBottomRightRadius: 4 },
  bubbleLeft: { borderBottomLeftRadius: 4 },
  messageText: { fontSize: 14 },
  time: {
    fontSize: 10,
    marginTop: 5,
    opacity: 0.65,
    alignSelf: 'flex-end',
  },

  imageMessage: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },

  fileMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
  },
  fileName: { fontSize: 13 },

  moneyMessage: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  moneyText: { fontSize: 14, fontWeight: '600' },

  // ── MESSAGE INPUT ──
  messageInputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.gray200,
    gap: 10,
  },
  messageInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gray200,
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
  sendBtnDisabled: { opacity: 0.45 },

  // ── EMOJI PICKER ──
  emojiPicker: {
    position: 'absolute',
    bottom: 72,
    left: 16,
    right: 16,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: COLORS.gray200,
    padding: 12,
    maxHeight: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  emojiGrid: { paddingBottom: 8 },
  emojiItem: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: { fontSize: 22 },
  emojiClose: {
    marginTop: 8,
    paddingVertical: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    alignItems: 'center',
  },
  emojiCloseText: { color: COLORS.white, fontWeight: '500', fontSize: 13 },

  // ── ONLINE FRIENDS PANEL ──
  onlineFriendsPanel: {
    width: 240,
    borderLeftWidth: 0.5,
    borderLeftColor: COLORS.gray200,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
  },
  onlinePanelTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  onlineList: { paddingBottom: 8 },
  onlineFriendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 10,
  },
  onlineAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  onlineAvatarText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  liveDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  onlineFriendName: { fontSize: 13, fontWeight: '500' },

  // ── EMPTY STATE ──
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: { fontSize: 15, marginTop: 12 },
  emptyBtn: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  emptyBtnText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },

  noChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    color: COLORS.gray400,
  },
});