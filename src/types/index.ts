// src/types/index.ts
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin' | 'super_admin';
  isActive: boolean;
  balance?: number;
  qrCode?: string;
  phoneNumber?: string;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'deposit' | 'withdraw';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  senderId?: string;
  receiverId?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalVolume: number;
  recentUsers: User[];
  recentTransactions: Transaction[];
  dailyStats: { date: string; count: number; volume: number }[];
  topUsers: { user: User; totalVolume: number; transactionCount: number }[];
  totalAdmins: number;
  totalSuperAdmins: number;
  adminTransactions: number;
  adminVolume: number;
  myAdminTransactions: number;
  myAdminVolume: number;
  userRole: string;
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
  data: string;
  expiresAt: string;
}

export interface QRScanResult {
  success: boolean;
  message: string;
  data?: any;
}