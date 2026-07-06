// src/services/WalletService.ts
import api from './api';
import { Wallet } from '../types';

export const WalletService = {
  getWallet: async (): Promise<Wallet> => {
    try {
      const res = await api.get('/wallet');
      return res.data;
    } catch {
      return { balance: 0 };
    }
  },

  getBalance: async (): Promise<{ balance: number }> => {
    try {
      const res = await api.get('/wallet/balance');
      return res.data;
    } catch {
      return { balance: 0 };
    }
  },

  generateReceiveQRCode: async (amount?: number): Promise<any> => {
    const res = await api.post('/wallet/generate-qr', amount ? { amount } : {});
    return res.data;
  },

  scanQRCode: async (qrData: string): Promise<any> => {
    const res = await api.post('/wallet/scan-qr', { qrData });
    return res.data;
  },

  sendMoney: async (data: { receiverId: string; amount: number; description?: string }): Promise<any> => {
    const res = await api.post('/wallet/send-money', data);
    return res.data;
  },

  transferMoney: async (data: { receiverId: string; amount: number; description?: string }): Promise<any> => {
    return WalletService.sendMoney(data);
  },

  deposit: async (amount: number, paymentMethod: string = 'bank_card'): Promise<any> => {
    const res = await api.post('/wallet/deposit', { amount, paymentMethod });
    return res.data;
  },

  withdraw: async (amount: number, paymentMethod: string = 'bank_card'): Promise<any> => {
    const res = await api.post('/wallet/withdraw', { amount, paymentMethod });
    return res.data;
  },

  syncWallet: async (): Promise<any> => {
    const res = await api.post('/wallet/sync');
    return res.data;
  },
};