// src/services/TransactionService.ts
// ─────────────────────────────────────────────────────────────
//  SPAYE — Transaction Service
//  ✅ Correction : validation stricte du numéro (10 chiffres)
//  ✅ Meilleure gestion des erreurs
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

const PHONE_LENGTH = 10;
const VALID_PREFIXES = ['033', '032', '034'];
const OPERATOR_PREFIX_MAP: Record<string, string> = {
  'airtel': '033',
  'orange': '032',
  'mvola': '034'
};

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

  mobileMoneyTransfer: async (data: { 
    operator: string; 
    phoneNumber: string; 
    amount: number 
  }): Promise<Transaction> => {
    try {
      // ✅ Nettoyer le numéro (enlever espaces)
      const cleanPhone = data.phoneNumber.replace(/\s/g, '');
      
      // ✅ Vérifier que le numéro a exactement 10 chiffres
      if (cleanPhone.length !== PHONE_LENGTH) {
        throw new Error(`Le numéro doit contenir exactement ${PHONE_LENGTH} chiffres (actuellement ${cleanPhone.length})`);
      }
      
      // ✅ Vérifier que le numéro ne contient que des chiffres
      if (!/^\d+$/.test(cleanPhone)) {
        throw new Error('Le numéro ne doit contenir que des chiffres');
      }
      
      // ✅ Vérifier que le préfixe est valide
      const prefix = cleanPhone.substring(0, 3);
      if (!VALID_PREFIXES.includes(prefix)) {
        throw new Error('Le numéro doit commencer par 033 (Airtel), 032 (Orange) ou 034 (MVola)');
      }
      
      // ✅ Vérifier que l'opérateur correspond au préfixe
      const expectedPrefix = OPERATOR_PREFIX_MAP[data.operator];
      if (!expectedPrefix) {
        throw new Error('Opérateur Mobile Money invalide');
      }
      
      if (prefix !== expectedPrefix) {
        throw new Error(`Le numéro ${cleanPhone} ne correspond pas à l'opérateur sélectionné. Utilisez ${expectedPrefix}...`);
      }
      
      const payload = {
        operator: data.operator,
        phoneNumber: cleanPhone,
        amount: data.amount,
      };
      
      console.log('📤 Envoi transfert Mobile Money:', payload);
      
      const response = await apiPost('/transactions/mobile-money', payload);
      console.log('✅ Réponse transfert Mobile Money:', response);
      
      return response;
    } catch (error: any) {
      console.error('❌ Erreur mobileMoneyTransfer:', error);
      
      // ✅ Extraire le message d'erreur du backend
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Erreur lors du transfert Mobile Money';
      
      throw new Error(errorMessage);
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