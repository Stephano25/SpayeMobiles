// app/(user)/chat.tsx
// ─────────────────────────────────────────────────────────────
//  SPaye · Chat Screen — design calqué sur l'Angular, mobile-first
//  Compatible avec le backend NestJS existant (même endpoints/events)
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
import { COLORS, formatTime, getInitials, getAvatarColor, formatAmount } from '../../src/config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../../src/services/TranslationService';

const { width } = Dimensions.get('window');

// ─── Design tokens (calqués sur le CSS Angular) ───────────────
const T = {
  bg:        '#0f0f14',
  surface:   '#16161e',
  surface2:  '#1e1e2a',
  border:    'rgba(255,255,255,0.07)',
  text:      '#e2e8f0',
  text2:     '#cbd5e1',
  text3:     '#94a3b8',
  text4:     '#64748b',
  primary:   '#6366f1',
  primaryLt: 'rgba(99,102,241,0.15)',
  violet:    '#a78bfa',
  success:   '#10b981',
  error:     '#ef4444',
  warning:   '#f59e0b',
  white:     '#ffffff',
  avatarColors: [
    '#7c3aed','#6d28d9','#4f46e5','#0891b2',
    '#0d9488','#059669','#d97706','#dc2626','#db2777','#9333ea',
  ],
};

// ─── Helpers ──────────────────────────────────────────────────
const avatarColor = (name = '') => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return T.avatarColors[Math.abs(h) % T.avatarColors.length];
};

const fmtSize = (b?: number) => {
  if (!b) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
};

const getExt = (name = '') => name.split('.').pop()?.toLowerCase() || '';
const FILE_EXTS = {
  image: ['jpg','jpeg','png','gif','webp','svg'],
  video: ['mp4','webm','ogg','mov','avi'],
  audio: ['mp3','wav','ogg','aac','m4a'],
};
const fileKind = (url = '', name = '') => {
  const ext = getExt(name) || getExt(url);
  if (FILE_EXTS.image.includes(ext)) return 'image';
  if (FILE_EXTS.video.includes(ext)) return 'video';
  if (FILE_EXTS.audio.includes(ext)) return 'audio';
  return 'document';
};

// ─── Quick emojis (comme Angular) ─────────────────────────────
const QUICK_REACTIONS = ['👍','❤️','😆','😮','😢','🙏'];
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
interface CallData { from: string; type: 'audio'|'video'; fromName?: string; }

