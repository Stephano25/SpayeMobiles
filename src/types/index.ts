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

// GET /wallet -> { balance: number } UNIQUEMENT (WalletService.getWallet côté NestJS)
export interface Wallet {
  balance: number;
}

export type TransactionType =
  | 'deposit' | 'withdrawal' | 'transfer' | 'payment' | 'mobile_money' | 'receive' | 'send';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'processing';

export interface TransactionUser {
  _id?: string;
  id?: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface Transaction {
  id: string;
  _id?: string;
  senderId: string | TransactionUser;
  receiverId?: string | TransactionUser;
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

// GET /transactions/user/stats -> TransactionsService.getDashboardStats()
export interface DashboardStats {
  totalBalance: number;
  totalTransactions: number;
  lastThreeTransactions: Transaction[];
  largestTransaction: Transaction | null;
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

// GET /admin/dashboard/stats -> AdminService.getDashboardStats()
export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalVolume: number;
  recentUsers: User[];
  recentTransactions: Transaction[];
  dailyStats: DailyStat[];
  topUsers: TopUser[];
}

// GET /chat/conversations -> ChatService.getConversations() (agrégation Mongo)
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

export type MessageType = 'text' | 'image' | 'file' | 'emoji' | 'money';

// GET /chat/messages/:userId -> MessageResponseDto
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
  moneyTransfer?: { amount: number; status: string; transactionId?: string };
  sender?: { id: string; firstName: string; lastName: string; profilePicture?: string };
}