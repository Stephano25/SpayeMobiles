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
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { ChatService } from '../../src/services/ChatService';
import { FriendService } from '../../src/services/FriendService';
import { COLORS, formatTime, getInitials, getAvatarColor } from '../../src/config';

const { width } = Dimensions.get('window');

// Émojis
const EMOJIS = [
  '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰',
  '😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏',
  '😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠',
  '😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥',
  '😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐',
  '🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','💀','👻','👽',
  '🤖','💩','😺','😸','😹','😻','😼','😽','🙀','😿','😾','🙈','🙉','🙊','💋','💌',
  '💘','💝','💖','💗','💓','💞','💕','💟','❣️','💔','❤️','🧡','💛','💚','💙','💜',
  '🤎','🖤','🤍','💯','💢','💥','💫','💦','💨','🕳️','💣','💬','👁️','🗣️','👤','👥',
  '👣','🧠','🩸','🩻','💪','🦵','🦶','👂','🦻','👃','👀','🧬','🦷','👅','👄','💋'
];

// Types
interface CallData {
  from: string;
  type: 'audio' | 'video';
  fromName?: string;
}

export default function ChatScreen() {
  const { colors } = useTheme();
  const { user, getToken } = useAuth();
  const { showError, showSuccess, showInfo, showWarning } = useNotification();
  const { userId } = useLocalSearchParams<{ userId: string }>();

  // États
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [onlineFriends, setOnlineFriends] = useState<any[]>([]);
  const [allFriends, setAllFriends] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showConversationsList, setShowConversationsList] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  // États pour les appels
  const [incomingCall, setIncomingCall] = useState<CallData | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'connected' | 'ended'>('idle');

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<any>(null);
  const recordingIntervalRef = useRef<any>(null);

  // ============================================================
  // INITIALISATION
  // ============================================================
  useEffect(() => {
    const userData = user;
    setCurrentUserId(userData?.id || '');
    
    const initChat = async () => {
      const token = getToken();
      if (token) {
        await ChatService.connect(token);
      }
      await loadAllData();
      setupSocketListeners();
      setLoading(false);
    };
    initChat();

    return () => {
      ChatService.disconnect();
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

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
  // CHARGEMENT DES DONNÉES
  // ============================================================
  const loadAllData = async () => {
    await Promise.all([
      loadConversations(),
      loadAllFriends(),
      loadOnlineFriends(),
    ]);
  };

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

  const loadAllFriends = async () => {
    try {
      const friends = await FriendService.getFriends();
      const accepted = friends.filter(f => f.status === 'accepted');
      setAllFriends(accepted);
    } catch (error) {
      console.error('Erreur chargement amis:', error);
    }
  };

  const loadOnlineFriends = async () => {
    try {
      const friends = await FriendService.getFriends();
      const accepted = friends.filter(f => f.status === 'accepted');
      setOnlineFriends(accepted.filter(f => f.friend?.isOnline === true));
    } catch (error) {
      console.error('Erreur chargement amis en ligne:', error);
    }
  };

  // ============================================================
  // SOCKET LISTENERS
  // ============================================================
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
      setConversations((prevConversations) =>
        prevConversations.map((c) =>
          c.userId === data.userId ? { ...c, isOnline: data.isOnline } : c
        )
      );
      loadOnlineFriends();
    });

    ChatService.onCall((data) => {
      if (data.from) {
        const friend = allFriends.find(f => f.friend?.id === data.from);
        setIncomingCall({
          from: data.from,
          type: data.type || 'audio',
          fromName: friend?.friend?.firstName || 'Inconnu',
        });
        setCallStatus('ringing');
      } else if (data.accepted !== undefined) {
        if (data.accepted) {
          setCallStatus('connected');
          showInfo('Appel connecté');
        } else {
          setCallStatus('ended');
          showInfo('Appel refusé');
          setIsCalling(false);
        }
      }
    });
  };

  // ============================================================
  // GESTION DES MESSAGES
  // ============================================================
  const handleNewMessage = (message: any) => {
    if (selectedContact && message.senderId === selectedContact.userId) {
      setMessages((prevMessages) => [...prevMessages, message]);
      scrollToBottom();
      ChatService.markAsRead(selectedContact.userId);
    }

    setConversations((prevConversations) => {
      const convIndex = prevConversations.findIndex(c => c.userId === message.senderId);
      if (convIndex !== -1) {
        const updatedConv = { ...prevConversations[convIndex] };
        updatedConv.lastMessage = {
          content: message.content || (message.type === 'emoji' ? message.emoji : '[Média]'),
          type: message.type,
          createdAt: message.createdAt
        };
        updatedConv.lastMessageTime = message.createdAt;
        if (selectedContact?.userId !== message.senderId) {
          updatedConv.unreadCount = (updatedConv.unreadCount || 0) + 1;
        }
        const newConvs = [...prevConversations];
        newConvs[convIndex] = updatedConv;
        return newConvs.sort((a, b) =>
          new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
        );
      }
      return prevConversations;
    });
  };

  // ============================================================
  // SÉLECTION DES CONVERSATIONS
  // ============================================================
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
      setConversations((prevConversations) =>
        prevConversations.map((c) =>
          c.userId === conv.userId ? { ...c, unreadCount: 0 } : c
        )
      );
    } catch (error) {
      showError('Erreur chargement des messages');
    }
  };

  const startChat = async (friendId: string) => {
    const existing = conversations.find(c => c.userId === friendId);
    if (existing) {
      selectConversation(existing);
    } else {
      try {
        const friend = allFriends.find(f => f.friend?.id === friendId)?.friend;
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
          setConversations((prevConversations) => [newConv, ...prevConversations]);
          selectConversation(newConv);
        } else {
          showError('Utilisateur non trouvé');
        }
      } catch (error) {
        showError('Erreur lors du démarrage de la conversation');
      }
    }
  };

  // ============================================================
  // ENVOI DE MESSAGES
  // ============================================================
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

    setMessages((prevMessages) => [...prevMessages, tempMsg]);
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

    setMessages((prevMessages) => [...prevMessages, tempMsg]);
    scrollToBottom();

    ChatService.sendMessage({
      receiverId: selectedContact.userId,
      type: 'emoji',
      emoji: emoji,
    });

    setShowEmojiPicker(false);
  };

  // ============================================================
  // MESSAGES VOCAUX
  // ============================================================
  const startVoiceRecording = () => {
    if (!selectedContact) return;
    
    if (!isRecording) {
      setIsRecording(true);
      setRecordingTime(0);
      showInfo('Enregistrement vocal...');
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      
      const tempMsg = {
        id: 'temp-audio-' + Date.now(),
        senderId: currentUserId,
        receiverId: selectedContact.userId,
        type: 'file',
        content: `🎤 Message vocal (${recordingTime}s)`,
        fileUrl: 'https://example.com/audio.mp3',
        fileName: `audio_${Date.now()}.mp3`,
        fileSize: recordingTime * 16,
        isRead: false,
        isDelivered: false,
        createdAt: new Date().toISOString(),
      };
      
      setMessages((prevMessages) => [...prevMessages, tempMsg]);
      scrollToBottom();
      
      ChatService.sendMessage({
        receiverId: selectedContact.userId,
        type: 'file',
        content: `🎤 Message vocal (${recordingTime}s)`,
        fileUrl: 'https://example.com/audio.mp3',
        fileName: `audio_${Date.now()}.mp3`,
        fileSize: recordingTime * 16,
      });
      
      showSuccess('Message vocal envoyé');
      setRecordingTime(0);
    }
  };

  // ============================================================
  // UPLOAD DE FICHIERS
  // ============================================================
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

        setMessages((prevMessages) => [...prevMessages, tempMsg]);
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

  // ============================================================
  // APPELS AUDIO/VIDÉO
  // ============================================================
  const startCall = (type: 'audio' | 'video') => {
    if (!selectedContact) return;
    
    if (!selectedContact.isOnline) {
      showWarning(`${selectedContact.firstName} n'est pas en ligne`);
      return;
    }

    setCallType(type);
    setCallStatus('calling');
    setIsCalling(true);

    ChatService.startCall(selectedContact.userId, type);
    showInfo(`Appel ${type} en cours...`);

    setTimeout(() => {
      if (callStatus === 'calling') {
        setCallStatus('connected');
        showInfo(`Appel ${type} connecté`);
      }
    }, 3000);
  };

  const acceptCall = () => {
    if (incomingCall) {
      setCallStatus('connected');
      ChatService.answerCall(incomingCall.from, true);
      setIncomingCall(null);
      showInfo('Appel accepté');
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      ChatService.answerCall(incomingCall.from, false);
      setIncomingCall(null);
      setCallStatus('ended');
      showInfo('Appel refusé');
    }
  };

  const endCall = () => {
    setCallStatus('ended');
    setIsCalling(false);
    setIncomingCall(null);
    showInfo('Appel terminé');
  };

  // ============================================================
  // ACTIONS
  // ============================================================
  const sendMoney = () => {
    if (!selectedContact) return;
    router.push({
      pathname: '/(user)/send-money',
      params: {
        receiverId: selectedContact.userId,
        receiverName: selectedContact.firstName + ' ' + selectedContact.lastName,
      },
    });
  };

  // 🔥 CORRECTION: blockUser avec vérification de sécurité
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
              // 🔥 CORRECTION: Vérification de sécurité
              if (selectedContact) {
                setSelectedContact({ ...selectedContact, isOnline: false });
              }
              loadOnlineFriends();
            } catch (error) {
              showError('Erreur lors du blocage');
            }
          },
        },
      ]
    );
  };

  const viewProfile = () => {
    if (!selectedContact) return;
    router.push({
      pathname: '/(user)/profile',
      params: { userId: selectedContact.userId },
    });
  };

  const onTyping = () => {
    if (!selectedContact) return;
    ChatService.sendTyping(selectedContact.userId, true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (selectedContact) {
        ChatService.sendTyping(selectedContact.userId, false);
      }
    }, 1000);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const goBackToList = () => {
    setShowConversationsList(true);
    setSelectedContact(null);
    setMessages([]);
  };

  const goBack = () => {
    router.back();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const filteredConversations = () => {
    if (!searchQuery) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter((conv) =>
      `${conv.firstName} ${conv.lastName}`.toLowerCase().includes(query)
    );
  };

  // ============================================================
  // RENDU
  // ============================================================
  const renderMessage = ({ item }: { item: any }) => {
    const isOwn = item.senderId === currentUserId;
    const content = item.content || (item.type === 'emoji' ? item.emoji : '');

    return (
      <View style={[styles.messageRow, isOwn ? styles.rowRight : styles.rowLeft]}>
        <View
          style={[
            styles.bubble,
            isOwn ? styles.bubbleRight : styles.bubbleLeft,
            { backgroundColor: isOwn ? COLORS.primary : colors.card },
          ]}
        >
          {item.type === 'image' ? (
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Image', 'Voulez-vous ouvrir cette image ?', [
                  { text: 'Annuler', style: 'cancel' },
                  { text: 'Ouvrir', onPress: () => {} },
                ]);
              }}
              style={styles.imageMessage}
            >
              <Image source={{ uri: item.fileUrl }} style={styles.messageImage} resizeMode="cover" />
              <View style={styles.imageOverlay}>
                <Ionicons name="download-outline" size={20} color={COLORS.white} />
              </View>
            </TouchableOpacity>
          ) : item.type === 'file' ? (
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Fichier', `Télécharger ${item.fileName || 'le fichier'} ?`, [
                  { text: 'Annuler', style: 'cancel' },
                  { text: 'Télécharger', onPress: () => {} },
                ]);
              }}
              style={[styles.fileMessage, { backgroundColor: isOwn ? 'rgba(255,255,255,0.2)' : COLORS.gray100 }]}
            >
              <Ionicons
                name={item.content?.includes('🎤') ? 'mic-outline' : 'document-outline'}
                size={24}
                color={isOwn ? COLORS.white : COLORS.primary}
              />
              <View style={styles.fileInfo}>
                <Text style={[styles.fileName, { color: isOwn ? COLORS.white : colors.text }]}>
                  {item.fileName || 'Fichier'}
                </Text>
                <Text style={[styles.fileSize, { color: isOwn ? 'rgba(255,255,255,0.7)' : COLORS.gray500 }]}>
                  {item.fileSize ? `${(item.fileSize / 1024).toFixed(1)} KB` : ''}
                </Text>
              </View>
              <Ionicons name="download-outline" size={20} color={isOwn ? COLORS.white : COLORS.primary} />
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
        { backgroundColor: selectedContact?.userId === item.userId ? COLORS.primaryLight : colors.card },
      ]}
      onPress={() => selectConversation(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.convAvatar, { backgroundColor: getAvatarColor(item.firstName) }]}>
        <Text style={styles.convAvatarText}>{getInitials(item.firstName, item.lastName)}</Text>
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
      <Text style={styles.onlineFriendNameText} numberOfLines={1}>
        {item.friend.firstName}
      </Text>
    </TouchableOpacity>
  );

  // ============================================================
  // MODAL APPEL
  // ============================================================
  const renderCallModal = () => {
    if (!incomingCall && callStatus === 'idle') return null;

    const isIncoming = !!incomingCall;
    const name = isIncoming ? incomingCall?.fromName : selectedContact?.firstName;

    return (
      <Modal visible={true} transparent animationType="fade">
        <View style={styles.callModal}>
          <View style={[styles.callContent, { backgroundColor: colors.card }]}>
            <View
              style={[
                styles.callAvatar,
                { backgroundColor: getAvatarColor(name || '') },
              ]}
            >
              <Text style={styles.callAvatarText}>
                {getInitials(name?.split(' ')[0] || '', name?.split(' ')[1] || '')}
              </Text>
            </View>
            <Text style={[styles.callName, { color: colors.text }]}>{name || 'Utilisateur'}</Text>
            <Text style={styles.callStatusText}>
              {isIncoming
                ? `${callType === 'audio' ? 'Appel audio' : 'Appel vidéo'} entrant...`
                : callStatus === 'calling'
                ? 'Appel en cours...'
                : callStatus === 'connected'
                ? 'En ligne'
                : 'Terminé'}
            </Text>

            <View style={styles.callActions}>
              {isIncoming ? (
                <>
                  <TouchableOpacity style={[styles.callBtn, styles.callBtnAccept]} onPress={acceptCall}>
                    <Ionicons name="call" size={32} color={COLORS.white} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.callBtn, styles.callBtnReject]} onPress={rejectCall}>
                    <Ionicons name="close" size={32} color={COLORS.white} />
                  </TouchableOpacity>
                </>
              ) : callStatus === 'connected' ? (
                <>
                  <TouchableOpacity style={[styles.callBtn, styles.callBtnMute]}>
                    <Ionicons name="mic-off" size={24} color={COLORS.white} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.callBtn, styles.callBtnSpeaker]}>
                    <Ionicons name="volume-high" size={24} color={COLORS.white} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.callBtn, styles.callBtnReject]} onPress={endCall}>
                    <Ionicons name="call" size={32} color={COLORS.white} />
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={[styles.callBtn, styles.callBtnReject]} onPress={endCall}>
                  <Ionicons name="close" size={32} color={COLORS.white} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // ============================================================
  // AFFICHAGE PRINCIPAL
  // ============================================================
  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
        ]}
      >
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
        <View style={styles.chatLayout}>
          {/* PANEL CONVERSATIONS */}
          {showConversationsList || !selectedContact ? (
            <View style={[styles.conversationsPanel, { backgroundColor: colors.card }]}>
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

              {onlineFriends.length > 0 && (
                <View style={styles.onlineSection}>
                  <Text style={[styles.onlineSectionTitle, { color: colors.text }]}>
                    En ligne ({onlineFriends.length})
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.onlineScrollContent}
                  >
                    {onlineFriends.map((friend) => (
                      <TouchableOpacity
                        key={friend.id}
                        style={styles.onlineFriendCard}
                        onPress={() => startChat(friend.friend.id)}
                      >
                        <View
                          style={[
                            styles.onlineFriendAvatar,
                            { backgroundColor: getAvatarColor(friend.friend.firstName) },
                          ]}
                        >
                          <Text style={styles.onlineFriendAvatarText}>
                            {getInitials(friend.friend.firstName, friend.friend.lastName)}
                          </Text>
                          <View style={styles.onlineFriendDot} />
                        </View>
                        <Text style={[styles.onlineFriendName, { color: colors.text }]} numberOfLines={1}>
                          {friend.friend.firstName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <FlatList
                data={filteredConversations()}
                keyExtractor={(item) => item.userId}
                renderItem={renderConversation}
                contentContainerStyle={styles.convList}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
                }
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
            // CHAT AREA
            <View style={[styles.chatArea, { backgroundColor: colors.background }]}>
              <View style={[styles.chatHeader, { backgroundColor: colors.card }]}>
                <TouchableOpacity onPress={goBackToList} style={styles.backBtn}>
                  <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.contactInfo} onPress={viewProfile}>
                  <View
                    style={[
                      styles.avatarLarge,
                      { backgroundColor: getAvatarColor(selectedContact?.firstName || '') },
                    ]}
                  >
                    <Text style={styles.avatarLargeText}>
                      {getInitials(selectedContact?.firstName, selectedContact?.lastName)}
                    </Text>
                    {selectedContact?.isOnline && <View style={styles.headerOnlineDot} />}
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

              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={scrollToBottom}
              />

              <View style={[styles.messageInputArea, { backgroundColor: colors.card }]}>
                <TouchableOpacity onPress={() => setShowEmojiPicker(!showEmojiPicker)}>
                  <Ionicons name="happy-outline" size={24} color={COLORS.gray500} />
                </TouchableOpacity>
                <TouchableOpacity onPress={uploadFile}>
                  <Ionicons name="attach-outline" size={24} color={COLORS.gray500} />
                </TouchableOpacity>
                <TouchableOpacity onPress={startVoiceRecording}>
                  <Ionicons
                    name={isRecording ? 'mic' : 'mic-outline'}
                    size={24}
                    color={isRecording ? COLORS.error : COLORS.gray500}
                  />
                </TouchableOpacity>
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

              {showEmojiPicker && (
                <View style={[styles.emojiPicker, { backgroundColor: colors.card }]}>
                  <FlatList
                    data={EMOJIS}
                    keyExtractor={(item) => item}
                    numColumns={8}
                    renderItem={({ item }) => (
                      <TouchableOpacity style={styles.emojiItem} onPress={() => sendEmoji(item)}>
                        <Text style={styles.emojiText}>{item}</Text>
                      </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.emojiGrid}
                  />
                  <TouchableOpacity
                    style={styles.emojiClose}
                    onPress={() => setShowEmojiPicker(false)}
                  >
                    <Text style={styles.emojiCloseText}>Fermer</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* PANEL AMIS EN LIGNE */}
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

        {renderCallModal()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  chatLayout: { flex: 1, flexDirection: 'row' },

  // ── CONVERSATIONS PANEL ──
  conversationsPanel: {
    width: 320,
    borderRightWidth: 0.5,
    borderRightColor: COLORS.gray200,
    display: 'flex',
    flexDirection: 'column',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray200,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    marginLeft: 8,
  },
  onlineSection: {
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray200,
  },
  onlineSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  onlineScrollContent: { paddingRight: 8 },
  onlineFriendCard: { alignItems: 'center', marginRight: 12, width: 56 },
  onlineFriendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  onlineFriendAvatarText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
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
  onlineFriendName: { fontSize: 11, marginTop: 4, textAlign: 'center' },
  convList: { padding: 8 },
  convItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    marginBottom: 2,
  },
  convItemActive: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    paddingLeft: 7,
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
  chatArea: { flex: 1, flexDirection: 'column' },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray200,
  },
  backBtn: { padding: 4 },
  contactInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  avatarLarge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarLargeText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  headerOnlineDot: {
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
  contactName: { fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
  contactStatus: { fontSize: 12, marginLeft: 10 },
  typingText: { color: COLORS.primary, fontStyle: 'italic' },
  onlineText: { color: COLORS.success },
  offlineText: { color: COLORS.gray400 },
  chatActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 4 },
  messagesList: { padding: 12, paddingBottom: 20 },
  messageRow: { marginVertical: 4 },
  rowRight: { alignItems: 'flex-end' },
  rowLeft: { alignItems: 'flex-start' },
  bubble: {
    maxWidth: '75%',
    padding: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  bubbleRight: { borderBottomRightRadius: 4 },
  bubbleLeft: { borderBottomLeftRadius: 4 },
  messageText: { fontSize: 14 },
  time: { fontSize: 10, marginTop: 4, opacity: 0.65, alignSelf: 'flex-end' },
  imageMessage: { borderRadius: 12, overflow: 'hidden', position: 'relative' },
  messageImage: { width: 200, height: 150, borderRadius: 12 },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 6,
  },
  fileMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
    minWidth: 160,
  },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 13, fontWeight: '500' },
  fileSize: { fontSize: 11, marginTop: 2 },
  moneyMessage: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  moneyText: { fontSize: 14, fontWeight: '600' },

  // ── MESSAGE INPUT ──
  messageInputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 12,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.gray200,
    gap: 6,
  },
  messageInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    maxHeight: 100,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.45 },

  // ── EMOJI PICKER ──
  emojiPicker: {
    position: 'absolute',
    bottom: 70,
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
  emojiItem: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
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
    width: 220,
    borderLeftWidth: 0.5,
    borderLeftColor: COLORS.gray200,
    padding: 12,
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
  onlineFriendNameText: { fontSize: 13, fontWeight: '500' },

  // ── EMPTY STATE ──
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 15, marginTop: 12 },
  emptyBtn: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  emptyBtnText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },

  // ── CALL MODAL ──
  callModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callContent: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: width * 0.85,
  },
  callAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  callAvatarText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 32,
  },
  callName: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  callStatusText: { fontSize: 14, color: COLORS.gray400, marginBottom: 24 },
  callActions: { flexDirection: 'row', gap: 20, alignItems: 'center' },
  callBtn: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  callBtnAccept: { backgroundColor: COLORS.success },
  callBtnReject: { backgroundColor: COLORS.error },
  callBtnMute: { backgroundColor: COLORS.gray600 },
  callBtnSpeaker: { backgroundColor: COLORS.gray600 },
});