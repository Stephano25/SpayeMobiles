// src/services/TranslationService.ts
import { storage } from '../utils/storage';

const TRANSLATIONS: Record<string, Record<string, string>> = {
  fr: {
    'app_name': 'SPaye',
    'loading': 'Chargement...',
    'error': 'Erreur',
    'success': 'Succès',
    'cancel': 'Annuler',
    'confirm': 'Confirmer',
    'save': 'Enregistrer',
    'back': 'Retour',
    'logout': 'Déconnexion',
    'settings': 'Paramètres',
    'profile': 'Profil',
    'wallet': 'Portefeuille',
    'transactions': 'Transactions',
    'friends': 'Amis',
    'messages': 'Messages',
    'home': 'Accueil',
    'scan': 'Scanner',
    'balance': 'Solde disponible',
    'search': 'Rechercher',
    'dashboard': 'Tableau de bord',
    'overview': 'Vue d\'ensemble',
    'users': 'Utilisateurs',
    'total_users': 'Total utilisateurs',
    'active_users': 'Utilisateurs actifs',
    'total_transactions': 'Total transactions',
    'total_volume': 'Volume total',
    'statistics': 'Statistiques',
    'maintenance_mode': 'Mode maintenance',
    'login': 'Se connecter',
    'register': 'S\'inscrire',
    'email': 'Email',
    'password': 'Mot de passe',
    'confirm_password': 'Confirmer le mot de passe',
    'first_name': 'Prénom',
    'last_name': 'Nom',
    'phone': 'Téléphone',
    'continue_with_google': 'Continuer avec Google',
    'or': 'ou',
    'send': 'Envoyer',
    'receive': 'Recevoir',
    'mobile_money': 'Mobile Money',
    'scan_qr': 'Scanner QR',
    'recent_activity': 'Activité récente',
    'view_all': 'Voir tout',
    'no_transactions': 'Aucune transaction',
    'online': 'En ligne',
    'offline': 'Hors ligne',
    'search_friends': 'Rechercher par nom, email...',
    'no_friends': 'Aucun ami',
    'add_friend': 'Ajouter un ami',
    'friend_requests': 'Demandes reçues',
    'blocked_users': 'Utilisateurs bloqués',
    'my_friends': 'Mes Amis',
    'my_qr_code': 'Mon QR Code',
    'scan_qr_code': 'Scanner un QR Code',
    'share': 'Partager',
    'copy': 'Copier',
    'general': 'Général',
    'security': 'Sécurité',
    'privacy': 'Confidentialité',
    'notifications': 'Notifications',
    'appearance': 'Apparence',
    'language': 'Langue',
    'theme': 'Thème',
    'light': 'Clair',
    'dark': 'Sombre',
    'system': 'Système',
    'change_password': 'Changer le mot de passe',
    'current_password': 'Mot de passe actuel',
    'new_password': 'Nouveau mot de passe',
    'two_factor_auth': 'Authentification 2FA',
    'login_alerts': 'Alertes de connexion',
    'show_last_seen': 'Afficher la dernière connexion',
    'show_online_status': 'Afficher le statut en ligne',
    'allow_friend_requests': 'Autoriser les demandes d\'amis',
    'email_notifications': 'Notifications par email',
    'push_notifications': 'Notifications push',
    'sms_notifications': 'Notifications par SMS',
    'friend_request_notifications': 'Demandes d\'amis',
    'message_notifications': 'Nouveaux messages',
    'type_message': 'Écrire un message...',
    'no_conversations': 'Aucune conversation',
    'start_chat': 'Démarrer une discussion',
    'call': 'Appel',
    'video_call': 'Appel vidéo',
    'typing': 'En train d\'écrire...',
    'transaction_history': 'Historique des transactions',
    'sender': 'Expéditeur',
    'receiver': 'Destinataire',
    'date': 'Date',
    'status': 'Statut',
    'completed': 'Réussi',
    'pending': 'En attente',
    'failed': 'Échoué',
    'cancelled': 'Annulé',
    'deposit': 'Dépôt',
    'withdrawal': 'Retrait',
    'payment': 'Paiement',
    'error_loading': 'Erreur de chargement',
    'error_connection': 'Erreur de connexion',
    'error_save': 'Erreur lors de la sauvegarde',
    'error_delete': 'Erreur lors de la suppression',
    'success_save': 'Enregistré avec succès',
    'success_delete': 'Supprimé avec succès',
    'confirm_delete': 'Voulez-vous vraiment supprimer ?',
    'not_specified': 'Non renseigné',
  },
  en: {
    'app_name': 'SPaye',
    'loading': 'Loading...',
    'error': 'Error',
    'success': 'Success',
    'cancel': 'Cancel',
    'confirm': 'Confirm',
    'save': 'Save',
    'back': 'Back',
    'logout': 'Logout',
    'settings': 'Settings',
    'profile': 'Profile',
    'wallet': 'Wallet',
    'transactions': 'Transactions',
    'friends': 'Friends',
    'messages': 'Messages',
    'home': 'Home',
    'scan': 'Scan',
    'balance': 'Available balance',
    'search': 'Search',
    'dashboard': 'Dashboard',
    'overview': 'Overview',
    'users': 'Users',
    'total_users': 'Total users',
    'active_users': 'Active users',
    'total_transactions': 'Total transactions',
    'total_volume': 'Total volume',
    'statistics': 'Statistics',
    'maintenance_mode': 'Maintenance mode',
    'login': 'Login',
    'register': 'Register',
    'email': 'Email',
    'password': 'Password',
    'confirm_password': 'Confirm password',
    'first_name': 'First name',
    'last_name': 'Last name',
    'phone': 'Phone',
    'continue_with_google': 'Continue with Google',
    'or': 'or',
    'send': 'Send',
    'receive': 'Receive',
    'mobile_money': 'Mobile Money',
    'scan_qr': 'Scan QR',
    'recent_activity': 'Recent activity',
    'view_all': 'View all',
    'no_transactions': 'No transactions',
    'online': 'Online',
    'offline': 'Offline',
    'search_friends': 'Search by name, email...',
    'no_friends': 'No friends',
    'add_friend': 'Add friend',
    'friend_requests': 'Friend requests',
    'blocked_users': 'Blocked users',
    'my_friends': 'My Friends',
    'my_qr_code': 'My QR Code',
    'scan_qr_code': 'Scan QR Code',
    'share': 'Share',
    'copy': 'Copy',
    'general': 'General',
    'security': 'Security',
    'privacy': 'Privacy',
    'notifications': 'Notifications',
    'appearance': 'Appearance',
    'language': 'Language',
    'theme': 'Theme',
    'light': 'Light',
    'dark': 'Dark',
    'system': 'System',
    'change_password': 'Change password',
    'current_password': 'Current password',
    'new_password': 'New password',
    'two_factor_auth': '2FA Authentication',
    'login_alerts': 'Login alerts',
    'show_last_seen': 'Show last seen',
    'show_online_status': 'Show online status',
    'allow_friend_requests': 'Allow friend requests',
    'email_notifications': 'Email notifications',
    'push_notifications': 'Push notifications',
    'sms_notifications': 'SMS notifications',
    'friend_request_notifications': 'Friend requests',
    'message_notifications': 'New messages',
    'type_message': 'Type a message...',
    'no_conversations': 'No conversations',
    'start_chat': 'Start a conversation',
    'call': 'Call',
    'video_call': 'Video call',
    'typing': 'Typing...',
    'transaction_history': 'Transaction history',
    'sender': 'Sender',
    'receiver': 'Receiver',
    'date': 'Date',
    'status': 'Status',
    'completed': 'Completed',
    'pending': 'Pending',
    'failed': 'Failed',
    'cancelled': 'Cancelled',
    'deposit': 'Deposit',
    'withdrawal': 'Withdrawal',
    'payment': 'Payment',
    'error_loading': 'Error loading',
    'error_connection': 'Connection error',
    'error_save': 'Error saving',
    'error_delete': 'Error deleting',
    'success_save': 'Saved successfully',
    'success_delete': 'Deleted successfully',
    'confirm_delete': 'Are you sure you want to delete?',
    'not_specified': 'Not specified',
  },
  mg: {
    'app_name': 'SPaye',
    'loading': 'Fandrasana...',
    'error': 'Diso',
    'success': 'Vita soa',
    'cancel': 'Afoina',
    'confirm': 'Hamafy',
    'save': 'Tehirizina',
    'back': 'Hiverina',
    'logout': 'Hivoaka',
    'settings': 'Fanamarihana',
    'profile': 'Momoko',
    'wallet': 'Poketra',
    'transactions': 'Fifanakalozana',
    'friends': 'Namana',
    'messages': 'Hafatra',
    'home': 'Fandraisana',
    'scan': 'Scanner',
    'balance': 'Volana misy',
    'search': 'Tadiavo',
    'dashboard': 'Tabilao',
    'overview': 'Fijery ankapobeny',
    'users': 'Mpampiasa',
    'total_users': 'Mpampiasa rehetra',
    'active_users': 'Mpampiasa mavitrika',
    'total_transactions': 'Fifanakalozana rehetra',
    'total_volume': 'Vola rehetra',
    'statistics': 'Statistika',
    'maintenance_mode': 'Fomba fikojakojana',
    'login': 'Hiditra',
    'register': 'Hisoratra',
    'email': 'Mailaka',
    'password': 'Tenimiafina',
    'confirm_password': 'Hamafy ny tenimiafina',
    'first_name': 'Anarana',
    'last_name': 'Fanampiny',
    'phone': 'Telefaonina',
    'continue_with_google': 'Tohizo amin\'ny Google',
    'or': 'na',
    'send': 'Handefa',
    'receive': 'Handray',
    'mobile_money': 'Volan\'ny finday',
    'scan_qr': 'Scan QR',
    'recent_activity': 'Asa farany',
    'view_all': 'Jereo daholo',
    'no_transactions': 'Tsy misy fifanakalozana',
    'online': 'Mifandray',
    'offline': 'Tsy mifandray',
    'search_friends': 'Tadiavo amin\'ny anarana, mailaka...',
    'no_friends': 'Tsy misy namana',
    'add_friend': 'Hanampy namana',
    'friend_requests': 'Fangatahana namana',
    'blocked_users': 'Namana voasakana',
    'my_friends': 'Namako',
    'my_qr_code': 'Ny QR Code-ko',
    'scan_qr_code': 'Scan QR Code',
    'share': 'Hizara',
    'copy': 'Adika',
    'general': 'Ankapobeny',
    'security': 'Fiarovana',
    'privacy': 'Tsiambaratelo',
    'notifications': 'Fampahafantarana',
    'appearance': 'Bika',
    'language': 'Fiteny',
    'theme': 'Loko',
    'light': 'Mazava',
    'dark': 'Maizina',
    'system': 'Rafitra',
    'change_password': 'Hanova tenimiafina',
    'current_password': 'Tenimiafina ankehitriny',
    'new_password': 'Tenimiafina vaovao',
    'two_factor_auth': 'Fanamarinana roa',
    'login_alerts': 'Fampandremana fidirana',
    'show_last_seen': 'Aseho ny fidirana farany',
    'show_online_status': 'Aseho ny satan\'ny aterineto',
    'allow_friend_requests': 'Avela ny fangatahana namana',
    'email_notifications': 'Fampahafantarana amin\'ny mailaka',
    'push_notifications': 'Fampahafantarana push',
    'sms_notifications': 'Fampahafantarana amin\'ny SMS',
    'friend_request_notifications': 'Fangatahana namana',
    'message_notifications': 'Hafatra vaovao',
    'type_message': 'Hanoratra hafatra...',
    'no_conversations': 'Tsy misy resaka',
    'start_chat': 'Hanomboka resaka',
    'call': 'Antso',
    'video_call': 'Antso an-tsary',
    'typing': 'Mamoratra hafatra...',
    'transaction_history': 'Tantaran\'ny fifanakalozana',
    'sender': 'Mpandefa',
    'receiver': 'Mpandray',
    'date': 'Daty',
    'status': 'Toerana',
    'completed': 'Vita',
    'pending': 'Miandry',
    'failed': 'Tsy vita',
    'cancelled': 'Nofoanana',
    'deposit': 'Fametrahana',
    'withdrawal': 'Fandrobana',
    'payment': 'Fandoavana',
    'error_loading': 'Diso ny fampidirana',
    'error_connection': 'Diso ny fifandraisana',
    'error_save': 'Diso ny fitehirizana',
    'error_delete': 'Diso ny famafana',
    'success_save': 'Voatahiry soa',
    'success_delete': 'Vofafana soa',
    'confirm_delete': 'Tena hofafanao ve izany?',
    'not_specified': 'Tsy voalaza',
  },
};

