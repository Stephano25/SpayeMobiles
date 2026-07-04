// src/services/ChatService.ts
import api from './api';
import { Conversation, Message } from '../types';
import { getSocketUrl } from '../config/api';
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
        console.log('✅ Socket connecté');
      });

      socket.on('disconnect', (reason: string) => {
        console.log('❌ Socket déconnecté:', reason);
        if (reason === 'io server disconnect') {
          setTimeout(() => {
            if (socket) socket.connect();
          }, 1000);
        }
      });

      socket.on('connect_error', (error: Error) => {
        console.error('❌ Erreur socket:', error.message);
        errorCallbacks.forEach((cb) => cb(error));
      });

      socket.on('newMessage', (msg: Message) => {
        messageCallbacks.forEach((cb) => {
          try { cb(msg); } catch (e) { console.error(e); }
        });
      });

      socket.on('userTyping', (data: { userId: string; isTyping: boolean }) => {
        typingCallbacks.forEach((cb) => {
          try { cb(data); } catch (e) { console.error(e); }
        });
      });

      socket.on('userOnline', (data: { userId: string; isOnline: boolean }) => {
        onlineStatusCallbacks.forEach((cb) => {
          try { cb(data); } catch (e) { console.error(e); }
        });
      });

      socket.on('incomingCall', (data: any) => {
        callCallbacks.forEach((cb) => {
          try { cb({ ...data, from: data.callerId || data.from }); } catch (e) { console.error(e); }
        });
      });

      socket.on('callAnswered', (data: any) => {
        callCallbacks.forEach((cb) => {
          try { cb({ ...data, accepted: true }); } catch (e) { console.error(e); }
        });
      });

      socket.on('callRejected', (data: any) => {
        callCallbacks.forEach((cb) => {
          try { cb({ ...data, accepted: false }); } catch (e) { console.error(e); }
        });
      });

      socket.on('error', (data: any) => {
        errorCallbacks.forEach((cb) => {
          try { cb(data); } catch (e) { console.error(e); }
        });
      });
    }

    if (!socket.connected) {
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
  isConnected: (): boolean => socket?.connected || false,

  getConversations: async (): Promise<Conversation[]> => {
    try {
      const res = await api.get('/chat/conversations');
      return res.data;
    } catch {
      return [];
    }
  },

  getMessages: async (otherUserId: string, page = 1, limit = 20): Promise<Message[]> => {
    try {
      const res = await api.get(`/chat/messages/${otherUserId}`, { params: { page, limit } });
      return res.data;
    } catch {
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
      console.log('📤 Envoi message via HTTP:', data);
      const response = await api.post('/chat/send', data);

      if (socket?.connected) {
        console.log('📤 Envoi message via socket:', data);
        socket.emit('sendMessage', data);
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur envoi message:', error);
      if (socket?.connected) {
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
    } catch {
      return null;
    }
  },

  updateMessage: async (messageId: string, content: string) => {
    try {
      const res = await api.put(`/chat/message/${messageId}`, { content });
      return res.data;
    } catch {
      throw new Error('Erreur modification');
    }
  },

  deleteMessage: async (messageId: string) => {
    try {
      const res = await api.delete(`/chat/message/${messageId}`);
      return res.data;
    } catch {
      throw new Error('Erreur suppression');
    }
  },

  removeReaction: async (messageId: string) => {
    try {
      const res = await api.delete(`/chat/message/${messageId}/react`);
      return res.data;
    } catch {
      throw new Error('Erreur suppression réaction');
    }
  },

  reactToMessage: async (messageId: string, emoji: string) => {
    try {
      const res = await api.post(`/chat/message/${messageId}/react`, { emoji });
      return res.data;
    } catch {
      throw new Error('Erreur réaction');
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
    } catch {
      throw new Error('Erreur upload');
    }
  },

  startCall: (receiverId: string, type: 'audio' | 'video') => {
    if (socket?.connected) {
      socket.emit('startCall', { receiverId, type });
    }
  },

  answerCall: (callerId: string, accepted: boolean) => {
    if (socket?.connected) {
      socket.emit('answerCall', { callerId, accepted });
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
    return () => messageCallbacks.delete(callback);
  },

  onTyping: (callback: (data: { userId: string; isTyping: boolean }) => void): (() => void) => {
    typingCallbacks.add(callback);
    return () => typingCallbacks.delete(callback);
  },

  onOnlineStatus: (callback: (data: { userId: string; isOnline: boolean }) => void): (() => void) => {
    onlineStatusCallbacks.add(callback);
    return () => onlineStatusCallbacks.delete(callback);
  },

  onCall: (callback: (data: any) => void): (() => void) => {
    callCallbacks.add(callback);
    return () => callCallbacks.delete(callback);
  },

  onError: (callback: (error: any) => void): (() => void) => {
    errorCallbacks.add(callback);
    return () => errorCallbacks.delete(callback);
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