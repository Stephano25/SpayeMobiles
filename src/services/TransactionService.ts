// src/services/TransactionService.ts
// ─────────────────────────────────────────────────────────────
//  SPAYE — Transaction Service
//  ✅ Correction : utilisation de apiGet, apiPost, etc.
// ─────────────────────────────────────────────────────────────

import { apiGet, apiPost, apiPut, apiDelete } from './api';

export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'deposit' | 'withdraw' | 'payment' | 'mobile_money' | 'transfer';
  amount: number;
  fee?: number;
  totalAmount?: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'processing';
  senderId?: string;
  receiverId?: string;
  description?: string;
  reference?: string;
  paymentMethod?: string;
  mobileMoneyOperator?: string;
  mobileMoneyNumber?: string;
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
    try {
      const response = await apiGet('/transactions/user/stats');
      return response;
    } catch (error) {
      console.error('❌ Erreur getUserDashboardStats:', error);
      return {
        totalBalance: 0,
        totalTransactions: 0,
        lastThreeTransactions: [],
        monthlyStats: [],
      };
    }
  },

  getUserTransactions: async (): Promise<Transaction[]> => {
    try {
      const response = await apiGet('/transactions/user');
      return response || [];
    } catch (error) {
      console.error('❌ Erreur getUserTransactions:', error);
      return [];
    }
  },

  getAllTransactions: async (): Promise<Transaction[]> => {
    try {
      const response = await apiGet('/transactions/all');
      return response || [];
    } catch (error) {
      console.error('❌ Erreur getAllTransactions:', error);
      return [];
    }
  },

  sendMoney: async (data: { receiverId: string; amount: number; description?: string }): Promise<Transaction> => {
    try {
      const response = await apiPost('/transactions/send', data);
      return response;
    } catch (error) {
      console.error('❌ Erreur sendMoney:', error);
      throw error;
    }
  },

  mobileMoneyTransfer: async (data: { operator: string; phoneNumber: string; amount: number }): Promise<Transaction> => {
    try {
      const response = await apiPost('/transactions/mobile-money', data);
      return response;
    } catch (error) {
      console.error('❌ Erreur mobileMoneyTransfer:', error);
      throw error;
    }
  },

  scanAndPay: async (data: { receiverQrCode: string; amount: number; description?: string }): Promise<Transaction> => {
    try {
      const response = await apiPost('/transactions/scan-pay', data);
      return response;
    } catch (error) {
      console.error('❌ Erreur scanAndPay:', error);
      throw error;
    }
  },
};

export default TransactionService;