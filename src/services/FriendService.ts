import api from './api';
import { Friend } from '../types';

export const FriendService = {
  getFriends: async (): Promise<Friend[]> => {
    const response = await api.get('/friends');
    return Array.isArray(response.data) ? response.data : [];
  },
  getFriendRequests: async (): Promise<any[]> => {
    const response = await api.get('/friends/requests');
    return response.data;
  },
  getSuggestions: async (): Promise<any[]> => {
    const response = await api.get('/friends/suggestions');
    return response.data;
  },
  getBlockedUsers: async (): Promise<Friend[]> => {
    const response = await api.get('/friends/blocked');
    return response.data;
  },
  searchUsers: async (query: string): Promise<any[]> => {
    const response = await api.get('/friends/search', { params: { q: query } });
    return response.data;
  },
  sendFriendRequest: async (friendId: string): Promise<any> => {
    const response = await api.post(`/friends/request/${friendId}`);
    return response.data;
  },
  acceptFriendRequest: async (requestId: string): Promise<any> => {
    const response = await api.post(`/friends/accept/${requestId}`);
    return response.data;
  },
  declineFriendRequest: async (requestId: string): Promise<any> => {
    const response = await api.post(`/friends/decline/${requestId}`);
    return response.data;
  },
  removeFriend: async (friendId: string): Promise<any> => {
    const response = await api.delete(`/friends/${friendId}`);
    return response.data;
  },
  blockUser: async (userId: string): Promise<any> => {
    const response = await api.post(`/friends/block/${userId}`);
    return response.data;
  },
  unblockUser: async (userId: string): Promise<any> => {
    const response = await api.post(`/friends/unblock/${userId}`);
    return response.data;
  },
};