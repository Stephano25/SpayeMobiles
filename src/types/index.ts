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
  friends?: string[];
  bio?: string;
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

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalVolume: number;
  recentUsers: User[];
  recentTransactions: Transaction[];
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
    mobileMoneyOperators: { airtel: boolean; orange: boolean; mvola: boolean };
    transferFees: { airtel: number; orange: number; mvola: number; internal: number };
    currency: string;
  };
}

export interface QRCodeResponse {
  qrCode: string;
  qrCodeImage?: string;
  data?: string;
  expiresAt: string;
  action?: 'deposit' | 'withdraw';
  amount?: number | null;
}

export interface QRScanResult {
  success: boolean;
  message: string;
  data?: any;
  valid?: boolean;
  action?: string;
  adminId?: string;
  adminName?: string;
  amount?: number;
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

export interface SearchUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  profilePicture?: string;
  isFriend: boolean;
  hasPendingRequest: boolean;
  isBlocked?: boolean;
  blockedBy?: string;
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
  content: string;
  type: 'text' | 'image' | 'file' | 'emoji' | 'money';
  createdAt: string;
  read: boolean;
  delivered?: boolean;
  reactions?: { userId: string; emoji: string }[];
  moneyTransfer?: {
    amount: number;
    status: 'pending' | 'completed' | 'failed';
    transactionId?: string;
    failReason?: string;
  };
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}