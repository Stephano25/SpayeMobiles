// src/services/ChatService.ts
// ─────────────────────────────────────────────────────────────
//  SPAYE — Chat Service
//  ✅ Correction : suppression des doublons
//  ✅ Ajout du listener onlineUsers
//  ✅ Gestion complète du statut en ligne
//  ✅ uploadFile corrigé et intégré
//  ✅ Appels WebRTC (audio/vidéo)
// ─────────────────────────────────────────────────────────────

import { getBaseURL, getAPIURL, apiFetch, apiGet, apiPost, apiPut, apiDelete, uploadFile as apiUploadFile } from './api';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================
// TYPES
// ============================================================
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content?: string;
  type: 'text' | 'image' | 'file' | 'emoji' | 'money' | 'audio' | 'video';
  createdAt: Date | string;
  isRead: boolean;
  isDelivered: boolean;
  isEdited?: boolean;
  isDeleted?: boolean;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  emoji?: string;
  duration?: number;
  thumbnail?: string;
  moneyTransfer?: {
    amount: number;
    status: 'pending' | 'completed' | 'failed';
    transactionId?: string;
    failReason?: string;
  };
  reactions?: { userId: string; emoji: string }[];
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
}

export interface Conversation {
  userId: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  lastMessage?: {
    content: string;
    type: string;
    createdAt: Date;
    fileUrl?: string;
    fileName?: string;
  };
  lastMessageTime: Date;
  unreadCount: number;
  isOnline?: boolean;
}

// ============================================================
// SOCKET
// ============================================================
let socket: Socket | null = null;
let socketUrl: string | null = null;
let isConnecting = false;

const messageCallbacks = new Set<(msg: Message) => void>();
const typingCallbacks = new Set<(data: { userId: string; isTyping: boolean }) => void>();
const onlineStatusCallbacks = new Set<(data: { userId: string; isOnline: boolean }) => void>();
const callCallbacks = new Set<(data: any) => void>();
const errorCallbacks = new Set<(error: any) => void>();

