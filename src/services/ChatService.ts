// src/services/ChatService.ts
import api from './api';
import { Conversation, Message } from '../types';
import { getSocketUrl } from '../config';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let socketUrl: string | null = null;

const messageCallbacks = new Set<(msg: Message) => void>();
const typingCallbacks = new Set<(data: { userId: string; isTyping: boolean }) => void>();
const onlineStatusCallbacks = new Set<(data: { userId: string; isOnline: boolean }) => void>();
const callCallbacks = new Set<(data: any) => void>();
const errorCallbacks = new Set<(error: any) => void>();

export const ChatService = {
  connect: async (token: string): Promise<Socket> => {
    if (!socketUrl) {
      socketUrl = await getSocketUrl();
    }

    if (!socket) {
      console.log('🔌 Connexion au socket...', socketUrl);
      
      socket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      socket.on('connect', () => {
        console.log('✅ Socket connecté avec succès');
      });

      socket.on('disconnect', (reason: string) => {
        console.log('❌ Socket déconnecté:', reason);
        if (reason === 'io server disconnect') {
          setTimeout(() => {
            if (socket) {
              socket.connect();
            }
          }, 1000);
        }
      });

      socket.on('connect_error', (error: Error) => {
        console.error('❌ Erreur de connexion socket:', error.message);
        errorCallbacks.forEach((callback) => callback(error));
      });

      socket.on('reconnect', (attemptNumber: number) => {
        console.log(`🔄 Socket reconnecté après ${attemptNumber} tentatives`);
      });

      socket.on('reconnect_error', (error: Error) => {
        console.error('❌ Erreur de reconnexion:', error.message);
      });

      socket.on('newMessage', (msg: Message) => {
        console.log('📩 Nouveau message reçu:', msg.id);
        messageCallbacks.forEach((callback) => {
          try {
            callback(msg);
          } catch (error) {
            console.error('Erreur dans callback newMessage:', error);
          }
        });
      });

      socket.on('userTyping', (data: { userId: string; isTyping: boolean }) => {
        typingCallbacks.forEach((callback) => {
          try {
            callback(data);
          } catch (error) {
            console.error('Erreur dans callback userTyping:', error);
          }
        });
      });

      socket.on('userOnline', (data: { userId: string; isOnline: boolean }) => {
        onlineStatusCallbacks.forEach((callback) => {
          try {
            callback(data);
          } catch (error) {
            console.error('Erreur dans callback userOnline:', error);
          }
        });
      });

      socket.on('incomingCall', (data: any) => {
        console.log('📞 Appel entrant:', data);
        callCallbacks.forEach((callback) => {
          try {
            callback({ ...data, from: data.callerId || data.from });
          } catch (error) {
            console.error('Erreur dans callback incomingCall:', error);
          }
        });
      });

      socket.on('callAnswered', (data: any) => {
        console.log('📞 Appel répond:', data);
        callCallbacks.forEach((callback) => {
          try {
            callback({ ...data, accepted: true });
          } catch (error) {
            console.error('Erreur dans callback callAnswered:', error);
          }
        });
      });

      socket.on('callRejected', (data: any) => {
        console.log('📞 Appel rejeté:', data);
        callCallbacks.forEach((callback) => {
          try {
            callback({ ...data, accepted: false });
          } catch (error) {
            console.error('Erreur dans callback callRejected:', error);
          }
        });
      });

      socket.on('error', (data: any) => {
        console.error('❌ Erreur socket (serveur):', data);
        errorCallbacks.forEach((callback) => {
          try {
            callback(data);
          } catch (error) {
            console.error('Erreur dans callback error:', error);
          }
        });
      });
    }

    if (!socket.connected) {
      console.log('🔄 Tentative de reconnexion...');
      socket.connect();
    }

    return socket;
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  getSocket: (): Socket | null => socket,

  isConnected: (): boolean => {
    return socket?.connected || false;
  },

  getConversations: async (): Promise<Conversation[]> => {
    try {
      const res = await api.get('/chat/conversations');
      return res.data;
    } catch (error) {
      console.error('Erreur getConversations:', error);
      return [];
    }
  },

  getMessages: async (otherUserId: string, page = 1, limit = 20): Promise<Message[]> => {
    try {
      const res = await api.get(`/chat/messages/${otherUserId}`, {
        params: { page, limit },
      });
      return res.data;
    } catch (error) {
      console.error('Erreur getMessages:', error);
      return [];
    }
  },

  sendMessage: async (data: {
    receiverId: string;
    type: string;
    content?: string;
    emoji?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    moneyTransfer?: { amount: number };
  }) => {
    try {
      // 1. D'abord envoyer via HTTP (plus fiable)
      console.log('📤 Envoi message via HTTP:', data);
      const response = await api.post('/chat/send', data);
      
      // 2. Puis via socket si connecté (pour la réactivité)
      if (socket?.connected) {
        console.log('📤 Envoi message via socket (supplémentaire):', data);
        socket.emit('sendMessage', data);
      } else {
        console.warn('⚠️ Socket non connecté, message envoyé via HTTP uniquement');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur envoi message HTTP:', error);
      
      // Si l'API échoue mais que le socket est connecté, essayer via socket
      if (socket?.connected) {
        console.log('📤 Tentative d\'envoi via socket uniquement');
        socket.emit('sendMessage', data);
        return { success: true, socketOnly: true };
      }
      
      throw error;
    }
  },

  markAsRead: async (senderId: string) => {
    try {
      const res = await api.post(`/chat/read/${senderId}`);
      return res.data;
    } catch (error) {
      console.error('Erreur markAsRead:', error);
      return null;
    }
  },

  updateMessage: async (messageId: string, content: string) => {
    try {
      const res = await api.put(`/chat/message/${messageId}`, { content });
      return res.data;
    } catch (error) {
      console.error('Erreur updateMessage:', error);
      throw error;
    }
  },

  deleteMessage: async (messageId: string) => {
    try {
      const res = await api.delete(`/chat/message/${messageId}`);
      return res.data;
    } catch (error) {
      console.error('Erreur deleteMessage:', error);
      throw error;
    }
  },

  uploadFile: async (file: { uri: string; name: string; type: string }) => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
      
      const res = await api.post('/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      return res.data;
    } catch (error) {
      console.error('Erreur uploadFile:', error);
      throw error;
    }
  },

  startCall: (receiverId: string, type: 'audio' | 'video') => {
    if (socket?.connected) {
      console.log('📞 Début d\'appel:', { receiverId, type });
      socket.emit('startCall', { receiverId, type });
    } else {
      console.warn('⚠️ Socket non connecté, impossible de démarrer un appel');
    }
  },

  answerCall: (callerId: string, accepted: boolean) => {
    if (socket?.connected) {
      console.log('📞 Réponse à l\'appel:', { callerId, accepted });
      socket.emit('answerCall', { callerId, accepted });
    } else {
      console.warn('⚠️ Socket non connecté, impossible de répondre à l\'appel');
    }
  },

  endCall: (receiverId: string) => {
    if (socket?.connected) {
      socket.emit('endCall', { receiverId });
    }
  },

  sendTyping: (receiverId: string, isTyping: boolean) => {
    if (socket?.connected) {
      socket.emit('typing', { receiverId, isTyping });
    }
  },

  onNewMessage: (callback: (msg: Message) => void): (() => void) => {
    messageCallbacks.add(callback);
    return () => {
      messageCallbacks.delete(callback);
    };
  },

  onTyping: (callback: (data: { userId: string; isTyping: boolean }) => void): (() => void) => {
    typingCallbacks.add(callback);
    return () => {
      typingCallbacks.delete(callback);
    };
  },

  onOnlineStatus: (callback: (data: { userId: string; isOnline: boolean }) => void): (() => void) => {
    onlineStatusCallbacks.add(callback);
    return () => {
      onlineStatusCallbacks.delete(callback);
    };
  },

  onCall: (callback: (data: any) => void): (() => void) => {
    callCallbacks.add(callback);
    return () => {
      callCallbacks.delete(callback);
    };
  },

  onError: (callback: (error: any) => void): (() => void) => {
    errorCallbacks.add(callback);
    return () => {
      errorCallbacks.delete(callback);
    };
  },

  // Ajoutez ces méthodes à ChatService si elles manquent :

  removeReaction: async (messageId: string) => {
    try {
      const res = await api.delete(`/chat/message/${messageId}/react`);
      return res.data;
    } catch (error) {
      console.error('Erreur removeReaction:', error);
      throw error;
    }
  },

  reactToMessage: async (messageId: string, emoji: string) => {
    try {
      const res = await api.post(`/chat/message/${messageId}/react`, { emoji });
      return res.data;
    } catch (error) {
      console.error('Erreur reactToMessage:', error);
      throw error;
    }
  },

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
  },
};