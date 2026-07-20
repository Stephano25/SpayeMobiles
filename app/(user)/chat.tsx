// app/(user)/chat.tsx
// ─────────────────────────────────────────────────────────────
//  SPAYE · Chat Screen — Version complète
//  ✅ Messages vocaux (lecture Web + Mobile)
//  ✅ Envoi de fichiers (images, vidéos, documents)
//  ✅ Statut en ligne stable (socket prioritaire)
//  ✅ Appels audio/vidéo avec fallback pour Expo Go
// ─────────────────────────────────────────────────────────────

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  Modal, StatusBar, Dimensions, Alert, Image, ScrollView,
  RefreshControl, Share, Linking, AppState, PermissionsAndroid,
  Pressable, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Audio, Video, ResizeMode } from 'expo-av';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { ChatService } from '../../src/services/ChatService';
import { FriendService } from '../../src/services/FriendService';
import { 
  COLORS, 
  formatTime, 
  getInitials, 
  getAvatarColor, 
  formatAmount,
  formatFileSize,
  getFileType,
  isImageFile,
  isVideoFile,
  isAudioFile,
  getFileIcon,
  T,
} from '../../src/config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../../src/services/TranslationService';

// ─── Imports WebRTC avec vérification ────────────────────────
let RTCPeerConnection: any = null;
let RTCSessionDescription: any = null;
let RTCIceCandidate: any = null;
let mediaDevices: any = null;
let MediaStream: any = null;
let RTCView: any = null;
let isWebRTCAvailable = false;

try {
  const webrtc = require('react-native-webrtc');
  RTCPeerConnection = webrtc.RTCPeerConnection;
  RTCSessionDescription = webrtc.RTCSessionDescription;
  RTCIceCandidate = webrtc.RTCIceCandidate;
  mediaDevices = webrtc.mediaDevices;
  MediaStream = webrtc.MediaStream;
  RTCView = webrtc.RTCView;
  isWebRTCAvailable = true;
  console.log('✅ WebRTC chargé avec succès');
} catch (error) {
  console.warn('⚠️ WebRTC non disponible, mode simulation pour Expo Go');
  isWebRTCAvailable = false;
}

const { width } = Dimensions.get('window');

// ─── Quick emojis ─────────────────────────────────────────────
const QUICK_REACTIONS = ['👍', '❤️', '😆', '😮', '😢', '🙏'];
const EMOJIS = [
  '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰',
  '😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏',
  '😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠',
  '😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥',
  '😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐',
  '🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','💀','👻','👽',
  '🤖','💩','😺','😸','😹','😻','😼','😽','🙀','😿','😾','🙈','🙉','🙊','💋','💌',
  '💘','💝','💖','💗','💓','💞','💕','💟','❣️','💔','❤️','🧡','💛','💚','💙','💜',
  '🤎','🖤','🤍','💯','💢','💥','💫','💦','💨','💣','💬','👁️','🗣️','👤','👥',
];

// ─── Types ─────────────────────────────────────────────────────
interface CallData { 
  from: string; 
  type: 'audio'|'video'; 
  fromName?: string;
  offer?: any;
}

// ═══════════════════════════════════════════════════════════════
//  Avatar
// ═══════════════════════════════════════════════════════════════
const Avatar = ({ name = '', size = 40, online = false }: { name?: string; size?: number; online?: boolean }) => (
  <View style={[avStyles.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: getAvatarColor(name) }]}>
    <Text style={[avStyles.initials, { fontSize: size * 0.36 }]}>
      {getInitials(name.split(' ')[0] || '', name.split(' ')[1] || '')}
    </Text>
    <View style={[
      avStyles.dot, 
      { 
        width: size * 0.28, 
        height: size * 0.28, 
        borderRadius: size * 0.14,
        backgroundColor: online ? T.success : T.text4,
        borderWidth: 2,
        borderColor: T.surface,
      }
    ]} />
  </View>
);

const avStyles = StyleSheet.create({
  wrap:     { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  initials: { color: T.white, fontWeight: '700' },
  dot:      { position: 'absolute', bottom: 0, right: 0 },
});

// ═══════════════════════════════════════════════════════════════
//  IconBtn
// ═══════════════════════════════════════════════════════════════
const IconBtn = ({ name, size = 22, color = T.text3, onPress, recording = false, style }: any) => (
  <TouchableOpacity
    onPress={onPress}
    style={[ib.btn, recording && ib.recording, style]}
    activeOpacity={0.7}
  >
    <Ionicons name={name} size={size} color={recording ? '#f87171' : color} />
  </TouchableOpacity>
);

const ib = StyleSheet.create({
  btn:       { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  recording: { backgroundColor: 'rgba(239,68,68,0.15)' },
});

// ═══════════════════════════════════════════════════════════════
//  MediaMessage
// ═══════════════════════════════════════════════════════════════
const MediaMessage = React.memo(({ item, isOwn }: { item: any; isOwn: boolean }) => {
  const [sound, setSound]       = useState<Audio.Sound | null>(null);
  const [playing, setPlaying]   = useState(false);
  const [duration, setDuration] = useState(0);
  const [pos, setPos]           = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const BASE = 'https://astonish-uneaten-either.ngrok-free.dev';
  const url  = item.fileUrl?.startsWith('http') ? item.fileUrl : `${BASE}${item.fileUrl}`;
  const kind = getFileType(item.fileUrl || '', item.fileName || '');

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(() => {});
      }
    };
  }, [sound]);

  const playAudio = async () => {
    try {
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await sound.pauseAsync();
            setPlaying(false);
            return;
          } else {
            await sound.playAsync();
            setPlaying(true);
            return;
          }
        }
      }

      setIsLoading(true);
      const { sound: newSound, status } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true }
      );

      setSound(newSound);
      setPlaying(true);
      setDuration((status as any).durationMillis || 0);

      newSound.setOnPlaybackStatusUpdate((st: any) => {
        if (st.isLoaded) {
          setPos(st.positionMillis || 0);
          if (st.didJustFinish) {
            setPlaying(false);
            setPos(0);
          }
        }
      });

      setIsLoading(false);
    } catch (error) {
      console.error('❌ Erreur lecture audio:', error);
      setIsLoading(false);
      Alert.alert('Erreur', 'Impossible de lire l\'audio');
    }
  };

  const fmtMs = (ms: number) => {
    if (!ms || isNaN(ms)) return '0:00';
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  };

  // ── Image ──
  if (kind === 'image') return (
    <TouchableOpacity onPress={() => Linking.openURL(url)} style={mm.mediaWrap}>
      <Image source={{ uri: url }} style={mm.img} resizeMode="cover" />
      <View style={mm.dlOverlay}>
        <TouchableOpacity onPress={() => Share.share({ url })} style={mm.dlBtn}>
          <Ionicons name="share-outline" size={16} color={T.white} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // ── Video ──
  if (kind === 'video') return (
    <View style={mm.mediaWrap}>
      <Video 
        source={{ uri: url }} 
        style={mm.video} 
        resizeMode={ResizeMode.CONTAIN}
        useNativeControls 
        isLooping={false} 
        shouldPlay={false} 
      />
    </View>
  );

  // ── Audio ──
  if (kind === 'audio') {
    const progress = pos > 0 && duration > 0 ? (pos / duration) * 100 : 0;
    
    return (
      <View style={[mm.audioWrap, { backgroundColor: isOwn ? 'rgba(99,102,241,0.2)' : T.surface2 }]}>
        <TouchableOpacity 
          onPress={playAudio} 
          style={mm.audioBtn}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={isOwn ? T.white : T.violet} />
          ) : (
            <Ionicons name={playing ? 'pause' : 'play'} size={20} color={isOwn ? T.white : T.violet} />
          )}
        </TouchableOpacity>
        <View style={mm.audioBar}>
          <View style={[
            mm.audioFill, 
            { 
              width: `${Math.min(progress, 100)}%`,
              backgroundColor: isOwn ? T.white : T.primary 
            }
          ]} />
        </View>
        <Text style={[mm.audioDur, { color: isOwn ? 'rgba(255,255,255,0.75)' : T.text4 }]}>
          {duration > 0 ? fmtMs(duration) : '0:00'}
        </Text>
      </View>
    );
  }

  // ── Document ──
  return (
    <TouchableOpacity onPress={() => Linking.openURL(url)}
      style={[mm.docWrap, { backgroundColor: isOwn ? 'rgba(255,255,255,0.1)' : T.surface2 }]}>
      <View style={mm.docIconWrap}>
        <Ionicons name={getFileIcon(item.fileName)} size={26} color={isOwn ? T.white : T.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[mm.docName, { color: isOwn ? T.white : T.text }]} numberOfLines={1}>
          {item.fileName || 'Document'}
        </Text>
        <Text style={[mm.docSize, { color: isOwn ? 'rgba(255,255,255,0.6)' : T.text4 }]}>
          {formatFileSize(item.fileSize)}
        </Text>
      </View>
      <Ionicons name="download-outline" size={18} color={isOwn ? T.white : T.violet} />
    </TouchableOpacity>
  );
});

