import api from './api';
import { Friend } from '../types';

export const FriendService = {
  // GET /friends
  getFriends: async (): Promise<Friend[]> => {
    const res = await api.get<Friend[]>('/friends');
    return res.data;
  },

  // GET /friends/requests
  getFriendRequests: async () => {
    const res = await api.get('/friends/requests');
    return res.data;
  },

  // GET /friends/suggestions
  getSuggestions: async () => {
    const res = await api.get('/friends/suggestions');
    return res.data;
  },

  // GET /friends/blocked
  getBlockedUsers: async (): Promise<Friend[]> => {
    const res = await api.get<Friend[]>('/friends/blocked');
    return res.data;
  },

  // GET /friends/search?q=
  searchUsers: async (query: string) => {
    const res = await api.get('/friends/search', { params: { q: query } });
    return res.data;
  },

  // GET /friends/block-status/:userId
  checkBlockStatus: async (userId: string) => {
    const res = await api.get(`/friends/block-status/${userId}`);
    return res.data;
  },

  // POST /friends/request/:friendId
  sendFriendRequest: async (friendId: string) => {
    const res = await api.post(`/friends/request/${friendId}`);
    return res.data;
  },

  // POST /friends/accept/:requestId
  acceptFriendRequest: async (requestId: string) => {
    const res = await api.post(`/friends/accept/${requestId}`);
    return res.data;
  },

  // POST /friends/decline/:requestId
  declineFriendRequest: async (requestId: string) => {
    const res = await api.post(`/friends/decline/${requestId}`);
    return res.data;
  },

  // POST /friends/block/:userId
  blockUser: async (userId: string) => {
    const res = await api.post(`/friends/block/${userId}`);
    return res.data;
  },

  // POST /friends/unblock/:userId
  unblockUser: async (userId: string) => {
    const res = await api.post(`/friends/unblock/${userId}`);
    return res.data;
  },

  // DELETE /friends/:friendId
  removeFriend: async (friendId: string) => {
    const res = await api.delete(`/friends/${friendId}`);
    return res.data;
  },

  // POST /friends/find-by-phones
  findUsersByPhones: async (phones: string[]) => {
    const res = await api.post('/friends/find-by-phones', { phones });
    return res.data;
  },
};