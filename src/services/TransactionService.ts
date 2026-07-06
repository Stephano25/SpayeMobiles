// src/services/TransactionService.ts
import api from './api';
import { Transaction } from '../types';

export const TransactionService = {
  getUserDashboardStats: async (): Promise<any> => {
    const res = await api.get('/transactions/user/stats');
    return res.data;
  },

  getUserTransactions: async (): Promise<Transaction[]> => {
    try {
      const res = await api.get('/transactions/user');
      return res.data || [];
    } catch {
      return [];
    }
  },

  getAllTransactions: async (): Promise<Transaction[]> => {
    try {
      const res = await api.get('/transactions/all');
      return res.data || [];
    } catch {
      return [];
    }
  },

  sendMoney: async (receiverId: string, amount: number, description?: string): Promise<Transaction> => {
    const res = await api.post('/transactions/send', { receiverId, amount, description });
    return res.data;
  },

  mobileMoneyTransfer: async (operator: string, phoneNumber: string, amount: number): Promise<Transaction> => {
    const res = await api.post('/transactions/mobile-money', { operator, phoneNumber, amount });
    return res.data;
  },

  scanAndPay: async (receiverQrCode: string, amount: number, description?: string): Promise<Transaction> => {
    const res = await api.post('/transactions/scan-pay', { receiverQrCode, amount, description });
    return res.data;
  },
};