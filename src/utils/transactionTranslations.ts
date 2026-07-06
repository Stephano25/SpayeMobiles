// src/utils/transactionTranslations.ts
export const translateTransactionType = (type: string): string => {
  const translations: Record<string, string> = {
    'send': 'Envoi',
    'receive': 'Réception',
    'deposit': 'Dépôt',
    'withdraw': 'Retrait',
    'payment': 'Paiement',
    'mobile_money': 'Mobile Money',
    'transfer': 'Transfert',
  };
  return translations[type] || type;
};