// ============================================================
// CHAT SERVICE
// ============================================================
export const ChatService = {
  /**
   * ✅ Connecte le socket
   */
  connect: async (token: string): Promise<Socket> => {
    if (!socketUrl) {
      socketUrl = await getBaseURL();
    }

    if (isConnecting) {
      return new Promise((resolve) => {
        const checkConnected = setInterval(() => {
          if (socket?.connected) {
            clearInterval(checkConnected);
            resolve(socket);
          }
        }, 100);
      });
    }

    if (!socket) {
      isConnecting = true;
      console.log('🔌 Connexion au socket...', socketUrl);

      socket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: true,
      });

      // ── Listeners ──────────────────────────────────────────
      socket.on('connect', () => {
        console.log('✅ Socket connecté');
        isConnecting = false;
        socket?.emit('getOnlineUsers');
      });

      socket.on('disconnect', (reason: string) => {
        console.log('❌ Socket déconnecté:', reason);
        isConnecting = false;
      });

      socket.on('connect_error', (error: Error) => {
        console.error('❌ Erreur socket:', error.message);
        isConnecting = false;
        errorCallbacks.forEach((cb) => cb(error));
      });

      // ✅ Nouveau message
      socket.on('newMessage', (msg: Message) => {
        console.log('📩 Nouveau message reçu:', msg.id);
        messageCallbacks.forEach((cb) => {
          try { cb(msg); } catch (e) { console.error(e); }
        });
      });

      // ✅ Typing
      socket.on('userTyping', (data: { userId: string; isTyping: boolean }) => {
        typingCallbacks.forEach((cb) => {
          try { cb(data); } catch (e) { console.error(e); }
        });
      });

      // ✅ Statut en ligne d'un utilisateur spécifique
      socket.on('userOnline', (data: { userId: string; isOnline: boolean }) => {
        console.log(`🟢 Statut en ligne: ${data.userId} -> ${data.isOnline}`);
        onlineStatusCallbacks.forEach((cb) => {
          try { cb(data); } catch (e) { console.error(e); }
        });
      });

      // ✅ Liste des utilisateurs en ligne (broadcast)
      socket.on('onlineUsers', (users: string[]) => {
        console.log(`👥 ${users.length} utilisateurs en ligne:`, users);
        users.forEach(userId => {
          onlineStatusCallbacks.forEach((cb) => {
            try { cb({ userId, isOnline: true }); } catch (e) { console.error(e); }
          });
        });
      });

      // ✅ Appels - Offre entrante
      socket.on('incomingCall', (data: any) => {
        console.log('📞 Appel entrant:', data);
        callCallbacks.forEach((cb) => {
          try { cb({ 
            from: data.callerId || data.from, 
            type: data.type || 'audio',
            offer: data.offer,
          }); } catch (e) { console.error(e); }
        });
      });

      // ✅ Appels - Réponse
      socket.on('callAnswered', (data: any) => {
        console.log('📞 Appel répondus:', data);
        callCallbacks.forEach((cb) => {
          try { cb({ 
            accepted: data.accepted, 
            answer: data.answer 
          }); } catch (e) { console.error(e); }
        });
      });

      // ✅ Appels - Candidat ICE
      socket.on('iceCandidate', (data: any) => {
        console.log('🧊 Candidat ICE reçu');
        callCallbacks.forEach((cb) => {
          try { cb({ candidate: data.candidate }); } catch (e) { console.error(e); }
        });
      });

      // ✅ Appels - Signal WebRTC
      socket.on('callSignal', (data: any) => {
        console.log('📡 Signal WebRTC reçu');
        callCallbacks.forEach((cb) => {
          try { cb({ signal: data.signal, from: data.from }); } catch (e) { console.error(e); }
        });
      });

      // ✅ Appels - Fin d'appel
      socket.on('callEnded', (data: any) => {
        console.log('📞 Appel terminé:', data);
        callCallbacks.forEach((cb) => {
          try { cb({ ended: true, userId: data.userId }); } catch (e) { console.error(e); }
        });
      });

      // ✅ Erreurs
      socket.on('error', (data: any) => {
        console.error('❌ Erreur socket event:', data);
        errorCallbacks.forEach((cb) => {
          try { cb(data); } catch (e) { console.error(e); }
        });
      });

      // ✅ Message supprimé
      socket.on('messageDeleted', (data: { messageId: string }) => {
        console.log('🗑️ Message supprimé:', data.messageId);
        messageCallbacks.forEach((cb) => {
          try { 
            cb({ id: data.messageId, isDeleted: true } as Message); 
          } catch (e) { console.error(e); }
        });
      });

      // ✅ Message modifié
      socket.on('messageEdited', (msg: Message) => {
        console.log('✏️ Message modifié:', msg.id);
        messageCallbacks.forEach((cb) => {
          try { cb(msg); } catch (e) { console.error(e); }
        });
      });

      // ✅ Réaction
      socket.on('messageReaction', (msg: Message) => {
        console.log('😊 Réaction:', msg.id);
        messageCallbacks.forEach((cb) => {
          try { cb(msg); } catch (e) { console.error(e); }
        });
      });
    }

    if (!socket.connected) {
      socket.connect();
    }

    return socket;
  },

  /**
   * ✅ Déconnecte le socket
   */
  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    isConnecting = false;
    console.log('🔌 Socket déconnecté');
  },

  /**
   * ✅ Récupère le socket
   */
  getSocket: (): Socket | null => socket,

  /**
   * ✅ Vérifie si le socket est connecté
   */
  isConnected: (): boolean => socket?.connected || false,

  /**
   * ✅ Récupère les conversations
   */
  getConversations: async (): Promise<Conversation[]> => {
    try {
      const response = await apiGet('/chat/conversations');
      return response || [];
    } catch (error) {
      console.error('❌ Erreur getConversations:', error);
      return [];
    }
  },

  /**
   * ✅ Récupère les messages
   */
  getMessages: async (otherUserId: string, page = 1, limit = 50): Promise<Message[]> => {
    try {
      const response = await apiGet(`/chat/messages/${otherUserId}`, { page, limit });
      return response || [];
    } catch (error) {
      console.error('❌ Erreur getMessages:', error);
      return [];
    }
  },

  /**
   * ✅ Envoie un message
   */
  sendMessage: async (data: {
    receiverId: string;
    type: string;
    content?: string;
    emoji?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    duration?: number;
    thumbnail?: string;
    moneyTransfer?: { amount: number };
  }) => {
    try {
      console.log('📤 Envoi message:', { type: data.type, receiverId: data.receiverId });
      
      const response = await apiPost('/chat/send', data);
      
      if (socket?.connected) {
        socket.emit('sendMessage', data);
      }
      
      return response;
    } catch (error: any) {
      console.error('❌ Erreur envoi message:', error);
      
      if (socket?.connected) {
        console.log('📤 Envoi via socket en fallback');
        socket.emit('sendMessage', data);
        return { success: true, socketOnly: true };
      }
      throw error;
    }
  },

  /**
   * ✅ Marque comme lu
   */
  markAsRead: async (senderId: string): Promise<any> => {
    try {
      const response = await apiPost(`/chat/read/${senderId}`, {});
      return response;
    } catch (error) {
      console.error('❌ Erreur markAsRead:', error);
      return null;
    }
  },

  /**
   * ✅ Modifie un message
   */
  updateMessage: async (messageId: string, content: string): Promise<Message> => {
    const response = await apiPut(`/chat/message/${messageId}`, { content });
    return response;
  },

  /**
   * ✅ Supprime un message
   */
  deleteMessage: async (messageId: string): Promise<Message> => {
    const response = await apiDelete(`/chat/message/${messageId}`);
    return response;
  },

  /**
   * ✅ Réagit à un message
   */
  reactToMessage: async (messageId: string, emoji: string): Promise<Message> => {
    const response = await apiPost(`/chat/message/${messageId}/react`, { emoji });
    return response;
  },

  /**
   * ✅ Supprime une réaction
   */
  removeReaction: async (messageId: string): Promise<Message> => {
    const response = await apiDelete(`/chat/message/${messageId}/react`);
    return response;
  },

  /**
   * ✅ Upload un fichier
   */
  uploadFile: async (file: any): Promise<{ url: string; fileName: string; fileSize: number; mimeType: string }> => {
    try {
      console.log('📤 Upload du fichier...');
      
      if (!file) {
        throw new Error('Aucun fichier fourni');
      }
      
      const result = await apiUploadFile(file);
      console.log('✅ Fichier uploadé:', result.fileName);
      return result;
    } catch (error) {
      console.error('❌ Erreur uploadFile:', error);
      throw error;
    }
  },

  // ── Appels WebRTC ──────────────────────────────────────────

  /**
   * ✅ Démarre un appel avec offre
   */
  startCall: (receiverId: string, type: 'audio' | 'video', offer?: any) => {
    if (socket?.connected) {
      console.log(`📞 Démarrage appel ${type} vers ${receiverId}`);
      socket.emit('startCall', { receiverId, type, offer });
    } else {
      console.warn('⚠️ Socket non connecté, impossible de démarrer l\'appel');
    }
  },

  /**
   * ✅ Répond à un appel
   */
  answerCall: (callerId: string, accepted: boolean, answer?: any) => {
    if (socket?.connected) {
      console.log(`📞 Réponse à l'appel de ${callerId}: ${accepted ? 'accepté' : 'refusé'}`);
      socket.emit('answerCall', { callerId, accepted, answer });
    } else {
      console.warn('⚠️ Socket non connecté, impossible de répondre à l\'appel');
    }
  },

  /**
   * ✅ Termine un appel
   */
  endCall: (receiverId: string) => {
    if (socket?.connected) {
      console.log(`📞 Fin d'appel avec ${receiverId}`);
      socket.emit('endCall', { receiverId });
    }
  },

  /**
   * ✅ Envoie un signal WebRTC (offre/réponse/candidat)
   */
  sendSignal: (receiverId: string, signal: any) => {
    if (socket?.connected) {
      console.log(`📡 Envoi signal WebRTC à ${receiverId}`);
      socket.emit('callSignal', { receiverId, signal });
    }
  },

  /**
   * ✅ Envoie un candidat ICE
   */
  sendIceCandidate: (receiverId: string, candidate: any) => {
    if (socket?.connected) {
      console.log(`🧊 Envoi candidat ICE à ${receiverId}`);
      socket.emit('iceCandidate', { receiverId, candidate });
    }
  },

  // ── Fin appels WebRTC ──────────────────────────────────────

  /**
   * ✅ Envoie un événement typing
   */
  sendTyping: (receiverId: string, isTyping: boolean) => {
    if (socket?.connected) {
      socket.emit('typing', { receiverId, isTyping });
    }
  },

  /**
   * ✅ Demande les utilisateurs en ligne
   */
  requestOnlineUsers: () => {
    if (socket?.connected) {
      console.log('📡 Demande des utilisateurs en ligne');
      socket.emit('getOnlineUsers');
    } else {
      console.warn('⚠️ Socket non connecté, impossible de demander les utilisateurs en ligne');
    }
  },

  /**
   * ✅ Écoute les nouveaux messages
   */
  onNewMessage: (callback: (msg: Message) => void): (() => void) => {
    messageCallbacks.add(callback);
    return () => messageCallbacks.delete(callback);
  },

  /**
   * ✅ Écoute les événements typing
   */
  onTyping: (callback: (data: { userId: string; isTyping: boolean }) => void): (() => void) => {
    typingCallbacks.add(callback);
    return () => typingCallbacks.delete(callback);
  },

  /**
   * ✅ Écoute les changements de statut en ligne
   */
  onOnlineStatus: (callback: (data: { userId: string; isOnline: boolean }) => void): (() => void) => {
    onlineStatusCallbacks.add(callback);
    return () => onlineStatusCallbacks.delete(callback);
  },

  /**
   * ✅ Écoute les appels
   */
  onCall: (callback: (data: any) => void): (() => void) => {
    callCallbacks.add(callback);
    return () => callCallbacks.delete(callback);
  },

  /**
   * ✅ Écoute les erreurs
   */
  onError: (callback: (error: any) => void): (() => void) => {
    errorCallbacks.add(callback);
    return () => errorCallbacks.delete(callback);
  },

  /**
   * ✅ Réinitialise tout
   */
  reset: () => {
    messageCallbacks.clear();
    typingCallbacks.clear();
    onlineStatusCallbacks.clear();
    callCallbacks.clear();
    errorCallbacks.clear();
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    isConnecting = false;
    console.log('🔄 ChatService réinitialisé');
  },
};

export default ChatService;