type LanguageListener = (lang: string) => void;
const _listeners = new Set<LanguageListener>();

export const languageEvents = {
  subscribe: (fn: LanguageListener) => {
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  },
  emit: (lang: string) => {
    _listeners.forEach(fn => fn(lang));
  },
};

export class TranslationService {
  private static instance: TranslationService;
  private currentLanguage: string = 'fr';
  private initialized = false;

  private constructor() {}

  static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }

  async init() {
    if (this.initialized) return;
    try {
      const saved = await storage.getItem<string>('app_language');
      if (saved && TRANSLATIONS[saved]) {
        this.currentLanguage = saved;
      }
    } catch {}
    this.initialized = true;
  }

  getLanguage(): string {
    return this.currentLanguage;
  }

  async setLanguage(lang: string) {
    if (!TRANSLATIONS[lang]) return;
    this.currentLanguage = lang;
    await storage.setItem('app_language', lang);
    languageEvents.emit(lang);
  }

  translate(key: string): string {
    const dict = TRANSLATIONS[this.currentLanguage];
    return dict?.[key] ?? key;
  }

  t(key: string): string {
    return this.translate(key);
  }
}

// Hook personnalisé
import { useState, useEffect, useCallback } from 'react';

export const useTranslation = () => {
  const service = TranslationService.getInstance();
  const [language, setLanguageState] = useState<string>(service.getLanguage());

  useEffect(() => {
    const unsub = languageEvents.subscribe((lang) => {
      setLanguageState(lang);
    });
    return unsub;
  }, []);

  const setLanguage = useCallback(async (lang: string) => {
    await service.setLanguage(lang);
  }, [service]);

  const t = useCallback((key: string) => service.translate(key), [language, service]);

  return { t, language, setLanguage };
};