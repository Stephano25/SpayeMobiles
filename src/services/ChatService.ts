import api from './api';
import { Conversation, Message } from '../types';

export const ChatService = {
  // GET /chat/conversations -> objets plats { userId, firstName, lastName, lastMessage, lastMessageTime, unreadCount }
  getConversations: async (): Promise<Conversation[]> => {
    const res = await api.get<Conversation[]>('/chat/conversations');
    return res.data;
  },

  // GET /chat/messages/:userId?page=&limit=
  getMessages: async (otherUserId: string, page = 1, limit = 20): Promise<Message[]> => {
    const res = await api.get<Message[]>(`/chat/messages/${otherUserId}`, { params: { page, limit } });
    return res.data;
  },

  // POST /chat/send (fallback HTTP; normalement via socket)
  sendMessage: async (data: { receiverId: string; type: string; content?: string; emoji?: string; fileUrl?: string; fileName?: string; fileSize?: number; moneyTransfer?: { amount: number } }) => {
    const res = await api.post('/chat/send', data);
    return res.data;
  },

  // POST /chat/read/:senderId
  markAsRead: async (senderId: string) => {
    const res = await api.post(`/chat/read/${senderId}`);
    return res.data;
  },

  // PUT /chat/message/:messageId
  updateMessage: async (messageId: string, content: string) => {
    const res = await api.put(`/chat/message/${messageId}`, { content });
    return res.data;
  },

  // DELETE /chat/message/:messageId
  deleteMessage: async (messageId: string) => {
    const res = await api.delete(`/chat/message/${messageId}`);
    return res.data;
  },

  // POST /chat/upload (multipart)
  uploadFile: async (file: { uri: string; name: string; type: string }) => {
    const formData = new FormData();
    formData.append('file', file as any);
    const res = await api.post('/chat/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};