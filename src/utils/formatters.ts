export const formatAmount = (amount: number) => new Intl.NumberFormat('fr-MG').format(amount);
export const formatDate = (d: string | Date) => new Date(d).toLocaleDateString('fr-MG');
export const formatDateTime = (d: string | Date) => `${formatDate(d)} ${new Date(d).toLocaleTimeString('fr-MG')}`;
export const getInitials = (first: string, last: string) => `${first?.charAt(0) || ''}${last?.charAt(0) || ''}`;