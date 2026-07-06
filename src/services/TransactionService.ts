// src/services/TransactionService.ts
import api from './api';

// ✅ Définition du type Transaction localement
export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'deposit' | 'withdraw' | 'payment';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  senderId?: string;
  receiverId?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  receiver?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export const TransactionService = {
  getUserDashboardStats: async (): Promise<any> => {
    const response = await api.get('/transactions/user/stats');
    return response;
  },

  getUserTransactions: async (): Promise<Transaction[]> => {
    try {
      const response = await api.get('/transactions/user');
      return response || [];
    } catch {
      return [];
    }
  },

  getAllTransactions: async (): Promise<Transaction[]> => {
    try {
      const response = await api.get('/transactions/all');
      return response || [];
    } catch {
      return [];
    }
  },

  sendMoney: async (receiverId: string, amount: number, description?: string): Promise<Transaction> => {
    const response = await api.post('/transactions/send', { receiverId, amount, description });
    return response;
  },

  mobileMoneyTransfer: async (operator: string, phoneNumber: string, amount: number): Promise<Transaction> => {
    const response = await api.post('/transactions/mobile-money', { operator, phoneNumber, amount });
    return response;
  },

  scanAndPay: async (receiverQrCode: string, amount: number, description?: string): Promise<Transaction> => {
    const response = await api.post('/transactions/scan-pay', { receiverQrCode, amount, description });
    return response;
  },
};