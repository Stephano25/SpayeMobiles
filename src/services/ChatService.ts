import api from './api';
import { Conversation, Message } from '../types';
import { getSocketUrl } from '../config';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let socketUrl: string | null = null;

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
      });
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

  getConversations: async (): Promise<Conversation[]> => {
    const res = await api.get('/chat/conversations');
    return res.data;
  },

  getMessages: async (otherUserId: string, page = 1, limit = 20): Promise<Message[]> => {
    const res = await api.get(`/chat/messages/${otherUserId}`, { params: { page, limit } });
    return res.data;
  },

  sendMessage: (data: { receiverId: string; type: string; content?: string; emoji?: string; fileUrl?: string; fileName?: string; fileSize?: number; moneyTransfer?: { amount: number } }) => {
    if (socket?.connected) {
      socket.emit('sendMessage', data);
    } else {
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

  onNewMessage: (callback: (msg: Message) => void) => {
    if (socket) {
      socket.on('newMessage', callback);
      return () => socket?.off('newMessage', callback);
    }
    return () => {};
  },

  onTyping: (callback: (data: { userId: string; isTyping: boolean }) => void) => {
    if (socket) {
      socket.on('userTyping', callback);
      return () => socket?.off('userTyping', callback);
    }
    return () => {};
  },

  onOnlineStatus: (callback: (data: { userId: string; isOnline: boolean }) => void) => {
    if (socket) {
      socket.on('userOnline', callback);
      return () => socket?.off('userOnline', callback);
    }
    return () => {};
  },

  sendTyping: (receiverId: string, isTyping: boolean) => {
    if (socket?.connected) {
      socket.emit('typing', { receiverId, isTyping });
    }
  },
};