import api from './api';
import { Friend } from '../types';

export const FriendService = {
  getFriends: async (): Promise<Friend[]> => {
    const res = await api.get('/friends');
    return res.data;
  },

  getFriendRequests: async () => {
    const res = await api.get('/friends/requests');
    return res.data;
  },

  getSuggestions: async () => {
    const res = await api.get('/friends/suggestions');
    return res.data;
  },

  getBlockedUsers: async (): Promise<Friend[]> => {
    const res = await api.get('/friends/blocked');
    return res.data;
  },

  searchUsers: async (query: string) => {
    const res = await api.get('/friends/search', { params: { q: query } });
    return res.data;
  },

  checkBlockStatus: async (userId: string) => {
    const res = await api.get(`/friends/block-status/${userId}`);
    return res.data;
  },

  sendFriendRequest: async (friendId: string) => {
    const res = await api.post(`/friends/request/${friendId}`);
    return res.data;
  },

  acceptFriendRequest: async (requestId: string) => {
    const res = await api.post(`/friends/accept/${requestId}`);
    return res.data;
  },

  declineFriendRequest: async (requestId: string) => {
    const res = await api.post(`/friends/decline/${requestId}`);
    return res.data;
  },

  blockUser: async (userId: string) => {
    const res = await api.post(`/friends/block/${userId}`);
    return res.data;
  },

  unblockUser: async (userId: string) => {
    const res = await api.post(`/friends/unblock/${userId}`);
    return res.data;
  },

  removeFriend: async (friendId: string) => {
    const res = await api.delete(`/friends/${friendId}`);
    return res.data;
  },

  findUsersByPhones: async (phones: string[]) => {
    const res = await api.post('/friends/find-by-phones', { phones });
    return res.data;
  },
};