// src/services/FriendService.ts
import api from './api';

// ✅ Définition des types localement
export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    profilePicture?: string;
  };
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
}

export interface SearchUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  profilePicture?: string;
  isFriend: boolean;
  hasPendingRequest: boolean;
}

export interface BlockStatus {
  isBlocked: boolean;
  blockedBy?: string;
  canMessage: boolean;
}

export const FriendService = {
  getFriends: async (): Promise<Friend[]> => {
    try {
      const response = await api.get('/friends');
      return response || [];
    } catch {
      return [];
    }
  },

  getFriendRequests: async (): Promise<FriendRequest[]> => {
    try {
      const response = await api.get('/friends/requests');
      return response || [];
    } catch {
      return [];
    }
  },

  getSuggestions: async (): Promise<SearchUser[]> => {
    try {
      const response = await api.get('/friends/suggestions');
      return response || [];
    } catch {
      return [];
    }
  },

  getBlockedUsers: async (): Promise<Friend[]> => {
    try {
      const response = await api.get('/friends/blocked');
      return response || [];
    } catch {
      return [];
    }
  },

  searchUsers: async (query: string): Promise<SearchUser[]> => {
    try {
      const response = await api.get('/friends/search', { params: { q: query } });
      return response || [];
    } catch {
      return [];
    }
  },

  sendFriendRequest: async (friendId: string): Promise<any> => {
    const response = await api.post(`/friends/request/${friendId}`);
    return response;
  },

  acceptFriendRequest: async (requestId: string): Promise<any> => {
    const response = await api.post(`/friends/accept/${requestId}`);
    return response;
  },

  declineFriendRequest: async (requestId: string): Promise<any> => {
    const response = await api.post(`/friends/decline/${requestId}`);
    return response;
  },

  removeFriend: async (friendId: string): Promise<any> => {
    const response = await api.delete(`/friends/${friendId}`);
    return response;
  },

  blockUser: async (userId: string): Promise<any> => {
    const response = await api.post(`/friends/block/${userId}`);
    return response;
  },

  unblockUser: async (userId: string): Promise<any> => {
    const response = await api.post(`/friends/unblock/${userId}`);
    return response;
  },

  checkBlockStatus: async (userId: string): Promise<BlockStatus> => {
    try {
      const response = await api.get(`/friends/block-status/${userId}`);
      return response;
    } catch {
      return { isBlocked: false, canMessage: true };
    }
  },

  findUsersByPhones: async (phones: string[]): Promise<SearchUser[]> => {
    try {
      const response = await api.post('/friends/find-by-phones', { phones });
      return response || [];
    } catch {
      return [];
    }
  },
};