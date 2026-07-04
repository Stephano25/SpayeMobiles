// src/services/WalletService.ts
import api from './api';
import { Wallet } from '../types';

export const WalletService = {
  getWallet: async (): Promise<Wallet> => {
    const res = await api.get('/wallet');
    return res.data;
  },

  getBalance: async (): Promise<{ balance: number }> => {
    const res = await api.get('/wallet/balance');
    return res.data;
  },

  generateReceiveQRCode: async (amount?: number) => {
    const res = await api.post('/wallet/generate-qr', amount ? { amount } : {});
    return res.data;
  },

  scanQRCode: async (qrData: string) => {
    const res = await api.post('/wallet/scan-qr', { qrData });
    return res.data;
  },
};