// src/services/FriendService.ts
import api from './api';

export const FriendService = {
  getFriends: async (): Promise<any[]> => {
    try {
      const res = await api.get('/friends');
      return res.data || [];
    } catch {
      return [];
    }
  },

  getFriendRequests: async (): Promise<any[]> => {
    try {
      const res = await api.get('/friends/requests');
      return res.data || [];
    } catch {
      return [];
    }
  },

  getSuggestions: async (): Promise<any[]> => {
    try {
      const res = await api.get('/friends/suggestions');
      return res.data || [];
    } catch {
      return [];
    }
  },

  getBlockedUsers: async (): Promise<any[]> => {
    try {
      const res = await api.get('/friends/blocked');
      return res.data || [];
    } catch {
      return [];
    }
  },

  searchUsers: async (query: string): Promise<any[]> => {
    try {
      const res = await api.get('/friends/search', { params: { q: query } });
      return res.data || [];
    } catch {
      return [];
    }
  },

  sendFriendRequest: async (friendId: string): Promise<any> => {
    try {
      const res = await api.post(`/friends/request/${friendId}`);
      return res.data;
    } catch {
      throw new Error('Erreur envoi demande');
    }
  },

  acceptFriendRequest: async (requestId: string): Promise<any> => {
    try {
      const res = await api.post(`/friends/accept/${requestId}`);
      return res.data;
    } catch {
      throw new Error('Erreur acceptation');
    }
  },

  declineFriendRequest: async (requestId: string): Promise<any> => {
    try {
      const res = await api.post(`/friends/decline/${requestId}`);
      return res.data;
    } catch {
      throw new Error('Erreur refus');
    }
  },

  blockUser: async (userId: string): Promise<any> => {
    try {
      const res = await api.post(`/friends/block/${userId}`);
      return res.data;
    } catch {
      throw new Error('Erreur blocage');
    }
  },

  unblockUser: async (userId: string): Promise<any> => {
    try {
      const res = await api.post(`/friends/unblock/${userId}`);
      return res.data;
    } catch {
      throw new Error('Erreur déblocage');
    }
  },

  removeFriend: async (friendId: string): Promise<any> => {
    try {
      const res = await api.delete(`/friends/${friendId}`);
      return res.data;
    } catch {
      throw new Error('Erreur suppression');
    }
  },
};