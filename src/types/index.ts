// src/types/index.ts
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
  bio?: string;
}

export interface LoginResponse {
  access_token: string;
  token: string;
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
    phoneNumber?: string;
    profilePicture?: string;
    isOnline?: boolean;
    lastSeen?: string;
  };
  blockedBy?: string;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
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
  email?: string;
  phoneNumber?: string;
  profilePicture?: string;
  isFriend?: boolean;
  hasPendingRequest?: boolean;
  isBlocked?: boolean;
  blockedBy?: string;
}

export interface Wallet {
  id?: string;
  userId?: string;
  balance: number;
  currency?: string;
  qrCode?: string;
  dailyLimit?: number;
  monthlyLimit?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type TransactionType = 'deposit' | 'withdrawal' | 'transfer' | 'payment' | 'mobile_money' | 'receive' | 'send';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'processing';

export interface Transaction {
  id: string;
  _id?: string;
  senderId: string | { id: string; firstName: string; lastName: string };
  receiverId?: string | { id: string; firstName: string; lastName: string };
  type: TransactionType;
  amount: number;
  fee?: number;
  totalAmount?: number;
  status: TransactionStatus;
  description?: string;
  reference?: string;
  mobileMoneyOperator?: string;
  mobileMoneyNumber?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Conversation {
  userId: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  lastMessage?: { content: string; type: string; createdAt: string };
  lastMessageTime: string;
  unreadCount: number;
  isOnline?: boolean;
}

export type MessageType = 'text' | 'image' | 'file' | 'emoji' | 'money' | 'audio' | 'video';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  type: MessageType;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  emoji?: string;
  isRead: boolean;
  isDelivered: boolean;
  createdAt: string;
  isDeleted?: boolean;
  isEdited?: boolean;
  moneyTransfer?: { amount: number; status: string; transactionId?: string; failReason?: string };
  sender?: { id: string; firstName: string; lastName: string; profilePicture?: string };
  reactions?: { emoji: string; userId: string }[];
}

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalVolume: number;
  recentUsers: User[];
  recentTransactions: Transaction[];
  dailyStats: DailyStat[];
  topUsers: TopUser[];
  totalAdmins?: number;
  totalSuperAdmins?: number;
  adminTransactions?: number;
  adminVolume?: number;
  myAdminTransactions?: number;
  myAdminVolume?: number;
  userRole?: string;
}

export interface DailyStat {
  date: string;
  users: number;
  transactions: number;
  volume: number;
}

export interface TopUser {
  userId: string;
  name: string;
  transactionCount: number;
  totalVolume: number;
}

export interface QRCodeResponse {
  qrCode: string;
  qrCodeImage: string;
  expiresAt: string;
  action: 'deposit' | 'withdraw';
  amount: number | null;
}

export interface QRScanResult {
  valid: boolean;
  action: 'deposit' | 'withdraw';
  adminId: string;
  adminName: string;
  amount: number | null;
}

export interface SystemSettings {
  general: {
    siteName: string;
    siteUrl: string;
    adminEmail: string;
    supportEmail: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    defaultUserRole: string;
    maxFileSize: number;
    sessionTimeout: number;
  };
  security: {
    twoFactorAuth: boolean;
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireNumbers: boolean;
    passwordRequireSpecial: boolean;
    maxLoginAttempts: number;
    lockoutDuration: number;
    sessionTimeout: number;
    requireEmailVerification: boolean;
    requirePhoneVerification: boolean;
  };
  payment: {
    minTransaction: number;
    maxTransaction: number;
    dailyTransferLimit: number;
    monthlyTransferLimit: number;
    mobileMoneyEnabled: boolean;
    mobileMoneyOperators: {
      airtel: boolean;
      orange: boolean;
      mvola: boolean;
    };
    transferFees: {
      airtel: number;
      orange: number;
      mvola: number;
      internal: number;
    };
    currency: string;
  };
}