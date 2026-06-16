import api from './api';
import { Transaction, DashboardStats } from '../types';

export const TransactionService = {
  // GET /transactions/user/stats -> { totalBalance, totalTransactions, lastThreeTransactions, largestTransaction }
  getUserDashboardStats: async (): Promise<DashboardStats> => {
    const res = await api.get<DashboardStats>('/transactions/user/stats');
    return res.data;
  },

  // GET /transactions/user -> Transaction[]
  getUserTransactions: async (): Promise<Transaction[]> => {
    const res = await api.get<Transaction[]>('/transactions/user');
    return res.data;
  },

  // GET /transactions/all -> Transaction[] (même chose côté backend que /user)
  getAllTransactions: async (): Promise<Transaction[]> => {
    const res = await api.get<Transaction[]>('/transactions/all');
    return res.data;
  },

  // POST /transactions/send
  sendMoney: async (receiverId: string, amount: number, description?: string) => {
    const res = await api.post('/transactions/send', { receiverId, amount, description });
    return res.data;
  },

  // POST /transactions/mobile-money
  mobileMoneyTransfer: async (operator: string, phoneNumber: string, amount: number) => {
    const res = await api.post('/transactions/mobile-money', { operator, phoneNumber, amount });
    return res.data;
  },

  // POST /transactions/scan-pay
  scanAndPay: async (receiverQrCode: string, amount: number, description?: string) => {
    const res = await api.post('/transactions/scan-pay', { receiverQrCode, amount, description });
    return res.data;
  },
};