// src/services/AdminService.ts
// ✅ Correction : utilisation de apiGet, apiPost, etc.
// ✅ Ajout des méthodes pour les transactions admin depuis l'user

import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './api';

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
  totalSuperAdminCommission?: number;
  totalAdminCommission?: number;
  totalCommissionTransactions?: number;
  recentCommissions?: any[];
  commissionRate?: number;
  myCommission?: number;
  myCommissionTransactions?: number;
  adminCommissions?: any[];
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
  // ============================================================
  // DASHBOARD
  // ============================================================
  getDashboardStats: async (): Promise<AdminDashboardStats> => {
    try {
      const data = await apiGet('/admin/dashboard/stats');
      return data;
    } catch (error) {
      console.error('❌ Erreur getDashboardStats:', error);
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
        totalSuperAdminCommission: 0,
        totalAdminCommission: 0,
        totalCommissionTransactions: 0,
        recentCommissions: [],
        commissionRate: 0.5,
        myCommission: 0,
        myCommissionTransactions: 0,
        adminCommissions: [],
      };
    }
  },

  getCommissionStats: async (): Promise<any> => {
    try {
      const data = await apiGet('/admin/dashboard/commissions');
      return data;
    } catch (error) {
      console.error('❌ Erreur getCommissionStats:', error);
      return {
        totalSuperAdminCommission: 0,
        totalAdminCommission: 0,
        totalCommissionTransactions: 0,
        recentCommissions: [],
        adminCommissions: [],
        myCommission: 0,
        myCommissionTransactions: 0,
        commissionRate: 0.5,
        userRole: 'admin',
      };
    }
  },

  // ============================================================
  // UTILISATEURS
  // ============================================================
  getAllUsers: async (): Promise<any[]> => {
    try {
      const data = await apiGet('/admin/users');
      return data?.data || data || [];
    } catch (error) {
      console.error('❌ Erreur getAllUsers:', error);
      return [];
    }
  },

  getUserById: async (userId: string): Promise<any> => {
    return apiGet(`/admin/users/${userId}`);
  },

  updateUserStatus: async (userId: string, isActive: boolean): Promise<any> => {
    return apiPatch(`/admin/users/${userId}/status`, { isActive });
  },

  updateUserRole: async (userId: string, role: string): Promise<any> => {
    return apiPatch(`/admin/users/${userId}/role`, { role });
  },

  deleteUser: async (userId: string): Promise<any> => {
    return apiDelete(`/admin/users/${userId}`);
  },

  // ============================================================
  // ADMIN ACTIONS - DÉPÔT & RETRAIT (depuis admin)
  // ============================================================
  
  // ✅ Dépôt par ADMIN vers un utilisateur
  depositMoney: async (userId: string, amount: number, description?: string, qrCode?: string): Promise<any> => {
    try {
      const response = await apiPost(`/admin/users/${userId}/deposit`, { 
        amount, 
        description: description || 'Dépôt administrateur', 
        qrCode 
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur depositMoney (admin):', error);
      throw error;
    }
  },

  // ✅ Retrait par ADMIN d'un utilisateur
  withdrawMoney: async (userId: string, amount: number, description?: string, qrCode?: string): Promise<any> => {
    try {
      const response = await apiPost(`/admin/users/${userId}/withdraw`, { 
        amount, 
        description: description || 'Retrait administrateur', 
        qrCode 
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur withdrawMoney (admin):', error);
      throw error;
    }
  },

  // ============================================================
  // ADMIN ACTIONS - DÉPÔT & RETRAIT (depuis USER via QR Code)
  // ============================================================
  
  // ✅ Dépôt par un UTILISATEUR (via QR Code admin)
  depositMoneyByUser: async (userId: string, amount: number, description?: string, qrData?: string): Promise<any> => {
    try {
      const response = await apiPost('/admin/deposit', {
        userId,
        amount,
        description: description || 'Dépôt via QR Code Admin',
        qrData,
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur depositMoneyByUser:', error);
      throw error;
    }
  },

  // ✅ Retrait par un UTILISATEUR (via QR Code admin)
  withdrawMoneyByUser: async (userId: string, amount: number, description?: string, qrData?: string): Promise<any> => {
    try {
      const response = await apiPost('/admin/withdraw', {
        userId,
        amount,
        description: description || 'Retrait via QR Code Admin',
        qrData,
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur withdrawMoneyByUser:', error);
      throw error;
    }
  },

  // ============================================================
  // QR CODE
  // ============================================================
  generateQRCode: async (type: 'deposit' | 'withdraw', amount?: number): Promise<any> => {
    try {
      const response = await apiPost('/admin/generate-qr', { type, amount });
      return response;
    } catch (error) {
      console.error('❌ Erreur génération QR:', error);
      throw error;
    }
  },

  scanQRCode: async (qrData: string): Promise<any> => {
    try {
      const response = await apiPost('/admin/scan-qr', { qrData });
      return response;
    } catch (error) {
      console.error('❌ Erreur scan QR:', error);
      throw error;
    }
  },

  // ============================================================
  // ADMINISTRATEURS
  // ============================================================
  createAdmin: async (adminData: any): Promise<any> => {
    return apiPost('/admin/admins', adminData);
  },

  getAdmins: async (): Promise<any[]> => {
    try {
      const data = await apiGet('/admin/admins');
      return data || [];
    } catch (error) {
      console.error('❌ Erreur getAdmins:', error);
      return [];
    }
  },

  deleteAdmin: async (adminId: string): Promise<any> => {
    return apiDelete(`/admin/admins/${adminId}`);
  },

  // ============================================================
  // TRANSACTIONS
  // ============================================================
  getAllTransactions: async (): Promise<any[]> => {
    try {
      const data = await apiGet('/admin/transactions');
      return data?.data || data || [];
    } catch (error) {
      console.error('❌ Erreur getAllTransactions:', error);
      return [];
    }
  },

  getTransactionById: async (transactionId: string): Promise<any> => {
    return apiGet(`/admin/transactions/${transactionId}`);
  },

  // ============================================================
  // PARAMÈTRES
  // ============================================================
  getSettings: async (): Promise<SystemSettings> => {
    try {
      const response = await apiGet('/admin/settings');
      return response;
    } catch (error) {
      console.error('❌ Erreur getSettings:', error);
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
    return apiPatch('/admin/settings', settings);
  },

  // ============================================================
  // SYSTÈME
  // ============================================================
  getSystemLogs: async (): Promise<any[]> => {
    try {
      const data = await apiGet('/admin/system/logs');
      return data?.data || data || [];
    } catch {
      return [];
    }
  },

  getSystemStats: async (): Promise<any> => {
    try {
      return await apiGet('/admin/system/stats');
    } catch {
      return { uptime: '0s', memoryUsage: '0 MB' };
    }
  },

  // ============================================================
  // PROFIL ADMIN
  // ============================================================
  getAdminProfile: async (): Promise<any> => {
    return apiGet('/admin/profile');
  },

  updateAdminProfile: async (profileData: any): Promise<any> => {
    return apiPatch('/admin/profile', profileData);
  },
};

export default AdminService;