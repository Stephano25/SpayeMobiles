import api from './api';
import { Transaction, DashboardStats } from '../types';

export const TransactionService = {
  getAllTransactions: () => api.get<Transaction[]>('/transactions/all').then(res => res.data),
  getUserTransactions: () => api.get<Transaction[]>('/transactions/user').then(res => res.data),
  getUserDashboardStats: () => api.get<DashboardStats>('/transactions/user/stats').then(res => res.data),
  sendMoney: (data: { receiverId: string; amount: number; description?: string }) => api.post<Transaction>('/transactions/send', data).then(res => res.data),
  mobileMoneyTransfer: (data: { operator: string; phoneNumber: string; amount: number }) => api.post<Transaction>('/transactions/mobile-money', data).then(res => res.data),
  scanAndPay: (data: { receiverQrCode: string; amount: number; description?: string }) => api.post<Transaction>('/transactions/scan-pay', data).then(res => res.data),
};