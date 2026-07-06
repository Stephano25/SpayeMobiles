// src/services/AdminService.ts
import api from './api';
import { AdminDashboardStats, SystemSettings, QRCodeResponse, QRScanResult } from '../types';
import { User } from '../types';

export const AdminService = {
  // Dashboard
  getDashboardStats: async (): Promise<AdminDashboardStats> => {
    try {
      const res = await api.get('/admin/dashboard/stats');
      return res.data;
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
  getAllUsers: async (): Promise<User[]> => {
    try {
      const res = await api.get('/admin/users');
      return res.data || [];
    } catch (error) {
      console.error('Erreur getAllUsers:', error);
      return [];
    }
  },

  getUserById: async (userId: string): Promise<User> => {
    const res = await api.get(`/admin/users/${userId}`);
    return res.data;
  },

  updateUserStatus: async (userId: string, isActive: boolean): Promise<any> => {
    const res = await api.patch(`/admin/users/${userId}/status`, { isActive });
    return res.data;
  },

  updateUserRole: async (userId: string, role: string): Promise<any> => {
    const res = await api.patch(`/admin/users/${userId}/role`, { role });
    return res.data;
  },

  deleteUser: async (userId: string): Promise<any> => {
    const res = await api.delete(`/admin/users/${userId}`);
    return res.data;
  },

  // Admin Actions - Dépôt
  depositMoney: async (userId: string, amount: number, description?: string, qrCode?: string): Promise<any> => {
    const res = await api.post(`/admin/users/${userId}/deposit`, { amount, description, qrCode });
    return res.data;
  },

  // Admin Actions - Retrait
  withdrawMoney: async (userId: string, amount: number, description?: string, qrCode?: string): Promise<any> => {
    const res = await api.post(`/admin/users/${userId}/withdraw`, { amount, description, qrCode });
    return res.data;
  },

  // QR Code
  generateQRCode: async (type: 'deposit' | 'withdraw', amount?: number): Promise<QRCodeResponse> => {
    const res = await api.post('/admin/generate-qr', { type, amount });
    return res.data;
  },

  scanQRCode: async (qrData: string): Promise<QRScanResult> => {
    const res = await api.post('/admin/scan-qr', { qrData });
    return res.data;
  },

  // Administrateurs
  createAdmin: async (adminData: any): Promise<any> => {
    const res = await api.post('/admin/admins', adminData);
    return res.data;
  },

  getAdmins: async (): Promise<any[]> => {
    try {
      const res = await api.get('/admin/admins');
      return res.data || [];
    } catch (error) {
      console.error('Erreur getAdmins:', error);
      return [];
    }
  },

  deleteAdmin: async (adminId: string): Promise<any> => {
    const res = await api.delete(`/admin/admins/${adminId}`);
    return res.data;
  },

  // Transactions
  getAllTransactions: async (): Promise<any[]> => {
    try {
      const res = await api.get('/admin/transactions');
      return res.data || [];
    } catch (error) {
      console.error('Erreur getAllTransactions:', error);
      return [];
    }
  },

  getTransactionById: async (transactionId: string): Promise<any> => {
    const res = await api.get(`/admin/transactions/${transactionId}`);
    return res.data;
  },

  // Paramètres
  getSettings: async (): Promise<SystemSettings> => {
    try {
      const res = await api.get('/admin/settings');
      return res.data;
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
    const res = await api.patch('/admin/settings', settings);
    return res.data;
  },

  // Système
  getSystemLogs: async (): Promise<any[]> => {
    try {
      const res = await api.get('/admin/system/logs');
      return res.data || [];
    } catch {
      return [];
    }
  },

  getSystemStats: async (): Promise<any> => {
    try {
      const res = await api.get('/admin/system/stats');
      return res.data;
    } catch {
      return { uptime: '0s', memoryUsage: '0 MB' };
    }
  },

  clearCache: async (): Promise<any> => {
    const res = await api.post('/admin/system/clear-cache');
    return res.data;
  },

  // Profil Admin
  getAdminProfile: async (): Promise<any> => {
    const res = await api.get('/admin/profile');
    return res.data;
  },

  updateAdminProfile: async (profileData: any): Promise<any> => {
    const res = await api.patch('/admin/profile', profileData);
    return res.data;
  },
};