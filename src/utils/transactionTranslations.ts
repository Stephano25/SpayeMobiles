import { TranslationService } from '../services/TranslationService';

// Obtenir le service de traduction
const getService = () => TranslationService.getInstance();

// Traduire un type de transaction
export const translateTransactionType = (type: string): string => {
  const service = getService();
  const translations: Record<string, string> = {
    'deposit': 'deposit',
    'withdrawal': 'withdrawal',
    'payment': 'payment',
    'transfer': 'transfer',
    'mobile_money': 'mobile_money',
    'receive': 'receive',
    'send': 'send',
  };
  const key = translations[type] || type;
  return service.t(key);
};

// Traduire un statut de transaction
export const translateTransactionStatus = (status: string): string => {
  const service = getService();
  const translations: Record<string, string> = {
    'completed': 'completed',
    'pending': 'pending',
    'failed': 'failed',
    'cancelled': 'cancelled',
    'processing': 'pending',
  };
  const key = translations[status] || status;
  return service.t(key);
};

// Hook personnalisé pour les transactions
export const useTransactionTranslations = () => {
  const service = TranslationService.getInstance();
  
  return {
    t: (key: string) => service.t(key),
    translateType: (type: string) => {
      const map: Record<string, string> = {
        'deposit': 'deposit',
        'withdrawal': 'withdrawal',
        'payment': 'payment',
        'transfer': 'transfer',
        'mobile_money': 'mobile_money',
        'receive': 'receive',
        'send': 'send',
      };
      return service.t(map[type] || type);
    },
    translateStatus: (status: string) => {
      const map: Record<string, string> = {
        'completed': 'completed',
        'pending': 'pending',
        'failed': 'failed',
        'cancelled': 'cancelled',
        'processing': 'pending',
      };
      return service.t(map[status] || status);
    },
  };
};