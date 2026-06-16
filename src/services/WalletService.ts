import api from './api';
import { Wallet } from '../types';

export const WalletService = {
  // GET /wallet -> { balance: number }
  getWallet: async (): Promise<Wallet> => {
    const res = await api.get<Wallet>('/wallet');
    return res.data;
  },

  // POST /wallet/generate-qr -> { qrCode, data, expiresAt }
  generateReceiveQRCode: async (amount?: number) => {
    const res = await api.post('/wallet/generate-qr', amount ? { amount } : {});
    return res.data;
  },

  // POST /wallet/scan-qr
  scanQRCode: async (qrData: string) => {
    const res = await api.post('/wallet/scan-qr', { qrData });
    return res.data;
  },

  // POST /wallet/send-money
  sendMoney: async (receiverId: string, amount: number) => {
    const res = await api.post('/wallet/send-money', { receiverId, amount });
    return res.data;
  },
};