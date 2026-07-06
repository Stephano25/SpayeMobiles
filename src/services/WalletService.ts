// src/services/WalletService.ts
import api from './api';

// ✅ Définition du type Wallet localement
export interface Wallet {
  balance: number;
  currency?: string;
  userId?: string;
  qrCode?: string;
  transactions?: any[];
}

export const WalletService = {
  getWallet: async (): Promise<Wallet> => {
    try {
      const response = await api.get('/wallet');
      // ✅ Vérifier que response a bien une propriété balance
      if (response && typeof response === 'object' && 'balance' in response) {
        return response as Wallet;
      }
      return { balance: 0 };
    } catch {
      return { balance: 0 };
    }
  },

  getBalance: async (): Promise<{ balance: number }> => {
    try {
      const response = await api.get('/wallet/balance');
      if (response && typeof response === 'object' && 'balance' in response) {
        return response as { balance: number };
      }
      return { balance: 0 };
    } catch {
      return { balance: 0 };
    }
  },

  generateReceiveQRCode: async (amount?: number): Promise<any> => {
    const response = await api.post('/wallet/generate-qr', amount ? { amount } : {});
    return response;
  },

  scanQRCode: async (qrData: string): Promise<any> => {
    const response = await api.post('/wallet/scan-qr', { qrData });
    return response;
  },

  sendMoney: async (data: { receiverId: string; amount: number; description?: string }): Promise<any> => {
    const response = await api.post('/wallet/send-money', data);
    return response;
  },

  transferMoney: async (data: { receiverId: string; amount: number; description?: string }): Promise<any> => {
    return WalletService.sendMoney(data);
  },

  deposit: async (amount: number, paymentMethod: string = 'bank_card'): Promise<any> => {
    const response = await api.post('/wallet/deposit', { amount, paymentMethod });
    return response;
  },

  withdraw: async (amount: number, paymentMethod: string = 'bank_card'): Promise<any> => {
    const response = await api.post('/wallet/withdraw', { amount, paymentMethod });
    return response;
  },

  syncWallet: async (): Promise<any> => {
    const response = await api.post('/wallet/sync');
    return response;
  },
};