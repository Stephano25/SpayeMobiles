// src/services/WalletService.ts
// ─────────────────────────────────────────────────────────────
//  SPAYE — Wallet Service
//  ✅ Correction : utilisation de apiGet, apiPost, etc.
// ─────────────────────────────────────────────────────────────

import { apiGet, apiPost, apiPut, apiDelete } from './api';

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
  recentTransactions?: any[];
}

export const WalletService = {
  getWallet: async (): Promise<Wallet> => {
    try {
      const response = await apiGet('/wallet');
      return response || { balance: 0 };
    } catch (error) {
      console.error('❌ Erreur getWallet:', error);
      return { balance: 0 };
    }
  },

  getBalance: async (): Promise<{ balance: number; currency?: string }> => {
    try {
      const response = await apiGet('/wallet/balance');
      return response || { balance: 0 };
    } catch (error) {
      console.error('❌ Erreur getBalance:', error);
      return { balance: 0 };
    }
  },

  generateReceiveQRCode: async (amount?: number): Promise<any> => {
    try {
      const body = amount ? { amount } : {};
      const response = await apiPost('/wallet/generate-qr', body);
      return response;
    } catch (error) {
      console.error('❌ Erreur generateReceiveQRCode:', error);
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

  sendMoney: async (data: { receiverId: string; amount: number; description?: string }): Promise<any> => {
    try {
      const response = await apiPost('/wallet/send-money', data);
      return response;
    } catch (error) {
      console.error('❌ Erreur sendMoney:', error);
      throw error;
    }
  },

  transferMoney: async (data: { receiverId: string; amount: number; description?: string }): Promise<any> => {
    return WalletService.sendMoney(data);
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

  syncWallet: async (): Promise<any> => {
    try {
      const response = await apiPost('/wallet/sync');
      return response;
    } catch (error) {
      console.error('❌ Erreur syncWallet:', error);
      throw error;
    }
  },
};

export default WalletService;