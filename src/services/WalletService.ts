// src/services/WalletService.ts
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './api';

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  totalReceived: number;
  totalSent: number;
  totalFees: number;
  pendingBalance: number;
  currency: string;
  dailyLimit: number;
  monthlyLimit: number;
  todaySpent: number;
  monthSpent: number;
  isActive: boolean;
  qrCode: string;
  settings: {
    autoSave: boolean;
    notificationThreshold: number;
  };
  createdAt: string;
  updatedAt: string;
}

export const WalletService = {
  // ============================================================
  // WALLET
  // ============================================================
  getWallet: async (): Promise<Wallet> => {
    try {
      const data = await apiGet('/wallet');
      return data;
    } catch (error) {
      console.error('❌ Erreur getWallet:', error);
      throw error;
    }
  },

  getBalance: async (): Promise<{ balance: number; currency: string }> => {
    try {
      const data = await apiGet('/wallet/balance');
      return data;
    } catch (error) {
      console.error('❌ Erreur getBalance:', error);
      return { balance: 0, currency: 'Ar' };
    }
  },

  // ============================================================
  // TRANSACTIONS
  // ============================================================
  sendMoney: async (data: { receiverId: string; amount: number; description?: string }): Promise<any> => {
    try {
      const response = await apiPost('/wallet/send-money', data);
      return response;
    } catch (error) {
      console.error('❌ Erreur sendMoney:', error);
      throw error;
    }
  },

  deposit: async (amount: number, paymentMethod: string = 'bank_card'): Promise<any> => {
    try {
      const response = await apiPost('/wallet/deposit', { amount, paymentMethod });
      return response;
    } catch (error) {
      console.error('❌ Erreur deposit:', error);
      throw error;
    }
  },

  withdraw: async (amount: number, paymentMethod: string = 'bank_card'): Promise<any> => {
    try {
      const response = await apiPost('/wallet/withdraw', { amount, paymentMethod });
      return response;
    } catch (error) {
      console.error('❌ Erreur withdraw:', error);
      throw error;
    }
  },

  // ============================================================
  // QR CODE
  // ============================================================
  generateQRCode: async (amount?: number): Promise<any> => {
    try {
      const response = await apiPost('/wallet/generate-qr', { amount });
      return response;
    } catch (error) {
      console.error('❌ Erreur generateQRCode:', error);
      throw error;
    }
  },

  scanQRCode: async (qrData: string): Promise<any> => {
    try {
      const response = await apiPost('/wallet/scan-qr', { qrData });
      return response;
    } catch (error) {
      console.error('❌ Erreur scanQRCode:', error);
      throw error;
    }
  },

  syncWallet: async (): Promise<any> => {
    try {
      const response = await apiPost('/wallet/sync', {});
      return response;
    } catch (error) {
      console.error('❌ Erreur syncWallet:', error);
      throw error;
    }
  },
};

export default WalletService;