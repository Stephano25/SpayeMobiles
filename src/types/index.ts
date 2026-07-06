// src/types/index.ts
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin' | 'super_admin';
  isActive: boolean;
  phoneNumber?: string;
  profilePicture?: string;
  balance?: number;
  qrCode?: string;
  bio?: string;
  friends?: string[];
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'deposit' | 'withdraw' | 'payment' | 'mobile_money' | 'transfer';
  amount: number;
  fee?: number;
  totalAmount?: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'processing';
  senderId?: string;
  receiverId?: string;
  description?: string;
  reference?: string;
  paymentMethod?: string;
  mobileMoneyOperator?: string;
  mobileMoneyNumber?: string;
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  receiver?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
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

export interface Wallet {
  balance: number;
  currency?: string;
  userId?: string;
  qrCode?: string;
  dailyLimit?: number;
  monthlyLimit?: number;
  isActive?: boolean;
  totalSent?: number;
  totalReceived?: number;
  totalTransactions?: number;
  totalFees?: number;
  remainingDailyLimit?: number;
  remainingMonthlyLimit?: number;
  recentTransactions?: Transaction[];
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content?: string;
  type: 'text' | 'image' | 'file' | 'emoji' | 'money' | 'audio' | 'video';
  createdAt: string;
  isRead: boolean;
  isDelivered?: boolean;
  isEdited?: boolean;
  isDeleted?: boolean;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  emoji?: string;
  moneyTransfer?: {
    amount: number;
    status: 'pending' | 'completed' | 'failed';
    transactionId?: string;
    failReason?: string;
  };
  reactions?: { userId: string; emoji: string }[];
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
}

export interface Conversation {
  userId: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  lastMessage?: {
    content: string;
    type: string;
    createdAt: Date;
  };
  lastMessageTime: Date;
  unreadCount: number;
  isOnline?: boolean;
}

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalVolume: number;
  recentUsers: any[];
  recentTransactions: any[];
  dailyStats: { date: string; users: number; transactions: number; volume: number }[];
  topUsers: { userId: string; name: string; transactionCount: number; totalVolume: number }[];
  totalAdmins?: number;
  totalSuperAdmins?: number;
  adminTransactions?: number;
  adminVolume?: number;
  myAdminTransactions?: number;
  myAdminVolume?: number;
  userRole?: string;
}

export interface QRCodeResponse {
  qrCode: string;
  qrCodeImage?: string;
  expiresAt: string;
  action?: 'deposit' | 'withdraw';
  amount?: number | null;
}

export interface QRScanResult {
  valid: boolean;
  action?: 'deposit' | 'withdraw';
  adminId?: string;
  adminName?: string;
  amount?: number | null;
}