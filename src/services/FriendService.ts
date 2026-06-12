import api from './api';
import { Friend } from '../types';

export const FriendService = {
  getFriends: () => api.get<Friend[]>('/friends').then(res => res.data),
  getFriendRequests: () => api.get<any[]>('/friends/requests').then(res => res.data),
  getSuggestions: () => api.get<any[]>('/friends/suggestions').then(res => res.data),
  getBlockedUsers: () => api.get<Friend[]>('/friends/blocked').then(res => res.data),
  searchUsers: (query: string) => api.get<any[]>('/friends/search', { params: { q: query } }).then(res => res.data),
  sendFriendRequest: (friendId: string) => api.post(`/friends/request/${friendId}`).then(res => res.data),
  acceptFriendRequest: (requestId: string) => api.post(`/friends/accept/${requestId}`).then(res => res.data),
  declineFriendRequest: (requestId: string) => api.post(`/friends/decline/${requestId}`).then(res => res.data),
  removeFriend: (friendId: string) => api.delete(`/friends/${friendId}`).then(res => res.data),
  blockUser: (userId: string) => api.post(`/friends/block/${userId}`).then(res => res.data),
  unblockUser: (userId: string) => api.post(`/friends/unblock/${userId}`).then(res => res.data),
};