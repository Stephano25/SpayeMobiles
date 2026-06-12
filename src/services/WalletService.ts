import api from './api';
import { Wallet } from '../types';

export const WalletService = {
  getWallet: () => api.get<Wallet>('/wallet').then(res => res.data),
  getBalance: () => api.get<{ balance: number }>('/wallet').then(res => res.data.balance),
  generateReceiveQRCode: (amount?: number) => api.post<{ qrCode: string; expiresAt: string; data: any }>('/wallet/generate-qr', amount ? { amount } : {}).then(res => res.data),
  scanQRCode: (qrData: string) => api.post('/wallet/scan-qr', { qrData }).then(res => res.data),
  transferMoney: (data: { receiverId: string; amount: number; description?: string }) => api.post('/wallet/send-money', data).then(res => res.data),
};