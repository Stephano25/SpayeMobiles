export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  profilePicture?: string;
  balance: number;
  qrCode: string;
  role: 'user' | 'admin' | 'super_admin';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

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
    profilePicture?: string;
    isOnline?: boolean;
    lastSeen?: string;
  };
  blockedBy?: string;
}