// src/services/FriendService.ts
import api from './api';
import { Friend, FriendRequest, SearchUser } from '../types';

export interface BlockStatus {
  isBlocked: boolean;
  blockedBy?: string;
  canMessage: boolean;
}

export const FriendService = {
  getFriends: async (): Promise<Friend[]> => {
    try {
      const res = await api.get('/friends');
      return res.data || [];
    } catch {
      return [];
    }
  },

  getFriendRequests: async (): Promise<FriendRequest[]> => {
    try {
      const res = await api.get('/friends/requests');
      return res.data || [];
    } catch {
      return [];
    }
  },

  getSuggestions: async (): Promise<SearchUser[]> => {
    try {
      const res = await api.get('/friends/suggestions');
      return res.data || [];
    } catch {
      return [];
    }
  },

  getBlockedUsers: async (): Promise<Friend[]> => {
    try {
      const res = await api.get('/friends/blocked');
      return res.data || [];
    } catch {
      return [];
    }
  },

  searchUsers: async (query: string): Promise<SearchUser[]> => {
    try {
      const res = await api.get('/friends/search', { params: { q: query } });
      return res.data || [];
    } catch {
      return [];
    }
  },

  sendFriendRequest: async (friendId: string): Promise<any> => {
    const res = await api.post(`/friends/request/${friendId}`);
    return res.data;
  },

  acceptFriendRequest: async (requestId: string): Promise<any> => {
    const res = await api.post(`/friends/accept/${requestId}`);
    return res.data;
  },

  declineFriendRequest: async (requestId: string): Promise<any> => {
    const res = await api.post(`/friends/decline/${requestId}`);
    return res.data;
  },

  removeFriend: async (friendId: string): Promise<any> => {
    const res = await api.delete(`/friends/${friendId}`);
    return res.data;
  },

  blockUser: async (userId: string): Promise<any> => {
    const res = await api.post(`/friends/block/${userId}`);
    return res.data;
  },

  unblockUser: async (userId: string): Promise<any> => {
    const res = await api.post(`/friends/unblock/${userId}`);
    return res.data;
  },

  checkBlockStatus: async (userId: string): Promise<BlockStatus> => {
    try {
      const res = await api.get(`/friends/block-status/${userId}`);
      return res.data;
    } catch {
      return { isBlocked: false, canMessage: true };
    }
  },

  findUsersByPhones: async (phones: string[]): Promise<SearchUser[]> => {
    try {
      const res = await api.post('/friends/find-by-phones', { phones });
      return res.data || [];
    } catch {
      return [];
    }
  },
};