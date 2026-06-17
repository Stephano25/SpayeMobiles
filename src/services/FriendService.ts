import api from './api';
import { Friend } from '../types';

export const FriendService = {
  getFriends: async (): Promise<any[]> => {
    try {
      const res = await api.get('/friends');
      return res.data || [];
    } catch (error) {
      console.error('Erreur getFriends:', error);
      return [];
    }
  },

  getFriendRequests: async (): Promise<any[]> => {
    try {
      const res = await api.get('/friends/requests');
      return res.data || [];
    } catch (error) {
      console.error('Erreur getFriendRequests:', error);
      return [];
    }
  },

  getSuggestions: async (): Promise<any[]> => {
    try {
      const res = await api.get('/friends/suggestions');
      return res.data || [];
    } catch (error) {
      console.error('Erreur getSuggestions:', error);
      return [];
    }
  },

  getBlockedUsers: async (): Promise<any[]> => {
    try {
      const res = await api.get('/friends/blocked');
      return res.data || [];
    } catch (error) {
      console.error('Erreur getBlockedUsers:', error);
      return [];
    }
  },

  searchUsers: async (query: string): Promise<any[]> => {
    try {
      const res = await api.get('/friends/search', { params: { q: query } });
      return res.data || [];
    } catch (error) {
      console.error('Erreur searchUsers:', error);
      return [];
    }
  },

  checkBlockStatus: async (userId: string): Promise<any> => {
    try {
      const res = await api.get(`/friends/block-status/${userId}`);
      return res.data || { isBlocked: false, canMessage: true };
    } catch (error) {
      console.error('Erreur checkBlockStatus:', error);
      return { isBlocked: false, canMessage: true };
    }
  },

  sendFriendRequest: async (friendId: string): Promise<any> => {
    try {
      const res = await api.post(`/friends/request/${friendId}`);
      return res.data;
    } catch (error) {
      console.error('Erreur sendFriendRequest:', error);
      throw error;
    }
  },

  acceptFriendRequest: async (requestId: string): Promise<any> => {
    try {
      const res = await api.post(`/friends/accept/${requestId}`);
      return res.data;
    } catch (error) {
      console.error('Erreur acceptFriendRequest:', error);
      throw error;
    }
  },

  declineFriendRequest: async (requestId: string): Promise<any> => {
    try {
      const res = await api.post(`/friends/decline/${requestId}`);
      return res.data;
    } catch (error) {
      console.error('Erreur declineFriendRequest:', error);
      throw error;
    }
  },

  blockUser: async (userId: string): Promise<any> => {
    try {
      const res = await api.post(`/friends/block/${userId}`);
      return res.data;
    } catch (error) {
      console.error('Erreur blockUser:', error);
      throw error;
    }
  },

  unblockUser: async (userId: string): Promise<any> => {
    try {
      const res = await api.post(`/friends/unblock/${userId}`);
      return res.data;
    } catch (error) {
      console.error('Erreur unblockUser:', error);
      throw error;
    }
  },

  removeFriend: async (friendId: string): Promise<any> => {
    try {
      const res = await api.delete(`/friends/${friendId}`);
      return res.data;
    } catch (error) {
      console.error('Erreur removeFriend:', error);
      throw error;
    }
  },

  findUsersByPhones: async (phones: string[]): Promise<any[]> => {
    try {
      const res = await api.post('/friends/find-by-phones', { phones });
      return res.data || [];
    } catch (error) {
      console.error('Erreur findUsersByPhones:', error);
      return [];
    }
  },
};