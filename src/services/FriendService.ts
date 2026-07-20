// src/services/FriendService.ts
// ─────────────────────────────────────────────────────────────
//  SPAYE — Friend Service
//  ✅ Correction : utilisation de apiGet, apiPost, apiDelete
//  ✅ Gestion du statut en ligne
//  ✅ Nettoyage des ID utilisateur
// ─────────────────────────────────────────────────────────────

import { apiGet, apiPost, apiDelete } from './api';

export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'blocked' | 'deleted';
  createdAt: string;
  friend?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    profilePicture?: string;
    isOnline?: boolean;
    lastSeen?: string;
  };
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
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
  hasIncomingRequest?: boolean;
  requestId?: string;
  isBlocked?: boolean;
  blockedBy?: string;
}

export interface BlockStatus {
  isBlocked: boolean;
  blockedBy?: string;
  canMessage: boolean;
}

export const FriendService = {
  /**
   * ✅ Récupère la liste des amis avec leur statut en ligne
   */
  getFriends: async (): Promise<Friend[]> => {
    try {
      const response = await apiGet('/friends');
      return response || [];
    } catch (error) {
      console.error('❌ Erreur getFriends:', error);
      return [];
    }
  },

  /**
   * ✅ Récupère les amis en ligne
   */
  getOnlineFriends: async (): Promise<Friend[]> => {
    try {
      const friends = await FriendService.getFriends();
      return friends.filter((f: Friend) => f.status === 'accepted' && f.friend?.isOnline === true);
    } catch (error) {
      console.error('❌ Erreur getOnlineFriends:', error);
      return [];
    }
  },

  /**
   * ✅ Récupère les demandes d'ami
   */
  getFriendRequests: async (): Promise<FriendRequest[]> => {
    try {
      const response = await apiGet('/friends/requests');
      return response || [];
    } catch (error) {
      console.error('❌ Erreur getFriendRequests:', error);
      return [];
    }
  },

  /**
   * ✅ Récupère les suggestions d'amis
   */
  getSuggestions: async (): Promise<SearchUser[]> => {
    try {
      const response = await apiGet('/friends/suggestions');
      return response || [];
    } catch (error) {
      console.error('❌ Erreur getSuggestions:', error);
      return [];
    }
  },

  /**
   * ✅ Récupère les utilisateurs bloqués
   */
  getBlockedUsers: async (): Promise<Friend[]> => {
    try {
      const response = await apiGet('/friends/blocked');
      return response || [];
    } catch (error) {
      console.error('❌ Erreur getBlockedUsers:', error);
      return [];
    }
  },

  /**
   * ✅ Recherche des utilisateurs
   */
  searchUsers: async (query: string): Promise<SearchUser[]> => {
    try {
      const response = await apiGet('/friends/search', { q: query });
      return response || [];
    } catch (error) {
      console.error('❌ Erreur searchUsers:', error);
      return [];
    }
  },

  /**
   * ✅ Envoie une demande d'ami - ID nettoyé
   */
  sendFriendRequest: async (friendId: string): Promise<any> => {
    const cleanId = String(friendId).replace(/[{}"'\s]/g, '').trim();
    
    console.log('📤 sendFriendRequest - ID nettoyé:', cleanId);
    
    if (!/^[0-9a-fA-F]{24}$/.test(cleanId)) {
      console.error('❌ ID utilisateur invalide:', cleanId);
      throw new Error('ID utilisateur invalide');
    }
    
    const response = await apiPost(`/friends/request/${cleanId}`);
    return response;
  },

  /**
   * ✅ Accepte une demande d'ami
   */
  acceptFriendRequest: async (requestId: string): Promise<any> => {
    const cleanId = String(requestId).replace(/[{}"'\s]/g, '').trim();
    const response = await apiPost(`/friends/accept/${cleanId}`);
    return response;
  },

  /**
   * ✅ Refuse une demande d'ami
   */
  declineFriendRequest: async (requestId: string): Promise<any> => {
    const cleanId = String(requestId).replace(/[{}"'\s]/g, '').trim();
    const response = await apiPost(`/friends/decline/${cleanId}`);
    return response;
  },

  /**
   * ✅ Supprime un ami
   */
  removeFriend: async (friendId: string): Promise<any> => {
    const cleanId = String(friendId).replace(/[{}"'\s]/g, '').trim();
    const response = await apiDelete(`/friends/${cleanId}`);
    return response;
  },

  /**
   * ✅ Bloque un utilisateur
   */
  blockUser: async (userId: string): Promise<any> => {
    const cleanId = String(userId).replace(/[{}"'\s]/g, '').trim();
    const response = await apiPost(`/friends/block/${cleanId}`);
    return response;
  },

  /**
   * ✅ Débloque un utilisateur
   */
  unblockUser: async (userId: string): Promise<any> => {
    const cleanId = String(userId).replace(/[{}"'\s]/g, '').trim();
    const response = await apiPost(`/friends/unblock/${cleanId}`);
    return response;
  },

  /**
   * ✅ Vérifie le statut de blocage
   */
  checkBlockStatus: async (userId: string): Promise<BlockStatus> => {
    try {
      const cleanId = String(userId).replace(/[{}"'\s]/g, '').trim();
      const response = await apiGet(`/friends/block-status/${cleanId}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur checkBlockStatus:', error);
      return { isBlocked: false, canMessage: true };
    }
  },

  /**
   * ✅ Trouve des utilisateurs par numéros de téléphone
   */
  findUsersByPhones: async (phones: string[]): Promise<SearchUser[]> => {
    try {
      const response = await apiPost('/friends/find-by-phones', { phones });
      return response || [];
    } catch (error) {
      console.error('❌ Erreur findUsersByPhones:', error);
      return [];
    }
  },
};

export default FriendService;