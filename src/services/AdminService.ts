// src/services/AdminService.ts
import api from './api';

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

export const AdminService = {
  // Dashboard
  getDashboardStats: async (): Promise<AdminDashboardStats> => {
    try {
      const data = await api.get<AdminDashboardStats>('/admin/dashboard/stats');
      return data;
    } catch (error) {
      console.error('Erreur getDashboardStats:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalTransactions: 0,
        totalVolume: 0,
        recentUsers: [],
        recentTransactions: [],
        dailyStats: [],
        topUsers: [],
        totalAdmins: 0,
        totalSuperAdmins: 0,
        adminTransactions: 0,
        adminVolume: 0,
        myAdminTransactions: 0,
        myAdminVolume: 0,
        userRole: 'admin',
      };
    }
  },

  // Utilisateurs
  getAllUsers: async (): Promise<any[]> => {
    try {
      const data = await api.get<any[]>('/admin/users');
      return data || [];
    } catch (error) {
      console.error('Erreur getAllUsers:', error);
      return [];
    }
  },

  getUserById: async (userId: string): Promise<any> => {
    return api.get(`/admin/users/${userId}`);
  },

  updateUserStatus: async (userId: string, isActive: boolean): Promise<any> => {
    return api.patch(`/admin/users/${userId}/status`, { isActive });
  },

  updateUserRole: async (userId: string, role: string): Promise<any> => {
    return api.patch(`/admin/users/${userId}/role`, { role });
  },

  deleteUser: async (userId: string): Promise<any> => {
    return api.delete(`/admin/users/${userId}`);
  },

  // Admin Actions
  depositMoney: async (userId: string, amount: number, description?: string, qrCode?: string): Promise<any> => {
    return api.post(`/admin/users/${userId}/deposit`, { amount, description, qrCode });
  },

  withdrawMoney: async (userId: string, amount: number, description?: string, qrCode?: string): Promise<any> => {
    return api.post(`/admin/users/${userId}/withdraw`, { amount, description, qrCode });
  },

  // QR Code
  generateQRCode: async (type: 'deposit' | 'withdraw', amount?: number): Promise<any> => {
    try {
    const response = await api.post('/admin/generate-qr', { type, amount });
      return response;
    } catch (error) {
      console.error('❌ Erreur génération QR:', error);
      throw error;
    }
  },

  scanQRCode: async (qrData: string): Promise<any> => {
    try {
      const response = await api.post('/admin/scan-qr', { qrData });
      return response;
    } catch (error) {
      console.error('❌ Erreur scan QR:', error);
      throw error;
    }
  },

  // Administrateurs
  createAdmin: async (adminData: any): Promise<any> => {
    return api.post('/admin/admins', adminData);
  },

  getAdmins: async (): Promise<any[]> => {
    try {
      const data = await api.get<any[]>('/admin/admins');
      return data || [];
    } catch (error) {
      console.error('Erreur getAdmins:', error);
      return [];
    }
  },

  deleteAdmin: async (adminId: string): Promise<any> => {
    return api.delete(`/admin/admins/${adminId}`);
  },

  // Transactions
  getAllTransactions: async (): Promise<any[]> => {
    try {
      const data = await api.get<any[]>('/admin/transactions');
      return data || [];
    } catch (error) {
      console.error('Erreur getAllTransactions:', error);
      return [];
    }
  },

  getTransactionById: async (transactionId: string): Promise<any> => {
    return api.get(`/admin/transactions/${transactionId}`);
  },

  // Paramètres
  getSettings: async (): Promise<SystemSettings> => {
    try {
      return await api.get<SystemSettings>('/admin/settings');
    } catch (error) {
      console.error('Erreur getSettings:', error);
      return {
        general: {
          siteName: 'SPaye',
          siteUrl: 'https://spaye.com',
          adminEmail: 'admin@spaye.com',
          supportEmail: 'support@spaye.com',
          maintenanceMode: false,
          registrationEnabled: true,
          defaultUserRole: 'user',
          maxFileSize: 150,
          sessionTimeout: 30,
        },
        security: {
          twoFactorAuth: false,
          passwordMinLength: 8,
          passwordRequireUppercase: true,
          passwordRequireNumbers: true,
          passwordRequireSpecial: true,
          maxLoginAttempts: 5,
          lockoutDuration: 30,
          sessionTimeout: 60,
          requireEmailVerification: true,
          requirePhoneVerification: false,
        },
        payment: {
          minTransaction: 100,
          maxTransaction: 5000000,
          dailyTransferLimit: 5000000,
          monthlyTransferLimit: 50000000,
          mobileMoneyEnabled: true,
          mobileMoneyOperators: { airtel: true, orange: true, mvola: true },
          transferFees: { airtel: 0.5, orange: 0.5, mvola: 0.5, internal: 0 },
          currency: 'Ar',
        },
      };
    }
  },

  updateSettings: async (settings: SystemSettings): Promise<SystemSettings> => {
    return api.patch<SystemSettings>('/admin/settings', settings);
  },

  // Système
  getSystemLogs: async (): Promise<any[]> => {
    try {
      const data = await api.get<any[]>('/admin/system/logs');
      return data || [];
    } catch {
      return [];
    }
  },

  getSystemStats: async (): Promise<any> => {
    try {
      return await api.get('/admin/system/stats');
    } catch {
      return { uptime: '0s', memoryUsage: '0 MB' };
    }
  },

  clearCache: async (): Promise<any> => {
    return api.post('/admin/system/clear-cache');
  },

  // Profil Admin
  getAdminProfile: async (): Promise<any> => {
    return api.get('/admin/profile');
  },

  updateAdminProfile: async (profileData: any): Promise<any> => {
    return api.patch('/admin/profile', profileData);
  },
};