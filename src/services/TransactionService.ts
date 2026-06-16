import api from './api';
import { Transaction, DashboardStats } from '../types';

export const TransactionService = {
  getUserDashboardStats: async (): Promise<DashboardStats> => {
    const res = await api.get<DashboardStats>('/transactions/user/stats');
    return res.data;
  },

  getUserTransactions: async (): Promise<Transaction[]> => {
    const res = await api.get<Transaction[]>('/transactions/user');
    return res.data;
  },

  getAllTransactions: async (): Promise<Transaction[]> => {
    const res = await api.get<Transaction[]>('/transactions/all');
    return res.data;
  },

  sendMoney: async (receiverId: string, amount: number, description?: string) => {
    const res = await api.post('/transactions/send', { receiverId, amount, description });
    return res.data;
  },

  mobileMoneyTransfer: async (operator: string, phoneNumber: string, amount: number) => {
    const res = await api.post('/transactions/mobile-money', { operator, phoneNumber, amount });
    return res.data;
  },

  scanAndPay: async (receiverQrCode: string, amount: number, description?: string) => {
    const res = await api.post('/transactions/scan-pay', { receiverQrCode, amount, description });
    return res.data;
  },
};