const mm = StyleSheet.create({
  mediaWrap:  { borderRadius: 12, overflow: 'hidden', position: 'relative', maxWidth: 220 },
  img:        { width: 220, height: 160, borderRadius: 12 },
  video:      { width: 220, height: 150, borderRadius: 12 },
  dlOverlay:  { position: 'absolute', top: 6, right: 6, flexDirection: 'row', gap: 4 },
  dlBtn:      { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 16, padding: 5 },
  audioWrap:  { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderRadius: 12, minWidth: 190 },
  audioBtn:   { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(99,102,241,0.2)', alignItems: 'center', justifyContent: 'center' },
  audioBar:   { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 2, overflow: 'hidden' },
  audioFill:  { height: '100%', borderRadius: 2 },
  audioDur:   { fontSize: 11, minWidth: 36 },
  docWrap:    { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12, minWidth: 180 },
  docIconWrap:{ width: 38, height: 38, borderRadius: 8, backgroundColor: 'rgba(99,102,241,0.15)', alignItems: 'center', justifyContent: 'center' },
  docName:    { fontSize: 13, fontWeight: '600' },
  docSize:    { fontSize: 11, marginTop: 2 },
});

// ═══════════════════════════════════════════════════════════════
//  MoneyCard
// ═══════════════════════════════════════════════════════════════
const MoneyCard = ({ item, isOwn }: { item: any; isOwn: boolean }) => {
  const status = item.moneyTransfer?.status || 'pending';
  const borderColor = status === 'completed' ? 'rgba(16,185,129,0.3)'
    : status === 'failed'    ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)';
  const bg = status === 'completed' ? 'rgba(16,185,129,0.07)'
    : status === 'failed'    ? 'rgba(239,68,68,0.07)' : 'rgba(245,158,11,0.07)';

  return (
    <View style={[mc.card, { borderColor, backgroundColor: bg }]}>
      <View style={[mc.iconWrap, { backgroundColor: status === 'completed' ? '#10b981' : status === 'failed' ? '#ef4444' : '#6366f1' }]}>
        <Ionicons name={status === 'failed' ? 'alert-circle' : 'cash'} size={20} color={T.white} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[mc.amt, { color: isOwn ? T.white : T.text }]}>
          {formatAmount(item.moneyTransfer?.amount || 0)} Ar
        </Text>
        <Text style={[mc.lbl, {
          color: status === 'completed' ? T.success : status === 'failed' ? T.error : T.warning,
        }]}>
          {status === 'completed' ? '✅ Transfert réussi'
           : status === 'failed'  ? `❌ ${item.moneyTransfer?.failReason || 'Échec'}`
                                  : '⏳ En cours…'}
        </Text>
      </View>
    </View>
  );
};

const mc = StyleSheet.create({
  card:     { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, borderWidth: 1, minWidth: 180 },
  iconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  amt:      { fontSize: 15, fontWeight: '700' },
  lbl:      { fontSize: 12, marginTop: 2 },
});

