import api from './api';
import { Conversation, Message } from '../types';
import { getSocketUrl } from '../config';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let socketUrl: string | null = null;
let messageCallbacks: ((msg: Message) => void)[] = [];
let typingCallbacks: ((data: { userId: string; isTyping: boolean }) => void)[] = [];
let onlineStatusCallbacks: ((data: { userId: string; isOnline: boolean }) => void)[] = [];
let callCallbacks: ((data: any) => void)[] = [];

export const ChatService = {
  connect: async (token: string): Promise<Socket> => {
    if (!socketUrl) {
      socketUrl = await getSocketUrl();
    }

    if (!socket) {
      socket = io(socketUrl, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socket.on('connect', () => {
        console.log('✅ Socket connecté');
      });

      socket.on('disconnect', () => {
        console.log('❌ Socket déconnecté');
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Erreur de connexion socket:', error);
      });

      // Écouter les nouveaux messages
      socket.on('newMessage', (msg: Message) => {
        messageCallbacks.forEach((callback) => callback(msg));
      });

      // Écouter le typing
      socket.on('userTyping', (data: { userId: string; isTyping: boolean }) => {
        typingCallbacks.forEach((callback) => callback(data));
      });

      // Écouter les changements de statut en ligne
      socket.on('userOnline', (data: { userId: string; isOnline: boolean }) => {
        onlineStatusCallbacks.forEach((callback) => callback(data));
      });

      // Écouter les appels entrants
      socket.on('incomingCall', (data: any) => {
        callCallbacks.forEach((callback) => callback(data));
      });

      // Écouter les réponses d'appel
      socket.on('callAnswered', (data: any) => {
        callCallbacks.forEach((callback) => callback(data));
      });

      // Écouter les erreurs
      socket.on('error', (data: any) => {
        console.error('❌ Erreur socket:', data);
      });
    }

    return socket;
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
      messageCallbacks = [];
      typingCallbacks = [];
      onlineStatusCallbacks = [];
      callCallbacks = [];
    }
  },

  getSocket: (): Socket | null => socket,

  getConversations: async (): Promise<Conversation[]> => {
    const res = await api.get('/chat/conversations');
    return res.data;
  },

  getMessages: async (otherUserId: string, page = 1, limit = 20): Promise<Message[]> => {
    const res = await api.get(`/chat/messages/${otherUserId}`, {
      params: { page, limit },
    });
    return res.data;
  },

  sendMessage: (data: {
    receiverId: string;
    type: string;
    content?: string;
    emoji?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    moneyTransfer?: { amount: number };
  }) => {
    if (socket?.connected) {
      socket.emit('sendMessage', data);
    } else {
      console.warn('Socket non connecté, envoi via HTTP');
      return api.post('/chat/send', data);
    }
  },

  markAsRead: async (senderId: string) => {
    const res = await api.post(`/chat/read/${senderId}`);
    return res.data;
  },

  updateMessage: async (messageId: string, content: string) => {
    const res = await api.put(`/chat/message/${messageId}`, { content });
    return res.data;
  },

  deleteMessage: async (messageId: string) => {
    const res = await api.delete(`/chat/message/${messageId}`);
    return res.data;
  },

  uploadFile: async (file: { uri: string; name: string; type: string }) => {
    const formData = new FormData();
    formData.append('file', file as any);
    const res = await api.post('/chat/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
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

  onNewMessage: (callback: (msg: Message) => void) => {
    messageCallbacks.push(callback);
    return () => {
      messageCallbacks = messageCallbacks.filter((cb) => cb !== callback);
    };
  },

  onTyping: (callback: (data: { userId: string; isTyping: boolean }) => void) => {
    typingCallbacks.push(callback);
    return () => {
      typingCallbacks = typingCallbacks.filter((cb) => cb !== callback);
    };
  },

  onOnlineStatus: (callback: (data: { userId: string; isOnline: boolean }) => void) => {
    onlineStatusCallbacks.push(callback);
    return () => {
      onlineStatusCallbacks = onlineStatusCallbacks.filter((cb) => cb !== callback);
    };
  },

  onCall: (callback: (data: any) => void) => {
    callCallbacks.push(callback);
    return () => {
      callCallbacks = callCallbacks.filter((cb) => cb !== callback);
    };
  },

  sendTyping: (receiverId: string, isTyping: boolean) => {
    if (socket?.connected) {
      socket.emit('typing', { receiverId, isTyping });
    }
  },
};