// ═══════════════════════════════════════════════════════════════
//  Composant Avatar (comme .av Angular)
// ═══════════════════════════════════════════════════════════════
const Avatar = ({ name = '', size = 40, online = false }: { name?: string; size?: number; online?: boolean }) => (
  <View style={[avStyles.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: avatarColor(name) }]}>
    <Text style={[avStyles.initials, { fontSize: size * 0.36 }]}>{(name.charAt(0) || '').toUpperCase()}</Text>
    {online && <View style={[avStyles.dot, { width: size * 0.26, height: size * 0.26, borderRadius: size * 0.13 }]} />}
  </View>
);
const avStyles = StyleSheet.create({
  wrap:     { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  initials: { color: T.white, fontWeight: '700' },
  dot:      { position: 'absolute', bottom: 0, right: 0, backgroundColor: T.success, borderWidth: 2, borderColor: T.surface },
});

// ═══════════════════════════════════════════════════════════════
//  IconBtn (comme .icon-btn Angular)
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

  const BASE = 'http://192.168.188.135:3000';
  const url  = item.fileUrl?.startsWith('http') ? item.fileUrl : `${BASE}${item.fileUrl}`;
  const kind = fileKind(item.fileUrl || '', item.fileName || '');

  useEffect(() => () => { sound?.unloadAsync(); }, [sound]);

  const playAudio = async () => {
    if (sound) {
      await sound.stopAsync(); await sound.unloadAsync();
      setSound(null); setPlaying(false); return;
    }
    try {
      const { sound: s, status } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
      setSound(s); setPlaying(true);
      setDuration((status as any).durationMillis || 0);
      s.setOnPlaybackStatusUpdate((st: any) => {
        if (st.isLoaded) { setPos(st.positionMillis || 0); if (st.didJustFinish) { setPlaying(false); setPos(0); } }
      });
    } catch { Alert.alert('Erreur','Impossible de lire l\'audio'); }
  };

  const fmtMs = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2,'0')}`;
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
      <Video source={{ uri: url }} style={mm.video} resizeMode={ResizeMode.CONTAIN}
        useNativeControls isLooping={false} shouldPlay={false} />
    </View>
  );

  // ── Audio (like .audio-wrap Angular) ──
  if (kind === 'audio') return (
    <View style={[mm.audioWrap, { backgroundColor: isOwn ? 'rgba(255,255,255,0.12)' : T.surface2 }]}>
      <TouchableOpacity onPress={playAudio} style={mm.audioBtn}>
        <Ionicons name={playing ? 'pause' : 'play'} size={20} color={isOwn ? T.white : T.violet} />
      </TouchableOpacity>
      <View style={mm.audioBar}>
        <View style={[mm.audioFill, {
          width: pos > 0 && duration > 0 ? `${(pos / duration) * 100}%` as any : '0%',
          backgroundColor: isOwn ? T.white : T.primary,
        }]} />
      </View>
      <Text style={[mm.audioDur, { color: isOwn ? 'rgba(255,255,255,0.75)' : T.text4 }]}>
        {duration > 0 ? fmtMs(duration) : '0:00'}
      </Text>
    </View>
  );

  // ── Document (like .doc-wrap Angular) ──
  return (
    <TouchableOpacity onPress={() => Linking.openURL(url)}
      style={[mm.docWrap, { backgroundColor: isOwn ? 'rgba(255,255,255,0.1)' : T.surface2 }]}>
      <View style={mm.docIconWrap}>
        <Ionicons name="document-text-outline" size={26} color={isOwn ? T.white : T.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[mm.docName, { color: isOwn ? T.white : T.text }]} numberOfLines={1}>
          {item.fileName || 'Document'}
        </Text>
        <Text style={[mm.docSize, { color: isOwn ? 'rgba(255,255,255,0.6)' : T.text4 }]}>
          {fmtSize(item.fileSize)}
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
//  MoneyCard (like .money-card Angular)
// ═══════════════════════════════════════════════════════════════
const MoneyCard = ({ item, isOwn }: { item: any; isOwn: boolean }) => {
  const status = item.moneyTransfer?.status || 'pending';
  const borderColor = status === 'completed' ? 'rgba(16,185,129,0.3)'
    : status === 'failed'    ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)';
  const bg = status === 'completed' ? 'rgba(16,185,129,0.07)'
    : status === 'failed'    ? 'rgba(239,68,68,0.07)' : 'rgba(245,158,11,0.07)';
  const iconBg = status === 'completed'
    ? ['#10b981','#059669'] : status === 'failed'
    ? ['#ef4444','#dc2626'] : ['#6366f1','#8b5cf6'];

  return (
    <View style={[mc.card, { borderColor, backgroundColor: bg }]}>
      <View style={[mc.iconWrap, { backgroundColor: iconBg[0] }]}>
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
  // Mobile: liste ou chat
  const [view, setView]                           = useState<'list'|'chat'>('list');
  const [isRecording, setIsRecording]             = useState(false);
  const [recordingTime, setRecordingTime]         = useState(0);
  // Transfert argent
  const [showTransfer, setShowTransfer]           = useState(false);
  const [transferAmount, setTransferAmount]       = useState('');
  const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000];
  // Actions message (ctx menu)
  const [activeCtxId, setActiveCtxId]             = useState<string|null>(null);
  const [editingId, setEditingId]                 = useState<string|null>(null);
  const [editContent, setEditContent]             = useState('');
  // Réactions
  const [reactPickerId, setReactPickerId]         = useState<string|null>(null);
  // Appels
  const [incomingCall, setIncomingCall]           = useState<CallData|null>(null);
  const [callStatus, setCallStatus]               = useState<'idle'|'calling'|'connected'|'ended'>('idle');
  const [callType, setCallType]                   = useState<'audio'|'video'>('audio');
  const [isCalling, setIsCalling]                 = useState(false);

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
        const token = getToken();
        if (token) await ChatService.connect(token);
        await loadAll();
        setupSockets();
      } catch { showError(t('error_loading')); }
      finally   { setLoading(false); }
    };
    init();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        const tk = getToken();
        if (tk && !ChatService.isConnected()) ChatService.connect(tk).catch(console.error);
      }
    });
    return () => {
      sub.remove();
      unsubMsg.current?.();
      unsubTyping.current?.();
      unsubOnline.current?.();
      unsubCall.current?.();
      unsubErr.current?.();
      if (recordInterval.current) clearInterval(recordInterval.current);
      if (typingTimeout.current)  clearTimeout(typingTimeout.current);
    };
  }, []);

  useEffect(() => {
    if (userId && conversations.length > 0) {
      const ex = conversations.find(c => c.userId === userId);
      ex ? selectConv(ex) : startChat(userId);
    }
  }, [userId, conversations]);

  // ── Data ──────────────────────────────────────────────────
  const loadAll = async () => {
    await Promise.all([loadConvs(), loadFriends(), loadOnline()]);
  };

  const loadConvs = async () => {
    try {
      const c = await ChatService.getConversations();
      setConversations((c || []).sort((a:any,b:any) =>
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()));
    } catch {}
  };

  const loadFriends = async () => {
    try {
      const f = await FriendService.getFriends();
      setAllFriends(f.filter((x:any) => x.status === 'accepted'));
    } catch {}
  };

  const loadOnline = async () => {
    try {
      const f = await FriendService.getFriends();
      setOnlineFriends(
        f.filter((x:any) => x.status === 'accepted' && x.friend?.isOnline === true));
    } catch {}
  };

  // ── Sockets ───────────────────────────────────────────────
  const setupSockets = () => {
    unsubMsg.current?.(); unsubTyping.current?.();
    unsubOnline.current?.(); unsubCall.current?.(); unsubErr.current?.();

    unsubMsg.current = ChatService.onNewMessage(msg => handleNewMsg(msg));

    unsubTyping.current = ChatService.onTyping(data => {
      if (data && selectedContact && data.userId === selectedContact.userId)
        setIsTyping(data.isTyping);
    });

    unsubOnline.current = ChatService.onOnlineStatus(data => {
      if (!data) return;
      setConversations(prev => prev.map(c =>
        c.userId === data.userId ? { ...c, isOnline: data.isOnline } : c));
      loadOnline();
    });

    unsubCall.current = ChatService.onCall(data => {
      if (data.from) {
        const fr = allFriends.find((f:any) => f.friend?.id === data.from);
        setIncomingCall({ from: data.from, type: data.type || 'audio', fromName: fr?.friend?.firstName || 'Inconnu' });
        setCallStatus('idle');
      } else if (data.accepted !== undefined) {
        setCallStatus(data.accepted ? 'connected' : 'ended');
        if (!data.accepted) { setIsCalling(false); setIncomingCall(null); }
      }
    });

    unsubErr.current = ChatService.onError(err => showError(err?.message || 'Erreur socket'));
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
      return arr.sort((a,b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
    });
  }, [selectedContact]);

  const selectConv = async (conv: any) => {
    setSelectedContact(conv);
    setMessages([]);
    setView('chat');
    setShowTransfer(false);
    setActiveCtxId(null);
    try {
      const msgs = await ChatService.getMessages(conv.userId);
      setMessages((msgs || []).sort((a:any,b:any) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
      scrollBottom();
      await ChatService.markAsRead(conv.userId);
      setConversations(prev => prev.map(c =>
        c.userId === conv.userId ? { ...c, unreadCount: 0 } : c));
    } catch { showError(t('error_loading')); }
  };

  const startChat = async (friendId: string) => {
    const ex = conversations.find(c => c.userId === friendId);
    if (ex) { selectConv(ex); return; }
    const fr = allFriends.find((f:any) => f.friend?.id === friendId)?.friend;
    if (!fr) { showError(t('error')); return; }
    const nc = {
      userId: fr.id, firstName: fr.firstName, lastName: fr.lastName,
      lastMessage: { content: '', type: 'text', createdAt: new Date() },
      lastMessageTime: new Date().toISOString(), unreadCount: 0, isOnline: fr.isOnline || false,
    };
    setConversations(prev => [nc, ...prev]);
    selectConv(nc);
  };

  // ── Envoyer message texte ──────────────────────────────────
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedContact || isSending) return;
    setIsSending(true);
    const tempId = 'temp-' + Date.now();
    const temp = {
      id: tempId, senderId: currentUserId, receiverId: selectedContact.userId,
      type: 'text', content: newMessage.trim(),
      isRead: false, isDelivered: false, createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, temp]);
    const txt = newMessage.trim();
    setNewMessage('');
    scrollBottom();
    try {
      await ChatService.sendMessage({ receiverId: selectedContact.userId, type: 'text', content: txt });
      ChatService.sendTyping(selectedContact.userId, false);
    } catch {
      showError('Erreur d\'envoi');
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally { setIsSending(false); }
  };

  const sendEmoji = (emoji: string) => {
    if (!selectedContact) return;
    setMessages(prev => [...prev, {
      id: 'temp-emoji-' + Date.now(), senderId: currentUserId,
      receiverId: selectedContact.userId, type: 'emoji', emoji,
      isRead: false, isDelivered: false, createdAt: new Date().toISOString(),
    }]);
    scrollBottom();
    ChatService.sendMessage({ receiverId: selectedContact.userId, type: 'emoji', emoji });
    setShowEmojiPicker(false);
  };

  // ── Transfert argent ──────────────────────────────────────
  const confirmTransfer = async () => {
    const amount = parseFloat(transferAmount);
    if (!selectedContact || !amount || amount <= 0) return;
    const temp = {
      id: 'temp-money-' + Date.now(), senderId: currentUserId,
      receiverId: selectedContact.userId, type: 'money',
      moneyTransfer: { amount, status: 'pending' },
      isRead: false, isDelivered: false, createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, temp]);
    scrollBottom();
    await ChatService.sendMessage({ receiverId: selectedContact.userId, type: 'money', moneyTransfer: { amount } });
    setShowTransfer(false);
    setTransferAmount('');
  };

  // ── Édition / suppression message ─────────────────────────
  const startEdit = (msg: any) => {
    setEditingId(msg.id); setEditContent(msg.content || ''); setActiveCtxId(null);
  };

  const saveEdit = async () => {
    if (!editingId || !editContent.trim()) return;
    try {
      await ChatService.updateMessage(editingId, editContent.trim());
      setMessages(prev => prev.map(m => m.id === editingId ? { ...m, content: editContent.trim(), isEdited: true } : m));
    } catch { showError('Erreur modification'); }
    setEditingId(null);
  };

  const deleteMsg = async (msg: any) => {
    Alert.alert('Supprimer', 'Supprimer ce message ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try {
          await ChatService.deleteMessage(msg.id);
          setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isDeleted: true, content: '' } : m));
        } catch { showError('Erreur suppression'); }
        setActiveCtxId(null);
      }},
    ]);
  };

  // ── Réactions ─────────────────────────────────────────────
  const toggleReaction = async (msg: any, emoji: string) => {
    const mine = msg.reactions?.find((r:any) => r.userId === currentUserId)?.emoji;
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
    } catch {}
    setReactPickerId(null); setActiveCtxId(null);
  };

  // ── Appels ────────────────────────────────────────────────
  const startCall = (type: 'audio'|'video') => {
    if (!selectedContact) return;
    if (!selectedContact.isOnline) { showWarning(t('offline')); return; }
    setCallType(type); setCallStatus('calling'); setIsCalling(true);
    ChatService.startCall(selectedContact.userId, type);
  };

  const acceptCall = () => {
    if (!incomingCall) return;
    setCallStatus('connected');
    ChatService.answerCall(incomingCall.from, true);
    setIncomingCall(null);
  };
  const rejectCall = () => {
    if (!incomingCall) return;
    ChatService.answerCall(incomingCall.from, false);
    setIncomingCall(null); setCallStatus('ended');
  };
  const endCall = () => {
    setCallStatus('ended'); setIsCalling(false); setIncomingCall(null);
    if (selectedContact) ChatService.endCall(selectedContact.userId);
  };

  // ── Enregistrement vocal ──────────────────────────────────
  const toggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      if (recordInterval.current) { clearInterval(recordInterval.current); recordInterval.current = null; }
      if (!selectedContact) return;
      const dur = recordingTime;
      setRecordingTime(0);
      const tempId = 'temp-audio-' + Date.now();
      setMessages(prev => [...prev, {
        id: tempId, senderId: currentUserId, receiverId: selectedContact.userId,
        type: 'audio', content: `🎤 Message vocal (${dur}s)`,
        fileUrl: 'https://example.com/audio.mp3', fileName: `audio_${Date.now()}.mp3`,
        fileSize: dur * 16, isRead: false, isDelivered: false, createdAt: new Date().toISOString(),
      }]);
      scrollBottom();
      try {
        await ChatService.sendMessage({
          receiverId: selectedContact.userId, type: 'audio',
          content: `🎤 Message vocal (${dur}s)`,
          fileUrl: 'https://example.com/audio.mp3', fileName: `audio_${Date.now()}.mp3`,
          fileSize: dur * 16,
        });
      } catch { showError('Erreur envoi vocal'); setMessages(prev => prev.filter(m => m.id !== tempId)); }
    } else {
      const perm = Platform.OS === 'android'
        ? await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO)
        : (await Audio.requestPermissionsAsync()).status;
      if (perm !== 'granted' && perm !== PermissionsAndroid.RESULTS.GRANTED) {
        showError('Permission microphone requise'); return;
      }
      setIsRecording(true); setRecordingTime(0);
      showInfo('🎤 Enregistrement en cours…');
      recordInterval.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
    }
  };

  // ── Upload fichier ────────────────────────────────────────
  const uploadFile = async () => {
    if (!selectedContact) return;
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos', 'audios'] as any, allowsEditing: false, quality: 0.8,
      });
      if (res.canceled || !res.assets[0]) return;
      const asset = res.assets[0];
      const file  = { uri: asset.uri, name: asset.fileName || 'file.jpg', type: asset.mimeType || 'image/jpeg', size: asset.fileSize || 0 };
      if (file.size > 150 * 1024 * 1024) { showError('Fichier trop volumineux (max 150 Mo)'); return; }
      setIsSending(true);
      let kind: string = 'file';
      if (file.type.startsWith('image/')) kind = 'image';
      else if (file.type.startsWith('video/')) kind = 'video';
      else if (file.type.startsWith('audio/')) kind = 'audio';
      const up = await ChatService.uploadFile(file);
      setMessages(prev => [...prev, {
        id: 'temp-file-' + Date.now(), senderId: currentUserId,
        receiverId: selectedContact.userId, type: kind,
        fileUrl: up.url, fileName: up.fileName || file.name, fileSize: up.fileSize || file.size,
        isRead: false, isDelivered: false, createdAt: new Date().toISOString(),
      }]);
      scrollBottom();
      await ChatService.sendMessage({ receiverId: selectedContact.userId, type: kind, fileUrl: up.url, fileName: up.fileName, fileSize: up.fileSize });
      showSuccess('Fichier envoyé');
    } catch { showError('Erreur upload'); }
    finally   { setIsSending(false); }
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

    // Réactions groupées
    const reactions: Record<string, { count: number; mine: boolean }> = {};
    (item.reactions || []).forEach((r: any) => {
      reactions[r.emoji] = reactions[r.emoji] || { count: 0, mine: false };
      reactions[r.emoji].count++;
      if (r.userId === currentUserId) reactions[r.emoji].mine = true;
    });

    return (
      <View style={[s.msgRow, isOwn ? s.rowR : s.rowL]}>
        <View style={s.msgWrap}>

          {/* ── Édition inline ── */}
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
              {/* ── Message supprimé ── */}
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
                  {/* Texte */}
                  {item.type === 'text' && (
                    <Text style={[s.bubbleText, isOwn && { color: T.white }]}>{item.content}</Text>
                  )}
                  {/* Emoji géant */}
                  {item.type === 'emoji' && <Text style={s.bigEmoji}>{item.emoji}</Text>}
                  {/* Médias */}
                  {['image','video','audio','file'].includes(item.type) && (
                    <MediaMessage item={item} isOwn={isOwn} />
                  )}
                  {/* Argent */}
                  {item.type === 'money' && <MoneyCard item={item} isOwn={isOwn} />}
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* ── Réactions bar ── */}
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

          {/* ── Heure + lu ── */}
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

          {/* ── Ctx actions ── */}
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

          {/* ── Reaction picker ── */}
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
  //  RENDU CONVERSATION (sidebar)
  // ─────────────────────────────────────────────────────────
  const renderConv = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[s.convItem, selectedContact?.userId === item.userId && s.convActive]}
      onPress={() => selectConv(item)} activeOpacity={0.7}
    >
      <Avatar name={`${item.firstName} ${item.lastName}`} size={46} online={item.isOnline} />
      <View style={s.convBody}>
        <View style={s.convHdr}>
          <Text style={s.convName} numberOfLines={1}>{item.firstName} {item.lastName}</Text>
          <Text style={s.convTime}>{item.lastMessageTime ? formatTime(item.lastMessageTime) : ''}</Text>
        </View>
        <View style={s.convPrev}>
          <Text style={s.convPreview} numberOfLines={1}>
            {item.lastMessage?.content || 'Commencer une conversation'}
          </Text>
          {(item.unreadCount || 0) > 0 && (
            <View style={s.unreadPill}><Text style={s.unreadTxt}>{item.unreadCount}</Text></View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // ─────────────────────────────────────────────────────────
  //  MODAL APPEL
  // ─────────────────────────────────────────────────────────
  const CallModal = () => {
    if (!incomingCall && callStatus === 'idle' && !isCalling) return null;
    const isIncoming = !!incomingCall;
    const name = isIncoming ? incomingCall?.fromName : selectedContact?.firstName;
    return (
      <Modal visible transparent animationType="fade">
        <View style={s.callOverlay}>
          <View style={s.callCard}>
            <View style={[s.callAvatar, { backgroundColor: avatarColor(name || '') }]}>
              <Ionicons name={callType === 'video' ? 'videocam' : 'call'} size={30} color={T.white} />
            </View>
            <Text style={s.callName}>{name || 'Utilisateur'}</Text>
            <Text style={s.callStatus}>
              {isIncoming ? `Appel ${callType === 'video' ? 'vidéo' : 'audio'} entrant…`
               : callStatus === 'calling' ? 'Appel en cours…'
               : callStatus === 'connected' ? 'En communication' : 'Terminé'}
            </Text>
            <View style={s.callBtns}>
              {isIncoming ? (
                <>
                  <TouchableOpacity style={[s.callBtn, s.callAccept]} onPress={acceptCall}>
                    <Ionicons name="call" size={28} color={T.white} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.callBtn, s.callReject]} onPress={rejectCall}>
                    <Ionicons name="call" size={28} color={T.white} style={{ transform: [{ rotate: '135deg' }] }} />
                  </TouchableOpacity>
                </>
              ) : callStatus === 'connected' ? (
                <>
                  <TouchableOpacity style={s.ctrlBtn}><Ionicons name="mic-off" size={22} color={T.white} /></TouchableOpacity>
                  <TouchableOpacity style={s.ctrlBtn}><Ionicons name="volume-high" size={22} color={T.white} /></TouchableOpacity>
                  <TouchableOpacity style={[s.ctrlBtn, s.callReject]} onPress={endCall}>
                    <Ionicons name="call" size={24} color={T.white} style={{ transform: [{ rotate: '135deg' }] }} />
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={[s.callBtn, s.callReject]} onPress={endCall}>
                  <Ionicons name="close" size={28} color={T.white} />
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
  //  VUE LISTE (conversations + amis en ligne)
  // ─────────────────────────────────────────────────────────
  if (view === 'list') return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />

      {/* Header liste */}
      <View style={s.sidebarTop}>
        <Text style={s.brand}>Messages</Text>
        <IconBtn name="create-outline" color={T.violet} onPress={() => navigation.navigate('Friends')} />
      </View>

      {/* Recherche */}
      <View style={s.searchBox}>
        <Ionicons name="search" size={16} color={T.text4} />
        <TextInput
          style={s.searchInput} placeholder="Rechercher…"
          placeholderTextColor={T.text4} value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Amis en ligne */}
      {onlineFriends.length > 0 && (
        <View style={s.onlineSection}>
          <View style={s.onlineHdr}>
            <View style={s.liveDot} />
            <Text style={s.onlineTitle}>En ligne</Text>
            <View style={s.onlineCount}><Text style={s.onlineCountTxt}>{onlineFriends.length}</Text></View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 8 }}>
            {onlineFriends.map(f => (
              <TouchableOpacity key={f.id} style={s.onlineCard} onPress={() => startChat(f.friend.id)}>
                <Avatar name={`${f.friend.firstName} ${f.friend.lastName}`} size={42} online />
                <Text style={s.onlineCardName} numberOfLines={1}>{f.friend.firstName}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Liste conversations */}
      <FlatList
        data={filteredConvs}
        keyExtractor={item => item.userId}
        renderItem={renderConv}
        contentContainerStyle={s.convList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadAll(); setRefreshing(false); }}
            colors={[T.primary]} tintColor={T.primary} />
        }
        ListEmptyComponent={
          <View style={s.emptyState}>
            <View style={s.emptyIcon}><Ionicons name="chatbubbles-outline" size={36} color={T.primary} /></View>
            <Text style={s.emptyTitle}>Vos messages</Text>
            <Text style={s.emptyDesc}>Sélectionnez une conversation ou démarrez-en une nouvelle</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('Friends')}>
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
        style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* ── Chat Header (like .chat-header Angular) ── */}
        <View style={s.chatHeader}>
          <IconBtn name="arrow-back" onPress={() => { setView('list'); setSelectedContact(null); setMessages([]); }} />
          <TouchableOpacity style={s.contactMeta} onPress={() => navigation.navigate('Profile', { userId: selectedContact?.userId })}>
            <Avatar name={`${selectedContact?.firstName} ${selectedContact?.lastName}`} size={38} online={selectedContact?.isOnline} />
            <View style={{ marginLeft: 10 }}>
              <Text style={s.contactName}>{selectedContact?.firstName} {selectedContact?.lastName}</Text>
              <Text style={s.contactStatus}>
                {isTyping ? (
                  <Text style={s.typingTxt}>En train d'écrire…</Text>
                ) : selectedContact?.isOnline ? (
                  <Text style={s.onlineTxt}>● En ligne</Text>
                ) : (
                  <Text style={s.offlineTxt}>Hors ligne</Text>
                )}
              </Text>
            </View>
          </TouchableOpacity>
          <View style={s.chatActions}>
            <IconBtn name="cash-outline" color={T.text3} onPress={() => setShowTransfer(!showTransfer)} />
            <IconBtn name="call-outline"  color={T.text3} onPress={() => startCall('audio')} />
            <IconBtn name="videocam-outline" color={T.text3} onPress={() => startCall('video')} />
            <IconBtn name="ellipsis-vertical" color={T.text3} onPress={() => Alert.alert(
              t('settings'), t('confirm'),
              [
                { text: 'Voir le profil', onPress: () => navigation.navigate('Profile', { userId: selectedContact?.userId }) },
                { text: 'Envoyer de l\'argent', onPress: () => setShowTransfer(true) },
                { text: 'Bloquer', style: 'destructive', onPress: async () => {
                  try { await FriendService.blockUser(selectedContact.userId); showSuccess('Utilisateur bloqué'); }
                  catch { showError(t('error')); }
                }},
                { text: t('cancel'), style: 'cancel' },
              ]
            )} />
          </View>
        </View>

        {/* ── Panneau transfert (like .transfer-panel Angular) ── */}
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
                style={s.transferInput} placeholder="Montant (Ar)"
                placeholderTextColor={T.text4} value={transferAmount}
                onChangeText={setTransferAmount} keyboardType="numeric"
              />
              <TouchableOpacity
                style={[s.sendMoneyBtn, (!transferAmount || parseFloat(transferAmount) <= 0) && { opacity: 0.45 }]}
                onPress={confirmTransfer} disabled={!transferAmount || parseFloat(transferAmount) <= 0}
              >
                <Ionicons name="send" size={16} color={T.white} />
                <Text style={s.sendMoneyTxt}>Envoyer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Messages ── */}
        <FlatList
          ref={flatListRef} data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={s.msgList}
          onContentSizeChange={scrollBottom}
          onTouchStart={() => { setActiveCtxId(null); setReactPickerId(null); if (showEmojiPicker) setShowEmojiPicker(false); }}
        />

        {/* ── Composer (like .composer Angular) ── */}
        <View style={[s.composer, { paddingBottom: insets.bottom > 0 ? insets.bottom + 4 : 12 }]}>
          <IconBtn name="happy-outline"   onPress={() => setShowEmojiPicker(p => !p)} />
          <IconBtn name="attach-outline"  onPress={uploadFile} />
          <IconBtn name={isRecording ? 'stop' : 'mic-outline'} recording={isRecording} onPress={toggleRecording} />
          {isRecording && (
            <View style={s.recPill}>
              <View style={s.recDot} />
              <Text style={s.recTime}>{recordingTime}s</Text>
            </View>
          )}
          <TextInput
            style={s.composerInput} placeholder="Écrire un message…"
            placeholderTextColor={T.text4} value={newMessage}
            onChangeText={setNewMessage} onSubmitEditing={sendMessage}
            onChange={onTyping} multiline
          />
          <TouchableOpacity
            style={[s.sendBtn, (!newMessage.trim() || isSending) && s.sendBtnOff]}
            onPress={sendMessage} disabled={!newMessage.trim() || isSending}
          >
            {isSending
              ? <ActivityIndicator size="small" color={T.white} />
              : <Ionicons name="send" size={18} color={T.white} />
            }
          </TouchableOpacity>
        </View>

        {/* ── Emoji picker (like .emoji-panel Angular) ── */}
        {showEmojiPicker && (
          <View style={s.emojiPanel}>
            <FlatList
              data={EMOJIS} keyExtractor={e => e} numColumns={8}
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
//  STYLES — design system calqué sur le CSS Angular
// ═══════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  // Root
  root:       { flex: 1, backgroundColor: T.bg },
  loadWrap:   { flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' },
  loadTxt:    { color: T.text3, marginTop: 12, fontSize: 14 },

  // ── Sidebar / Liste ──────────────────────────────────────
  sidebarTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: T.border, backgroundColor: T.surface },
  brand:      { fontSize: 18, fontWeight: '800', color: T.violet, letterSpacing: -0.3 },

  searchBox:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 12, marginVertical: 10, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 24, backgroundColor: T.surface2, borderWidth: 1, borderColor: T.border },
  searchInput:{ flex: 1, color: T.text, fontSize: 14 },

  onlineSection: { padding: 12, borderBottomWidth: 1, borderBottomColor: T.border, backgroundColor: T.surface },
  onlineHdr:  { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  liveDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: T.success },
  onlineTitle:{ fontSize: 11, fontWeight: '700', color: T.text3, textTransform: 'uppercase', letterSpacing: 0.8, flex: 1 },
  onlineCount:{ backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: 20, paddingHorizontal: 7, paddingVertical: 1 },
  onlineCountTxt: { fontSize: 11, fontWeight: '700', color: T.success },
  onlineCard: { alignItems: 'center', marginRight: 14, width: 52 },
  onlineCardName: { fontSize: 11, color: T.text2, marginTop: 4, textAlign: 'center' },

  convList:   { padding: 8, paddingBottom: 20, backgroundColor: T.surface },
  convItem:   { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 10, borderRadius: 12, marginBottom: 1 },
  convActive: { backgroundColor: T.primaryLt },
  convBody:   { flex: 1, minWidth: 0 },
  convHdr:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 },
  convName:   { fontSize: 14, fontWeight: '600', color: T.text, flex: 1 },
  convTime:   { fontSize: 11, color: T.text4 },
  convPrev:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convPreview:{ fontSize: 12, color: T.text3, flex: 1 },
  unreadPill: { backgroundColor: T.primary, borderRadius: 20, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  unreadTxt:  { color: T.white, fontSize: 11, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyIcon:  { width: 80, height: 80, borderRadius: 40, backgroundColor: T.primaryLt, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: T.text, marginBottom: 6 },
  emptyDesc:  { fontSize: 14, color: T.text3, textAlign: 'center', marginBottom: 20 },
  emptyBtn:   { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: T.primary, borderRadius: 24, paddingVertical: 10, paddingHorizontal: 18 },
  emptyBtnTxt:{ color: T.white, fontWeight: '600', fontSize: 14 },

  // ── Chat ─────────────────────────────────────────────────
  chatHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, paddingHorizontal: 12, backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border },
  contactMeta:{ flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 4 },
  contactName:{ fontSize: 15, fontWeight: '700', color: T.text },
  contactStatus:{ fontSize: 12 },
  typingTxt:  { color: T.primary, fontStyle: 'italic' },
  onlineTxt:  { color: T.success, fontWeight: '500' },
  offlineTxt: { color: T.text4 },
  chatActions:{ flexDirection: 'row', gap: 2 },

  // ── Transfer panel ────────────────────────────────────────
  transferPanel:{ backgroundColor: T.surface, borderTopWidth: 1, borderTopColor: T.border, padding: 14 },
  transferBar:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  transferTitle:{ fontSize: 15, fontWeight: '600', color: T.text },
  amtChip:    { borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginRight: 8 },
  amtChipActive:{ backgroundColor: T.primary, borderColor: T.primary },
  amtChipTxt: { fontSize: 13, fontWeight: '600', color: T.text2 },
  transferRow:{ flexDirection: 'row', gap: 10, alignItems: 'center' },
  transferInput:{ flex: 1, padding: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.04)', fontSize: 14, color: T.text },
  sendMoneyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: T.success, borderRadius: 24, paddingVertical: 10, paddingHorizontal: 16 },
  sendMoneyTxt: { color: T.white, fontWeight: '600', fontSize: 14 },

  // ── Messages ──────────────────────────────────────────────
  msgList:    { padding: 12, paddingBottom: 8, flexGrow: 1 },
  msgRow:     { marginVertical: 3 },
  rowR:       { alignItems: 'flex-end' },
  rowL:       { alignItems: 'flex-start' },
  msgWrap:    { maxWidth: '80%', position: 'relative' },

  bubble:     { padding: 10, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: T.border, backgroundColor: T.surface },
  bubbleOwn:  { backgroundColor: T.primary, borderWidth: 0, borderBottomRightRadius: 4 },
  bubbleOther:{ borderBottomLeftRadius: 4 },
  emojiBubble:{ backgroundColor: 'transparent', borderWidth: 0, paddingHorizontal: 4 },
  bubbleText: { fontSize: 14, color: T.text, lineHeight: 20 },
  bigEmoji:   { fontSize: 40, textAlign: 'center' },

  deletedBubble: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderStyle: 'dashed', borderRadius: 12, padding: 8, paddingHorizontal: 12 },
  deletedText:   { color: T.text4, fontStyle: 'italic', fontSize: 13 },

  reactBar:   { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 3 },
  reactChip:  { flexDirection: 'row', alignItems: 'center', backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
  reactChipMine: { borderColor: T.primary, backgroundColor: T.primaryLt },
  reactEmoji: { fontSize: 14 },
  reactCount: { fontSize: 12, color: T.text3 },

  msgMeta:    { flexDirection: 'row', alignItems: 'center', marginTop: 3, paddingHorizontal: 4 },
  msgTime:    { fontSize: 11, color: T.text4 },
  msgEdited:  { fontSize: 11, color: T.text4, fontStyle: 'italic' },

  ctxMenu:    { position: 'absolute', top: -38, flexDirection: 'row', gap: 2, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 20, padding: 3, zIndex: 10 },
  ctxMenuR:   { right: 0 },
  ctxMenuL:   { left: 0 },
  ctxBtn:     { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  reactPicker:{ position: 'absolute', top: -46, flexDirection: 'row', gap: 8, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 24, paddingHorizontal: 10, paddingVertical: 6, zIndex: 15 },
  reactPickerR: { right: 0 },
  reactPickerL: { left: 0 },
  reactPickerEmoji: { fontSize: 22 },

  // ── Edit inline ──────────────────────────────────────────
  editWrap:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: T.surface, borderWidth: 1.5, borderColor: T.primary, borderRadius: 18, padding: 4, paddingLeft: 12 },
  editInput:  { flex: 1, color: T.text, fontSize: 14, minWidth: 120 },
  editOk:     { width: 28, height: 28, borderRadius: 14, backgroundColor: T.success, alignItems: 'center', justifyContent: 'center' },
  editCancel: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' },

  // ── Composer ──────────────────────────────────────────────
  composer:   { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: T.border, backgroundColor: T.surface },
  recPill:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  recDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: T.error },
  recTime:    { fontSize: 12, color: T.error, fontWeight: '600' },
  composerInput: { flex: 1, padding: 10, paddingHorizontal: 14, fontSize: 14, color: T.text, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)', maxHeight: 100 },
  sendBtn:    { width: 40, height: 40, borderRadius: 20, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnOff: { opacity: 0.4 },

  // ── Emoji panel ──────────────────────────────────────────
  emojiPanel: { backgroundColor: T.surface, borderTopWidth: 1, borderTopColor: T.border, padding: 12, maxHeight: 280 },
  emojiItem:  { width: (width - 24) / 8, height: 38, alignItems: 'center', justifyContent: 'center' },
  emojiTxt:   { fontSize: 22 },
  emojiClose: { marginTop: 8, paddingVertical: 7, backgroundColor: T.primaryLt, borderRadius: 20, alignItems: 'center' },
  emojiCloseTxt: { color: T.violet, fontWeight: '600', fontSize: 13 },

  // ── Call modal ────────────────────────────────────────────
  callOverlay:{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center' },
  callCard:   { backgroundColor: T.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: width * 0.85, borderWidth: 1, borderColor: T.border },
  callAvatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  callName:   { fontSize: 22, fontWeight: '700', color: T.text, marginBottom: 4 },
  callStatus: { fontSize: 14, color: T.text3, marginBottom: 24 },
  callBtns:   { flexDirection: 'row', gap: 20, alignItems: 'center' },
  callBtn:    { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  callAccept: { backgroundColor: T.success },
  callReject: { backgroundColor: T.error },
  ctrlBtn:    { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
});