// ═══════════════════════════════════════════════════════════════
//  ÉCRAN PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function ChatScreen() {
  const insets           = useSafeAreaInsets();
  const navigation       = useNavigation();
  const route            = useRoute();
  const { user, getToken } = useAuth();
  const { showError, showSuccess, showInfo, showWarning } = useNotification();
  const { t }            = useTranslation();
  const userId           = (route.params as any)?.userId as string | undefined;

  // ── State ──────────────────────────────────────────────────
  const [conversations, setConversations]         = useState<any[]>([]);
  const [messages, setMessages]                   = useState<any[]>([]);
  const [selectedContact, setSelectedContact]     = useState<any>(null);
  const [currentUserId, setCurrentUserId]         = useState('');
  const [newMessage, setNewMessage]               = useState('');
  const [isTyping, setIsTyping]                   = useState(false);
  const [onlineFriends, setOnlineFriends]         = useState<any[]>([]);
  const [allFriends, setAllFriends]               = useState<any[]>([]);
  const [searchQuery, setSearchQuery]             = useState('');
  const [showEmojiPicker, setShowEmojiPicker]     = useState(false);
  const [isSending, setIsSending]                 = useState(false);
  const [loading, setLoading]                     = useState(true);
  const [refreshing, setRefreshing]               = useState(false);
  const [view, setView]                           = useState<'list'|'chat'>('list');
  const [showTransfer, setShowTransfer]           = useState(false);
  const [transferAmount, setTransferAmount]       = useState('');
  const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000];
  const [activeCtxId, setActiveCtxId]             = useState<string|null>(null);
  const [editingId, setEditingId]                 = useState<string|null>(null);
  const [editContent, setEditContent]             = useState('');
  const [reactPickerId, setReactPickerId]         = useState<string|null>(null);
  const [incomingCall, setIncomingCall]           = useState<CallData|null>(null);
  const [callStatus, setCallStatus]               = useState<'idle'|'calling'|'connected'|'ended'>('idle');
  const [callType, setCallType]                   = useState<'audio'|'video'>('audio'); // ✅ Corrigé
  const [isCalling, setIsCalling]                 = useState(false);
  const [isOnlineUpdating, setIsOnlineUpdating]   = useState(false);
  const [isMuted, setIsMuted]                     = useState(false);
  const [isCameraOff, setIsCameraOff]             = useState(false);
  const [callTimer, setCallTimer]                 = useState(0);
  const [isSimulationMode, setIsSimulationMode]   = useState(!isWebRTCAvailable);
  
  // États pour l'enregistrement audio
  const [recording, setRecording]                 = useState<Audio.Recording | null>(null);
  const [isRecordingAudio, setIsRecordingAudio]   = useState(false);
  const [recordingDuration, setRecordingDuration]  = useState(0);

  // Refs pour WebRTC
  const localStreamRef = useRef<any>(null);
  const remoteStreamRef = useRef<any>(null);
  const peerConnectionRef = useRef<any>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  const flatListRef       = useRef<FlatList>(null);
  const typingTimeout     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordInterval    = useRef<ReturnType<typeof setInterval> | null>(null);
  const unsubMsg          = useRef<(()=>void)|null>(null);
  const unsubTyping       = useRef<(()=>void)|null>(null);
  const unsubOnline       = useRef<(()=>void)|null>(null);
  const unsubCall         = useRef<(()=>void)|null>(null);
  const unsubErr          = useRef<(()=>void)|null>(null);

  // ── Init ──────────────────────────────────────────────────
  useEffect(() => {
    setCurrentUserId(user?.id || '');
    
    const init = async () => {
      try {
        const token = await getToken();
        if (token) {
          await ChatService.connect(token);
        }
        await loadAll();
        setupSockets();
        ChatService.requestOnlineUsers();
      } catch (error) {
        console.error('❌ Erreur init:', error);
        showError(t('error_loading'));
      } finally {
        setLoading(false);
      }
    };
    init();

    const sub = AppState.addEventListener('change', async (state) => {
      if (state === 'active') {
        try {
          const token = await getToken();
          if (token && !ChatService.isConnected()) {
            await ChatService.connect(token);
          }
          ChatService.requestOnlineUsers();
          await loadOnline();
        } catch (error) {
          console.error('Erreur reconnexion socket:', error);
        }
      }
    });

    const interval = setInterval(() => {
      if (ChatService.isConnected()) {
        ChatService.requestOnlineUsers();
        loadOnline();
      }
    }, 30000);

    return () => {
      sub.remove();
      clearInterval(interval);
      unsubMsg.current?.();
      unsubTyping.current?.();
      unsubOnline.current?.();
      unsubCall.current?.();
      unsubErr.current?.();
      if (recordInterval.current) clearInterval(recordInterval.current);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      endCall();
    };
  }, []);

  useEffect(() => {
    if (userId && conversations.length > 0) {
      const ex = conversations.find(c => c.userId === userId);
      ex ? selectConv(ex) : startChat(userId);
    }
  }, [userId, conversations]);

  useEffect(() => {
    const focusListener = navigation.addListener('focus', () => {
      if (ChatService.isConnected()) {
        ChatService.requestOnlineUsers();
        loadOnline();
      }
    });

    return focusListener;
  }, [navigation]);

  // ── Data ──────────────────────────────────────────────────
  const loadAll = async () => {
    await Promise.all([loadConvs(), loadFriends(), loadOnline()]);
  };

  const loadConvs = async () => {
    try {
      const c = await ChatService.getConversations();
      setConversations((c || []).sort((a: any, b: any) =>
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()));
    } catch (error) {
      console.error('❌ Erreur loadConvs:', error);
    }
  };

  const loadFriends = async () => {
    try {
      const f = await FriendService.getFriends();
      setAllFriends(f.filter((x: any) => x.status === 'accepted'));
    } catch (error) {
      console.error('❌ Erreur loadFriends:', error);
    }
  };

  const loadOnline = async () => {
    if (isOnlineUpdating) {
      console.log('⏳ Mise à jour socket en cours, loadOnline ignoré');
      return;
    }
    
    try {
      const f = await FriendService.getFriends();
      const online = f.filter((x: any) => x.status === 'accepted' && x.friend?.isOnline === true);
      setOnlineFriends(online);
      
      setConversations(prev => {
        const updated = prev.map(c => {
          const friend = online.find((f: any) => f.friend?.id === c.userId);
          const isOnline = !!friend;
          if (c.isOnline !== isOnline) {
            console.log(`🔄 Conversation mise à jour loadOnline: ${c.firstName} -> ${isOnline}`);
          }
          return { ...c, isOnline };
        });
        return updated;
      });
      
      if (selectedContact) {
        const friend = online.find((f: any) => f.friend?.id === selectedContact.userId);
        const isOnline = !!friend;
        if (selectedContact.isOnline !== isOnline) {
          console.log(`🔄 Contact sélectionné mis à jour loadOnline: ${selectedContact.firstName} -> ${isOnline}`);
          setSelectedContact(prev => ({ ...prev, isOnline }));
        }
      }
    } catch (error) {
      console.error('❌ Erreur loadOnline:', error);
    }
  };

  // ── Sockets ───────────────────────────────────────────────
  const setupSockets = () => {
    unsubMsg.current?.(); unsubTyping.current?.();
    unsubOnline.current?.(); unsubCall.current?.(); unsubErr.current?.();

    unsubMsg.current = ChatService.onNewMessage(msg => handleNewMsg(msg));

    unsubTyping.current = ChatService.onTyping(data => {
      if (data && selectedContact && data.userId === selectedContact.userId) {
        setIsTyping(data.isTyping);
      }
    });

    unsubOnline.current = ChatService.onOnlineStatus(data => {
      if (!data) return;
      
      setIsOnlineUpdating(true);
      
      console.log(`🟢 Statut en ligne reçu: ${data.userId} -> ${data.isOnline}`);
      
      setConversations(prev => {
        const updated = prev.map(c => {
          if (c.userId === data.userId) {
            console.log(`🔄 Conversation mise à jour: ${c.firstName} -> ${data.isOnline}`);
            return { ...c, isOnline: data.isOnline };
          }
          return c;
        });
        return updated;
      });
      
      if (selectedContact && selectedContact.userId === data.userId) {
        console.log(`🔄 Contact sélectionné mis à jour: ${selectedContact.firstName} -> ${data.isOnline}`);
        setSelectedContact(prev => ({ 
          ...prev, 
          isOnline: data.isOnline 
        }));
      }
      
      setOnlineFriends(prev => {
        const exists = prev.some(f => f.friend?.id === data.userId);
        if (data.isOnline && !exists) {
          const friend = allFriends.find(f => f.friend?.id === data.userId);
          if (friend) {
            return [...prev, friend];
          }
        } else if (!data.isOnline) {
          return prev.filter(f => f.friend?.id !== data.userId);
        }
        return prev;
      });
      
      setTimeout(() => {
        setIsOnlineUpdating(false);
      }, 500);
    });

    unsubCall.current = ChatService.onCall(data => {
      console.log('📞 Événement appel reçu:', data);
      
      // Appel entrant
      if (data.from && data.offer) {
        const fr = allFriends.find((f: any) => f.friend?.id === data.from);
        setIncomingCall({ 
          from: data.from, 
          type: data.type || 'audio', 
          fromName: fr?.friend?.firstName || 'Inconnu',
          offer: data.offer
        });
        setCallStatus('idle');
        showInfo(`📞 Appel ${data.type || 'audio'} entrant de ${fr?.friend?.firstName || 'Inconnu'}`);
        playCallSound();
      } 
      // Réponse à un appel
      else if (data.accepted !== undefined) {
        if (data.accepted) {
          if (data.answer) {
            handleCallAnswer(data.answer);
          }
          setCallStatus('connected');
          showInfo('📞 Appel accepté');
          startCallTimer();
        } else {
          setCallStatus('ended');
          setIsCalling(false);
          setIncomingCall(null);
          showInfo('📞 Appel refusé');
        }
      }
      // Candidat ICE
      else if (data.candidate) {
        handleIceCandidate(data.candidate);
      }
      // Signal WebRTC
      else if (data.signal) {
        handleCallSignal(data.signal);
      }
      // Fin d'appel
      else if (data.ended) {
        endCall();
        showInfo('📞 Appel terminé par l\'autre utilisateur');
      }
    });

    unsubErr.current = ChatService.onError(err => {
      console.error('❌ Erreur socket:', err);
      showError(err?.message || 'Erreur de connexion');
    });
  };

  // ── Message handlers ──────────────────────────────────────
  const handleNewMsg = useCallback((msg: any) => {
    if (selectedContact && msg.senderId === selectedContact.userId) {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      scrollBottom();
      ChatService.markAsRead(selectedContact.userId);
    }
    setConversations(prev => {
      const idx = prev.findIndex(c => c.userId === msg.senderId);
      if (idx === -1) return prev;
      const updated = { ...prev[idx],
        lastMessage: { content: msg.content || msg.emoji || '[Média]', type: msg.type, createdAt: msg.createdAt },
        lastMessageTime: msg.createdAt,
        unreadCount: selectedContact?.userId !== msg.senderId ? (prev[idx].unreadCount || 0) + 1 : 0,
      };
      const arr = [...prev]; arr[idx] = updated;
      return arr.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
    });
  }, [selectedContact]);

  // ── Appels WebRTC ─────────────────────────────────────────

  const checkWebRTC = () => {
    return isWebRTCAvailable && RTCPeerConnection !== null && Platform.OS !== 'web';
  };

  const startCall = async (type: 'audio' | 'video') => {
    if (!selectedContact) return;
    if (!selectedContact.isOnline) { 
      showWarning(t('offline')); 
      return; 
    }

    setCallType(type);
    setCallStatus('calling');
    setIsCalling(true);

    try {
      const hasWebRTC = checkWebRTC();
      
      if (!hasWebRTC) {
        console.log('📞 Mode simulation pour appel', type);
        setIsSimulationMode(true);
        showInfo(`📞 Appel ${type} en cours... (simulation)`);
        
        ChatService.startCall(selectedContact.userId, type, { simulation: true });
        
        setTimeout(() => {
          if (callStatus === 'calling') {
            setCallStatus('connected');
            showInfo('📞 Appel connecté (simulation)');
            startCallTimer();
          }
        }, 3000);
        return;
      }

      setIsSimulationMode(false);
      console.log('📞 Démarrage appel WebRTC', type);

      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
        ],
        iceCandidatePoolSize: 10,
      };

      const pc = new RTCPeerConnection(configuration);
      peerConnectionRef.current = pc;

      pc.onicecandidate = (event: any) => {
        if (event.candidate) {
          console.log('🧊 Candidat ICE envoyé');
          ChatService.sendIceCandidate(selectedContact.userId, event.candidate);
        }
      };

      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        console.log('🔗 ICE Connection State:', state);
        if (state === 'disconnected' || state === 'failed' || state === 'closed') {
          endCall();
        }
      };

      pc.ontrack = (event: any) => {
        console.log('📹 Track distant reçu');
        if (event.streams && event.streams[0]) {
          remoteStreamRef.current = event.streams[0];
          setCallStatus('connected');
          showInfo('📞 Appel connecté');
        }
      };

      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video' ? {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        } : false,
      });

      localStreamRef.current = stream;

      stream.getTracks().forEach((track: any) => {
        pc.addTrack(track, stream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      ChatService.startCall(selectedContact.userId, type, offer);
      startCallTimer();

    } catch (error) {
      console.error('❌ Erreur démarrage appel:', error);
      showError('Impossible de démarrer l\'appel');
      endCall();
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;

    try {
      const hasWebRTC = checkWebRTC();

      if (!hasWebRTC) {
        console.log('📞 Mode simulation acceptation appel');
        setIsSimulationMode(true);
        setCallStatus('connected');
        ChatService.answerCall(incomingCall.from, true);
        setIncomingCall(null);
        showInfo('📞 Appel accepté (simulation)');
        startCallTimer();
        return;
      }

      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
        ],
        iceCandidatePoolSize: 10,
      };

      const pc = new RTCPeerConnection(configuration);
      peerConnectionRef.current = pc;

      pc.onicecandidate = (event: any) => {
        if (event.candidate) {
          console.log('🧊 Candidat ICE envoyé');
          ChatService.sendIceCandidate(incomingCall.from, event.candidate);
        }
      };

      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        console.log('🔗 ICE Connection State:', state);
        if (state === 'disconnected' || state === 'failed' || state === 'closed') {
          endCall();
        }
      };

      pc.ontrack = (event: any) => {
        console.log('📹 Track distant reçu');
        if (event.streams && event.streams[0]) {
          remoteStreamRef.current = event.streams[0];
          setCallStatus('connected');
          showInfo('📞 Appel connecté');
        }
      };

      if (incomingCall.offer && !incomingCall.offer.simulation) {
        await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      }

      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: incomingCall.type === 'video' ? {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        } : false,
      });

      localStreamRef.current = stream;

      stream.getTracks().forEach((track: any) => {
        pc.addTrack(track, stream);
      });

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      ChatService.answerCall(incomingCall.from, true, answer);
      setIncomingCall(null);
      startCallTimer();

    } catch (error) {
      console.error('❌ Erreur acceptation appel:', error);
      showError('Impossible de répondre à l\'appel');
      rejectCall();
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      ChatService.answerCall(incomingCall.from, false);
      setIncomingCall(null);
      setCallStatus('ended');
      setIsCalling(false);
      showInfo('📞 Appel refusé');
    }
  };

  const endCall = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track: any) => track.stop());
      localStreamRef.current = null;
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track: any) => track.stop());
      remoteStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setCallStatus('ended');
    setIsCalling(false);
    setIncomingCall(null);
    setCallTimer(0);

    if (selectedContact) {
      ChatService.endCall(selectedContact.userId);
    }
  };

  const handleCallAnswer = async (answer: any) => {
    if (peerConnectionRef.current && answer) {
      try {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
        setCallStatus('connected');
      } catch (error) {
        console.error('❌ Erreur setRemoteDescription:', error);
      }
    }
  };

  const handleIceCandidate = async (candidate: any) => {
    if (peerConnectionRef.current && candidate) {
      try {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } catch (error) {
        console.error('❌ Erreur addIceCandidate:', error);
      }
    }
  };

  const handleCallSignal = async (signal: any) => {
    if (peerConnectionRef.current && signal) {
      try {
        if (signal.type === 'offer') {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(signal)
          );
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          if (incomingCall) {
            ChatService.answerCall(incomingCall.from, true, answer);
          }
        } else if (signal.type === 'answer') {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(signal)
          );
          setCallStatus('connected');
        }
      } catch (error) {
        console.error('❌ Erreur traitement signal:', error);
      }
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track: any) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((track: any) => {
        track.enabled = isCameraOff;
      });
      setIsCameraOff(!isCameraOff);
    }
  };

  const startCallTimer = () => {
    setCallTimer(0);
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    callTimerRef.current = setInterval(() => {
      setCallTimer(prev => prev + 1);
    }, 1000);
  };

  const formatCallTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const playCallSound = () => {
    try {
      // Simuler un son
    } catch (error) {
      console.warn('Son d\'appel non disponible');
    }
  };

  // ── Enregistrement vocal ───────────────────────────────
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        showError('Permission microphone requise');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecordingAudio(true);
      setRecordingDuration(0);

      recordInterval.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      showInfo('🎤 Enregistrement en cours...');
    } catch (error) {
      console.error('❌ Erreur démarrage enregistrement:', error);
      showError('Impossible de démarrer l\'enregistrement');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecordingAudio(false);
      if (recordInterval.current) {
        clearInterval(recordInterval.current);
        recordInterval.current = null;
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (!uri) {
        showError('Erreur lors de l\'enregistrement');
        return;
      }

      const file = {
        uri: uri,
        name: `voice-${Date.now()}.m4a`,
        type: 'audio/m4a',
      };

      await sendAudioMessage(file);

    } catch (error) {
      console.error('❌ Erreur arrêt enregistrement:', error);
      showError('Erreur lors de l\'enregistrement');
    }
  };

  const sendAudioMessage = async (file: any) => {
    if (!selectedContact) return;

    try {
      setIsSending(true);

      const uploadResult = await ChatService.uploadFile(file);

      const tempId = 'temp-audio-' + Date.now();
      const tempMessage = {
        id: tempId,
        senderId: currentUserId,
        receiverId: selectedContact.userId,
        type: 'audio',
        fileUrl: uploadResult.url,
        fileName: uploadResult.fileName || file.name,
        fileSize: uploadResult.fileSize || 0,
        mimeType: uploadResult.mimeType || file.type,
        isRead: false,
        isDelivered: false,
        createdAt: new Date().toISOString(),
        duration: recordingDuration,
      };

      setMessages(prev => [...prev, tempMessage]);
      scrollBottom();

      await ChatService.sendMessage({
        receiverId: selectedContact.userId,
        type: 'audio',
        fileUrl: uploadResult.url,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        mimeType: uploadResult.mimeType,
        duration: recordingDuration,
      });

      showSuccess('Message vocal envoyé');
    } catch (error) {
      console.error('❌ Erreur envoi audio:', error);
      showError('Erreur lors de l\'envoi du message vocal');
    } finally {
      setIsSending(false);
    }
  };

  const toggleVoiceRecording = () => {
    if (isRecordingAudio) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // ── Upload fichier ──────────────────────────────────────
  const uploadFile = async () => {
    if (!selectedContact) return;
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      const fileType = asset.type || 'image/jpeg';
      
      let type: 'image' | 'video' | 'file' = 'file';
      if (fileType.startsWith('image/')) type = 'image';
      else if (fileType.startsWith('video/')) type = 'video';

      if (asset.fileSize && asset.fileSize > 150 * 1024 * 1024) {
        showError('Fichier trop volumineux (max 150 Mo)');
        return;
      }

      setIsSending(true);

      const file = {
        uri: asset.uri,
        name: asset.fileName || `file-${Date.now()}.${asset.uri.split('.').pop() || 'jpg'}`,
        type: fileType,
        size: asset.fileSize || 0,
      };

      const uploadResult = await ChatService.uploadFile(file);

      const tempId = 'temp-file-' + Date.now();
      const tempMessage = {
        id: tempId,
        senderId: currentUserId,
        receiverId: selectedContact.userId,
        type: type,
        fileUrl: uploadResult.url,
        fileName: uploadResult.fileName || file.name,
        fileSize: uploadResult.fileSize || file.size,
        mimeType: uploadResult.mimeType || file.type,
        isRead: false,
        isDelivered: false,
        createdAt: new Date().toISOString(),
      };

      setMessages(prev => [...prev, tempMessage]);
      scrollBottom();

      await ChatService.sendMessage({
        receiverId: selectedContact.userId,
        type: type,
        fileUrl: uploadResult.url,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        mimeType: uploadResult.mimeType,
      });

      showSuccess('Fichier envoyé');
    } catch (error) {
      console.error('❌ Erreur upload:', error);
      showError('Erreur lors de l\'upload');
    } finally {
      setIsSending(false);
    }
  };

  // ── Envoyer message ──────────────────────────────────────
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedContact || isSending) return;
    
    setIsSending(true);
    const content = newMessage.trim();
    
    const tempId = 'temp-' + Date.now();
    const tempMessage = {
      id: tempId,
      senderId: currentUserId,
      receiverId: selectedContact.userId,
      type: 'text',
      content: content,
      isRead: false,
      isDelivered: false,
      createdAt: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    scrollBottom();

    try {
      await ChatService.sendMessage({
        receiverId: selectedContact.userId,
        type: 'text',
        content: content,
      });
      ChatService.sendTyping(selectedContact.userId, false);
    } catch (error) {
      console.error('❌ Erreur envoi:', error);
      showError(t('error'));
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  // ── Envoyer emoji ──────────────────────────────────────────
  const sendEmoji = (emoji: string) => {
    if (!selectedContact) return;
    
    const tempId = 'temp-emoji-' + Date.now();
    const tempMessage = {
      id: tempId,
      senderId: currentUserId,
      receiverId: selectedContact.userId,
      type: 'emoji',
      emoji: emoji,
      isRead: false,
      isDelivered: false,
      createdAt: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, tempMessage]);
    scrollBottom();
    
    ChatService.sendMessage({
      receiverId: selectedContact.userId,
      type: 'emoji',
      emoji: emoji,
    }).catch(error => {
      console.error('❌ Erreur envoi emoji:', error);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    });
    
    setShowEmojiPicker(false);
  };

  // ── Transfert ─────────────────────────────────────────────
  const confirmTransfer = async () => {
    if (!selectedContact) return;
    const amount = parseFloat(transferAmount);
    if (!amount || amount <= 0) {
      showError('Veuillez entrer un montant valide');
      return;
    }
    
    const tempId = 'temp-money-' + Date.now();
    const tempMessage = {
      id: tempId,
      senderId: currentUserId,
      receiverId: selectedContact.userId,
      type: 'money',
      moneyTransfer: { amount, status: 'pending' },
      isRead: false,
      isDelivered: false,
      createdAt: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, tempMessage]);
    scrollBottom();
    
    try {
      await ChatService.sendMessage({
        receiverId: selectedContact.userId,
        type: 'money',
        moneyTransfer: { amount },
      });
      setShowTransfer(false);
      setTransferAmount('');
      showSuccess(`Transfert de ${formatAmount(amount)} Ar envoyé`);
    } catch (error) {
      console.error('❌ Erreur transfert:', error);
      showError('Erreur lors du transfert');
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  // ── Édition / suppression ──────────────────────────────────
  const startEdit = (msg: any) => {
    setEditingId(msg.id); setEditContent(msg.content || ''); setActiveCtxId(null);
  };

  const saveEdit = async () => {
    if (!editingId || !editContent.trim()) return;
    try {
      await ChatService.updateMessage(editingId, editContent.trim());
      setMessages(prev => prev.map(m => m.id === editingId ? { ...m, content: editContent.trim(), isEdited: true } : m));
      showSuccess('Message modifié');
    } catch (error) {
      console.error('❌ Erreur modification:', error);
      showError('Erreur modification');
    }
    setEditingId(null);
  };

  const deleteMsg = async (msg: any) => {
    Alert.alert('Supprimer', 'Supprimer ce message ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try {
          await ChatService.deleteMessage(msg.id);
          setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isDeleted: true, content: '' } : m));
          showSuccess('Message supprimé');
        } catch (error) {
          console.error('❌ Erreur suppression:', error);
          showError('Erreur suppression');
        }
        setActiveCtxId(null);
      }},
    ]);
  };

  // ── Réactions ─────────────────────────────────────────────
  const toggleReaction = async (msg: any, emoji: string) => {
    const mine = msg.reactions?.find((r: any) => r.userId === currentUserId)?.emoji;
    try {
      let updated;
      if (mine === emoji) {
        updated = await ChatService.removeReaction(msg.id);
      } else {
        updated = await ChatService.reactToMessage(msg.id, emoji);
      }
      if (updated) {
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, ...updated } : m));
      }
    } catch (error) {
      console.error('❌ Erreur réaction:', error);
    }
    setReactPickerId(null); setActiveCtxId(null);
  };

  const onTyping = () => {
    if (!selectedContact) return;
    ChatService.sendTyping(selectedContact.userId, true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      if (selectedContact) ChatService.sendTyping(selectedContact.userId, false);
    }, 1500);
  };

  const scrollBottom = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const filteredConvs = useMemo(() => {
    if (!searchQuery) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  const selectConv = async (conv: any) => {
    setSelectedContact(conv);
    setMessages([]);
    setView('chat');
    setShowTransfer(false);
    setActiveCtxId(null);
    try {
      const msgs = await ChatService.getMessages(conv.userId);
      setMessages((msgs || []).sort((a: any, b: any) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
      scrollBottom();
      await ChatService.markAsRead(conv.userId);
      setConversations(prev => prev.map(c =>
        c.userId === conv.userId ? { ...c, unreadCount: 0 } : c));
    } catch (error) {
      console.error('❌ Erreur selectConv:', error);
      showError(t('error_loading'));
    }
  };

  const startChat = async (friendId: string) => {
    const ex = conversations.find(c => c.userId === friendId);
    if (ex) { selectConv(ex); return; }
    const fr = allFriends.find((f: any) => f.friend?.id === friendId)?.friend;
    if (!fr) { showError(t('error')); return; }
    const nc = {
      userId: fr.id, firstName: fr.firstName, lastName: fr.lastName,
      lastMessage: { content: '', type: 'text', createdAt: new Date() },
      lastMessageTime: new Date().toISOString(), unreadCount: 0, isOnline: fr.isOnline || false,
    };
    setConversations(prev => [nc, ...prev]);
    selectConv(nc);
  };

  // ─────────────────────────────────────────────────────────
  //  RENDU MESSAGE
  // ─────────────────────────────────────────────────────────
  const renderMessage = ({ item }: { item: any }) => {
    const isOwn = item.senderId === currentUserId;
    const showCtx  = activeCtxId === item.id;
    const showReact = reactPickerId === item.id;
    const isEditing = editingId === item.id;
    const canEdit = isOwn && !item.isDeleted && item.type === 'text'
      && Date.now() - new Date(item.createdAt).getTime() < 15 * 60 * 1000;
    const canDel  = isOwn && !item.isDeleted;

    const reactions: Record<string, { count: number; mine: boolean }> = {};
    (item.reactions || []).forEach((r: any) => {
      reactions[r.emoji] = reactions[r.emoji] || { count: 0, mine: false };
      reactions[r.emoji].count++;
      if (r.userId === currentUserId) reactions[r.emoji].mine = true;
    });

    return (
      <View style={[s.msgRow, isOwn ? s.rowR : s.rowL]}>
        <View style={s.msgWrap}>
          {isEditing ? (
            <View style={s.editWrap}>
              <TextInput
                style={s.editInput} value={editContent}
                onChangeText={setEditContent} autoFocus
                onSubmitEditing={saveEdit}
              />
              <TouchableOpacity onPress={saveEdit} style={s.editOk}>
                <Ionicons name="checkmark" size={16} color={T.white} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditingId(null)} style={s.editCancel}>
                <Ionicons name="close" size={16} color={T.text3} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.85}
              onLongPress={() => { setActiveCtxId(item.id === activeCtxId ? null : item.id); setReactPickerId(null); }}
              onPress={() => { setActiveCtxId(null); setReactPickerId(null); }}
            >
              {item.isDeleted ? (
                <View style={s.deletedBubble}>
                  <Ionicons name="remove-circle-outline" size={14} color={T.text4} />
                  <Text style={s.deletedText}>Message supprimé</Text>
                </View>
              ) : (
                <View style={[
                  s.bubble,
                  isOwn ? s.bubbleOwn : s.bubbleOther,
                  item.type === 'emoji' && s.emojiBubble,
                ]}>
                  {item.type === 'text' && (
                    <Text style={[s.bubbleText, isOwn && { color: T.white }]}>{item.content}</Text>
                  )}
                  {item.type === 'emoji' && <Text style={s.bigEmoji}>{item.emoji}</Text>}
                  {['image','video','audio','file'].includes(item.type) && (
                    <MediaMessage item={item} isOwn={isOwn} />
                  )}
                  {item.type === 'money' && <MoneyCard item={item} isOwn={isOwn} />}
                </View>
              )}
            </TouchableOpacity>
          )}

          {Object.keys(reactions).length > 0 && (
            <View style={s.reactBar}>
              {Object.entries(reactions).map(([emoji, v]) => (
                <TouchableOpacity key={emoji} style={[s.reactChip, v.mine && s.reactChipMine]}
                  onPress={() => toggleReaction(item, emoji)}>
                  <Text style={s.reactEmoji}>{emoji}</Text>
                  {v.count > 1 && <Text style={s.reactCount}> {v.count}</Text>}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {!isEditing && (
            <View style={[s.msgMeta, isOwn && { alignSelf: 'flex-end' }]}>
              <Text style={s.msgTime}>{formatTime(item.createdAt)}</Text>
              {item.isEdited && <Text style={s.msgEdited}> · modifié</Text>}
              {isOwn && (
                <Ionicons name={item.isRead ? 'checkmark-done' : 'checkmark'}
                  size={13} color={item.isRead ? T.violet : T.text4} style={{ marginLeft: 3 }} />
              )}
            </View>
          )}

          {showCtx && !item.isDeleted && (
            <View style={[s.ctxMenu, isOwn ? s.ctxMenuR : s.ctxMenuL]}>
              <TouchableOpacity style={s.ctxBtn} onPress={() => {
                setReactPickerId(reactPickerId === item.id ? null : item.id);
              }}>
                <Ionicons name="add-circle-outline" size={15} color={T.text3} />
              </TouchableOpacity>
              {canEdit && (
                <TouchableOpacity style={s.ctxBtn} onPress={() => startEdit(item)}>
                  <Ionicons name="create-outline" size={15} color={T.text3} />
                </TouchableOpacity>
              )}
              {canDel && (
                <TouchableOpacity style={s.ctxBtn} onPress={() => deleteMsg(item)}>
                  <Ionicons name="trash-outline" size={15} color={T.error} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {showReact && (
            <View style={[s.reactPicker, isOwn ? s.reactPickerR : s.reactPickerL]}>
              {QUICK_REACTIONS.map(e => (
                <TouchableOpacity key={e} onPress={() => toggleReaction(item, e)}>
                  <Text style={s.reactPickerEmoji}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────
  //  RENDU CONVERSATION
  // ─────────────────────────────────────────────────────────
  const renderConv = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[s.convItem, selectedContact?.userId === item.userId && s.convActive]}
      onPress={() => selectConv(item)} 
      activeOpacity={0.7}
    >
      <Avatar 
        name={`${item.firstName} ${item.lastName}`} 
        size={46} 
        online={item.isOnline === true} 
      />
      <View style={s.convBody}>
        <View style={s.convHdr}>
          <View style={s.convNameWrapper}>
            <Text style={s.convName} numberOfLines={1}>
              {item.firstName} {item.lastName}
            </Text>
            <View style={[s.statusIndicator, { backgroundColor: item.isOnline ? T.success : T.text4 }]} />
          </View>
          <Text style={s.convTime}>{item.lastMessageTime ? formatTime(item.lastMessageTime) : ''}</Text>
        </View>
        <View style={s.convPrev}>
          <Text style={s.convPreview} numberOfLines={1}>
            {item.isOnline ? '🟢 En ligne' : item.lastMessage?.content || 'Commencer une conversation'}
          </Text>
          {(item.unreadCount || 0) > 0 && (
            <View style={s.unreadPill}><Text style={s.unreadTxt}>{item.unreadCount}</Text></View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // ─────────────────────────────────────────────────────────
  //  MODAL APPEL - Version complète avec vidéo
  // ─────────────────────────────────────────────────────────
  const CallModal = () => {
    if (!incomingCall && callStatus === 'idle' && !isCalling) return null;
    
    const isIncoming = !!incomingCall;
    const name = isIncoming ? incomingCall?.fromName : selectedContact?.firstName;
    const isVideo = callType === 'video';
    const hasWebRTC = checkWebRTC() && !isSimulationMode;
    const showVideo = hasWebRTC && isVideo && remoteStreamRef.current && RTCView;
    
    return (
      <Modal visible={!!(incomingCall || isCalling || callStatus !== 'idle')} transparent animationType="fade">
        <View style={s.callOverlay}>
          <View style={s.callCard}>
            
            {/* Vidéo distante (WebRTC uniquement) */}
            {showVideo && (
              <View style={s.remoteVideoWrap}>
                <RTCView
                  streamURL={remoteStreamRef.current.toURL()}
                  style={s.remoteVideo}
                  objectFit="cover"
                />
              </View>
            )}
            
            {/* Vidéo locale en PIP (WebRTC uniquement) */}
            {showVideo && localStreamRef.current && (
              <View style={s.localVideoWrap}>
                <RTCView
                  streamURL={localStreamRef.current.toURL()}
                  style={s.localVideo}
                  objectFit="cover"
                  mirror={true}
                />
              </View>
            )}
            
            {/* Avatar (audio ou vidéo sans stream) */}
            {(!showVideo) && (
              <View style={[s.callAvatar, { backgroundColor: getAvatarColor(name || '') }]}>
                <Ionicons name={isVideo ? 'videocam' : 'call'} size={50} color={T.white} />
              </View>
            )}
            
            {/* Informations */}
            <Text style={s.callName}>{name || 'Utilisateur'}</Text>
            
            {isSimulationMode && (
              <Text style={[s.callStatus, { color: T.warning }]}>🔄 Mode simulation</Text>
            )}
            
            {callStatus === 'calling' && (
              <Text style={s.callStatus}>⏳ Appel en cours…</Text>
            )}
            {callStatus === 'connected' && (
              <Text style={s.callStatus}>
                📞 En communication · {formatCallTime(callTimer)}
              </Text>
            )}
            {isIncoming && (
              <Text style={s.callStatus}>
                📞 Appel {isVideo ? 'vidéo' : 'audio'} entrant…
              </Text>
            )}
            
            {/* Boutons */}
            <View style={s.callBtns}>
              {isIncoming ? (
                // ── Appel entrant ──
                <>
                  <TouchableOpacity style={[s.callBtn, s.callReject]} onPress={rejectCall}>
                    <Ionicons name="close" size={32} color={T.white} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.callBtn, s.callAccept]} onPress={acceptCall}>
                    <Ionicons name="call" size={32} color={T.white} />
                  </TouchableOpacity>
                </>
              ) : callStatus === 'connected' ? (
                // ── Appel actif ──
                <>
                  {hasWebRTC && (
                    <TouchableOpacity style={s.ctrlBtn} onPress={toggleMute}>
                      <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={24} color={T.white} />
                    </TouchableOpacity>
                  )}
                  
                  {showVideo && (
                    <TouchableOpacity style={s.ctrlBtn} onPress={toggleCamera}>
                      <Ionicons name={isCameraOff ? 'videocam-off' : 'videocam'} size={24} color={T.white} />
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity style={[s.callBtn, s.callReject]} onPress={endCall}>
                    <Ionicons name="call" size={28} color={T.white} style={{ transform: [{ rotate: '135deg' }] }} />
                  </TouchableOpacity>
                </>
              ) : (
                // ── Appel en cours de connexion ──
                <TouchableOpacity style={[s.callBtn, s.callReject]} onPress={endCall}>
                  <Ionicons name="close" size={32} color={T.white} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // ─────────────────────────────────────────────────────────
  //  LOADING
  // ─────────────────────────────────────────────────────────
  if (loading) return (
    <View style={s.loadWrap}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />
      <ActivityIndicator size="large" color={T.primary} />
      <Text style={s.loadTxt}>{t('loading')}</Text>
    </View>
  );

  // ─────────────────────────────────────────────────────────
  //  VUE LISTE
  // ─────────────────────────────────────────────────────────
  if (view === 'list') return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />

      <View style={s.sidebarTop}>
        <Text style={s.brand}>Messages</Text>
        <IconBtn name="create-outline" color={T.violet} onPress={() => navigation.navigate('Friends' as never)} />
      </View>

      <View style={s.searchBox}>
        <Ionicons name="search" size={16} color={T.text4} />
        <TextInput
          style={s.searchInput} placeholder="Rechercher…"
          placeholderTextColor={T.text4} value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {onlineFriends.length > 0 && (
        <View style={s.onlineSection}>
          <View style={s.onlineHdr}>
            <View style={s.liveDot} />
            <Text style={s.onlineTitle}>En ligne</Text>
            <View style={s.onlineCount}>
              <Text style={s.onlineCountTxt}>{onlineFriends.length}</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 8 }}>
            {onlineFriends.map((f: any, index: number) => (
              <TouchableOpacity 
                key={f.id || f.friend?.id || index} 
                style={s.onlineCard} 
                onPress={() => startChat(f.friend?.id || f.userId)}
              >
                <Avatar name={`${f.friend?.firstName || ''} ${f.friend?.lastName || ''}`} size={42} online />
                <Text style={s.onlineCardName} numberOfLines={1}>{f.friend?.firstName || 'Utilisateur'}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={filteredConvs}
        keyExtractor={(item) => item.userId || Math.random().toString()}
        renderItem={renderConv}
        contentContainerStyle={s.convList}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={async () => { 
              setRefreshing(true); 
              await loadAll(); 
              setRefreshing(false); 
            }}
            colors={[T.primary]} 
            tintColor={T.primary} 
          />
        }
        ListEmptyComponent={
          <View style={s.emptyState}>
            <View style={s.emptyIcon}>
              <Ionicons name="chatbubbles-outline" size={36} color={T.primary} />
            </View>
            <Text style={s.emptyTitle}>Vos messages</Text>
            <Text style={s.emptyDesc}>Sélectionnez une conversation ou démarrez-en une nouvelle</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('Friends' as never)}>
              <Ionicons name="add" size={17} color={T.white} />
              <Text style={s.emptyBtnTxt}>Nouvelle discussion</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );

  // ─────────────────────────────────────────────────────────
  //  VUE CHAT
  // ─────────────────────────────────────────────────────────
  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />
      <KeyboardAvoidingView
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={s.chatHeader}>
          <IconBtn name="arrow-back" onPress={() => { setView('list'); setSelectedContact(null); setMessages([]); }} />
          <TouchableOpacity style={s.contactMeta} onPress={() => navigation.navigate('Profile' as never)}>
            <Avatar name={`${selectedContact?.firstName} ${selectedContact?.lastName}`} size={38} online={selectedContact?.isOnline === true} />
            <View style={{ marginLeft: 10 }}>
              <Text style={s.contactName}>{selectedContact?.firstName} {selectedContact?.lastName}</Text>
              <Text style={s.contactStatus}>
                {isTyping ? (
                  <Text style={s.typingTxt}>✍️ En train d'écrire…</Text>
                ) : selectedContact?.isOnline ? (
                  <Text style={s.onlineTxt}>🟢 En ligne</Text>
                ) : (
                  <Text style={s.offlineTxt}>⚪ Hors ligne</Text>
                )}
              </Text>
            </View>
          </TouchableOpacity>
          <View style={s.chatActions}>
            <IconBtn name="cash-outline" color={T.text3} onPress={() => setShowTransfer(!showTransfer)} />
            <IconBtn name="call-outline" color={T.text3} onPress={() => startCall('audio')} />
            <IconBtn name="videocam-outline" color={T.text3} onPress={() => startCall('video')} />
            <IconBtn name="ellipsis-vertical" color={T.text3} onPress={() => Alert.alert(
              t('settings'), t('confirm'),
              [
                { text: 'Voir le profil', onPress: () => navigation.navigate('Profile' as never)},
                { text: 'Envoyer de l\'argent', onPress: () => setShowTransfer(true) },
                { text: 'Bloquer', style: 'destructive', onPress: async () => {
                  try { 
                    await FriendService.blockUser(selectedContact.userId); 
                    showSuccess('Utilisateur bloqué'); 
                  } catch (error) { 
                    console.error('❌ Erreur blocage:', error);
                    showError(t('error')); 
                  }
                }},
                { text: t('cancel'), style: 'cancel' },
              ]
            )} />
          </View>
        </View>

        {showTransfer && (
          <View style={s.transferPanel}>
            <View style={s.transferBar}>
              <Text style={s.transferTitle}>Envoyer à {selectedContact?.firstName}</Text>
              <IconBtn name="close" onPress={() => setShowTransfer(false)} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {QUICK_AMOUNTS.map(a => (
                <TouchableOpacity key={a}
                  style={[s.amtChip, transferAmount === String(a) && s.amtChipActive]}
                  onPress={() => setTransferAmount(String(a))}>
                  <Text style={[s.amtChipTxt, transferAmount === String(a) && { color: T.white }]}>
                    {formatAmount(a)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={s.transferRow}>
              <TextInput
                style={s.transferInput} 
                placeholder="Montant (Ar)"
                placeholderTextColor={T.text4} 
                value={transferAmount}
                onChangeText={setTransferAmount} 
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={[s.sendMoneyBtn, (!transferAmount || parseFloat(transferAmount) <= 0) && { opacity: 0.45 }]}
                onPress={confirmTransfer} 
                disabled={!transferAmount || parseFloat(transferAmount) <= 0}
              >
                <Ionicons name="send" size={16} color={T.white} />
                <Text style={s.sendMoneyTxt}>Envoyer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id || Math.random().toString()}
          renderItem={renderMessage}
          contentContainerStyle={s.msgList}
          onContentSizeChange={scrollBottom}
          onTouchStart={() => { 
            setActiveCtxId(null); 
            setReactPickerId(null); 
            if (showEmojiPicker) setShowEmojiPicker(false); 
          }}
        />

        <View style={[s.composer, { paddingBottom: insets.bottom > 0 ? insets.bottom + 4 : 12 }]}>
          <IconBtn name="happy-outline" onPress={() => setShowEmojiPicker(p => !p)} />
          <IconBtn name="attach-outline" onPress={uploadFile} />
          <IconBtn 
            name={isRecordingAudio ? 'stop' : 'mic-outline'} 
            recording={isRecordingAudio} 
            onPress={toggleVoiceRecording} 
          />
          {isRecordingAudio && (
            <View style={s.recPill}>
              <View style={s.recDot} />
              <Text style={s.recTime}>{recordingDuration}s</Text>
            </View>
          )}
          <TextInput
            style={s.composerInput} 
            placeholder="Écrire un message…"
            placeholderTextColor={T.text4} 
            value={newMessage}
            onChangeText={setNewMessage} 
            onSubmitEditing={sendMessage}
            onChange={onTyping} 
            multiline
          />
          <TouchableOpacity
            style={[s.sendBtn, (!newMessage.trim() || isSending) && s.sendBtnOff]}
            onPress={sendMessage} 
            disabled={!newMessage.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={T.white} />
            ) : (
              <Ionicons name="send" size={18} color={T.white} />
            )}
          </TouchableOpacity>
        </View>

        {showEmojiPicker && (
          <View style={s.emojiPanel}>
            <FlatList
              data={EMOJIS}
              keyExtractor={(e, index) => e + index}
              numColumns={8}
              renderItem={({ item: e }) => (
                <TouchableOpacity style={s.emojiItem} onPress={() => sendEmoji(e)}>
                  <Text style={s.emojiTxt}>{e}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={s.emojiClose} onPress={() => setShowEmojiPicker(false)}>
              <Text style={s.emojiCloseTxt}>Fermer</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      <CallModal />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: T.bg },
  loadWrap:   { flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' },
  loadTxt:    { color: T.text3, marginTop: 12, fontSize: 14 },

  sidebarTop: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 16, 
    paddingBottom: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: T.border, 
    backgroundColor: T.surface 
  },
  brand:      { fontSize: 18, fontWeight: '800', color: T.violet, letterSpacing: -0.3 },

  searchBox:  { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginHorizontal: 12, 
    marginVertical: 10, 
    paddingHorizontal: 13, 
    paddingVertical: 9, 
    borderRadius: 24, 
    backgroundColor: T.surface2, 
    borderWidth: 1, 
    borderColor: T.border 
  },
  searchInput: { flex: 1, color: T.text, fontSize: 14 },

  onlineSection: { 
    padding: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: T.border, 
    backgroundColor: T.surface 
  },
  onlineHdr:  { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 7, 
    marginBottom: 10 
  },
  liveDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: T.success },
  onlineTitle: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: T.text3, 
    textTransform: 'uppercase', 
    letterSpacing: 0.8, 
    flex: 1 
  },
  onlineCount: { 
    backgroundColor: 'rgba(16,185,129,0.15)', 
    borderRadius: 20, 
    paddingHorizontal: 7, 
    paddingVertical: 1 
  },
  onlineCountTxt: { fontSize: 11, fontWeight: '700', color: T.success },
  onlineCard: { alignItems: 'center', marginRight: 14, width: 52 },
  onlineCardName: { fontSize: 11, color: T.text2, marginTop: 4, textAlign: 'center' },

  convList:   { padding: 8, paddingBottom: 20, backgroundColor: T.surface },
  convItem:   { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 11, 
    padding: 10, 
    borderRadius: 12, 
    marginBottom: 1 
  },
  convActive: { backgroundColor: T.primaryLt },
  convBody:   { flex: 1, minWidth: 0 },
  convHdr:    { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 2 
  },
  convNameWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  convName:   { fontSize: 14, fontWeight: '600', color: T.text, flex: 1 },
  convTime:   { fontSize: 11, color: T.text4 },
  statusIndicator: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  convPrev:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convPreview: { fontSize: 12, color: T.text3, flex: 1 },
  unreadPill: { 
    backgroundColor: T.primary, 
    borderRadius: 20, 
    minWidth: 18, 
    height: 18, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingHorizontal: 5 
  },
  unreadTxt:  { color: T.white, fontSize: 11, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyIcon:  { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: T.primaryLt, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 14 
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: T.text, marginBottom: 6 },
  emptyDesc:  { fontSize: 14, color: T.text3, textAlign: 'center', marginBottom: 20 },
  emptyBtn:   { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5, 
    backgroundColor: T.primary, 
    borderRadius: 24, 
    paddingVertical: 10, 
    paddingHorizontal: 18 
  },
  emptyBtnTxt: { color: T.white, fontWeight: '600', fontSize: 14 },

  chatHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    padding: 12, 
    paddingHorizontal: 12, 
    backgroundColor: T.surface, 
    borderBottomWidth: 1, 
    borderBottomColor: T.border 
  },
  contactMeta: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 4 },
  contactName: { fontSize: 15, fontWeight: '700', color: T.text },
  contactStatus: { fontSize: 12 },
  typingTxt:  { color: T.primary, fontStyle: 'italic' },
  onlineTxt:  { color: T.success, fontWeight: '500' },
  offlineTxt: { color: T.text4 },
  chatActions: { flexDirection: 'row', gap: 2 },

  transferPanel: { backgroundColor: T.surface, borderTopWidth: 1, borderTopColor: T.border, padding: 14 },
  transferBar:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  transferTitle: { fontSize: 15, fontWeight: '600', color: T.text },
  amtChip:    { 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.12)', 
    backgroundColor: 'rgba(255,255,255,0.04)', 
    borderRadius: 20, 
    paddingHorizontal: 14, 
    paddingVertical: 6, 
    marginRight: 8 
  },
  amtChipActive: { backgroundColor: T.primary, borderColor: T.primary },
  amtChipTxt: { fontSize: 13, fontWeight: '600', color: T.text2 },
  transferRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  transferInput: { 
    flex: 1, 
    padding: 10, 
    paddingHorizontal: 14, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.1)', 
    borderRadius: 24, 
    backgroundColor: 'rgba(255,255,255,0.04)', 
    fontSize: 14, 
    color: T.text 
  },
  sendMoneyBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: T.success, 
    borderRadius: 24, 
    paddingVertical: 10, 
    paddingHorizontal: 16 
  },
  sendMoneyTxt: { color: T.white, fontWeight: '600', fontSize: 14 },

  msgList:    { padding: 12, paddingBottom: 8, flexGrow: 1 },
  msgRow:     { marginVertical: 3 },
  rowR:       { alignItems: 'flex-end' },
  rowL:       { alignItems: 'flex-start' },
  msgWrap:    { maxWidth: '80%', position: 'relative' },

  bubble:     { 
    padding: 10, 
    paddingHorizontal: 14, 
    borderRadius: 18, 
    borderWidth: 1, 
    borderColor: T.border, 
    backgroundColor: T.surface 
  },
  bubbleOwn:  { backgroundColor: T.primary, borderWidth: 0, borderBottomRightRadius: 4 },
  bubbleOther: { borderBottomLeftRadius: 4 },
  emojiBubble: { backgroundColor: 'transparent', borderWidth: 0, paddingHorizontal: 4 },
  bubbleText: { fontSize: 14, color: T.text, lineHeight: 20 },
  bigEmoji:   { fontSize: 40, textAlign: 'center' },

  deletedBubble: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.08)', 
    borderStyle: 'dashed', 
    borderRadius: 12, 
    padding: 8, 
    paddingHorizontal: 12 
  },
  deletedText: { color: T.text4, fontStyle: 'italic', fontSize: 13 },

  reactBar:   { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 3 },
  reactChip:  { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: T.surface, 
    borderWidth: 1, 
    borderColor: T.border, 
    borderRadius: 20, 
    paddingHorizontal: 7, 
    paddingVertical: 2 
  },
  reactChipMine: { borderColor: T.primary, backgroundColor: T.primaryLt },
  reactEmoji: { fontSize: 14 },
  reactCount: { fontSize: 12, color: T.text3 },

  msgMeta:    { flexDirection: 'row', alignItems: 'center', marginTop: 3, paddingHorizontal: 4 },
  msgTime:    { fontSize: 11, color: T.text4 },
  msgEdited:  { fontSize: 11, color: T.text4, fontStyle: 'italic' },

  ctxMenu:    { 
    position: 'absolute', 
    top: -38, 
    flexDirection: 'row', 
    gap: 2, 
    backgroundColor: T.surface, 
    borderWidth: 1, 
    borderColor: T.border, 
    borderRadius: 20, 
    padding: 3, 
    zIndex: 10 
  },
  ctxMenuR:   { right: 0 },
  ctxMenuL:   { left: 0 },
  ctxBtn:     { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  reactPicker: { 
    position: 'absolute', 
    top: -46, 
    flexDirection: 'row', 
    gap: 8, 
    backgroundColor: T.surface, 
    borderWidth: 1, 
    borderColor: T.border, 
    borderRadius: 24, 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    zIndex: 15 
  },
  reactPickerR: { right: 0 },
  reactPickerL: { left: 0 },
  reactPickerEmoji: { fontSize: 22 },

  editWrap:   { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    backgroundColor: T.surface, 
    borderWidth: 1.5, 
    borderColor: T.primary, 
    borderRadius: 18, 
    padding: 4, 
    paddingLeft: 12 
  },
  editInput:  { flex: 1, color: T.text, fontSize: 14, minWidth: 120 },
  editOk:     { width: 28, height: 28, borderRadius: 14, backgroundColor: T.success, alignItems: 'center', justifyContent: 'center' },
  editCancel: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' },

  composer:   { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    padding: 10, 
    paddingHorizontal: 12, 
    borderTopWidth: 1, 
    borderTopColor: T.border, 
    backgroundColor: T.surface 
  },
  recPill:    { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    backgroundColor: 'rgba(239,68,68,0.12)', 
    borderRadius: 12, 
    paddingHorizontal: 8, 
    paddingVertical: 4 
  },
  recDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: T.error },
  recTime:    { fontSize: 12, color: T.error, fontWeight: '600' },
  composerInput: { 
    flex: 1, 
    padding: 10, 
    paddingHorizontal: 14, 
    fontSize: 14, 
    color: T.text, 
    borderRadius: 24, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.1)', 
    backgroundColor: 'rgba(255,255,255,0.04)', 
    maxHeight: 100 
  },
  sendBtn:    { width: 40, height: 40, borderRadius: 20, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnOff: { opacity: 0.4 },

  emojiPanel: { backgroundColor: T.surface, borderTopWidth: 1, borderTopColor: T.border, padding: 12, maxHeight: 280 },
  emojiItem:  { width: (width - 24) / 8, height: 38, alignItems: 'center', justifyContent: 'center' },
  emojiTxt:   { fontSize: 22 },
  emojiClose: { marginTop: 8, paddingVertical: 7, backgroundColor: T.primaryLt, borderRadius: 20, alignItems: 'center' },
  emojiCloseTxt: { color: T.violet, fontWeight: '600', fontSize: 13 },

  // ── Styles pour les appels vidéo ──
  remoteVideoWrap: {
    width: '100%',
    height: 280,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
  },
  localVideoWrap: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 100,
    height: 140,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    zIndex: 10,
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  ctrlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  callOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center' },
  callCard: { 
    backgroundColor: T.surface, 
    borderRadius: 24, 
    padding: 24, 
    alignItems: 'center', 
    width: width * 0.92, 
    maxWidth: 400,
    borderWidth: 1, 
    borderColor: T.border 
  },
  callAvatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  callName:   { fontSize: 20, fontWeight: '700', color: T.text, marginBottom: 4 },
  callStatus: { fontSize: 14, color: T.text3, marginBottom: 20 },
  callBtns:   { flexDirection: 'row', gap: 16, alignItems: 'center' },
  callBtn:    { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  callAccept: { backgroundColor: T.success },
  callReject: { backgroundColor: T.error },
});