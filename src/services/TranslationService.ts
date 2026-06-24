import React, { useState, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage';

// ============================================================
// DICTIONNAIRE COMPLET - TOUTES LES TRADUCTIONS
// ============================================================
const TRANSLATIONS = {
  fr: {
    // Général
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
    'not_specified': 'Non renseigné',
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
    'admin_profile': 'Profil Administrateur',
    'super_admin': 'Super Administrateur',
    'admin': 'Administrateur',
    'user': 'Utilisateur',
    'role': 'Rôle',
    'active': 'Actif',
    'inactive': 'Inactif',
    'friends_label': 'Amis',

    // Connexion
    'login': 'Se connecter',
    'register': 'S\'inscrire',
    'email': 'Email',
    'password': 'Mot de passe',
    'confirm_password': 'Confirmer le mot de passe',
    'forgot_password': 'Mot de passe oublié ?',
    'no_account': 'Pas encore de compte ?',
    'have_account': 'Déjà un compte ?',
    'first_name': 'Prénom',
    'last_name': 'Nom',
    'phone': 'Téléphone',
    'continue_with_google': 'Continuer avec Google',
    'or': 'ou',

    // Portefeuille
    'send': 'Envoyer',
    'receive': 'Recevoir',
    'mobile_money': 'Mobile Money',
    'scan_qr': 'Scanner QR',
    'recent_activity': 'Activité récente',
    'view_all': 'Voir tout',
    'no_transactions': 'Aucune transaction',
    'send_money': 'Envoyer de l\'argent',
    'receive_money': 'Recevoir de l\'argent',
    'amount': 'Montant',
    'fee': 'Frais',
    'total': 'Total',
    'transfer': 'Transfert',
    'insufficient_balance': 'Solde insuffisant',
    'confirm_transfer': 'Confirmer le transfert',
    'transfer_success': 'Transfert réussi !',
    'new_transfer': 'Nouveau transfert',
    'phone_number': 'Numéro de téléphone',
    'minimum_amount': 'Montant minimum',
    'maximum_amount': 'Montant maximum',
    'operator': 'Opérateur',
    'select_operator': 'Choisissez votre opérateur',

    // Amis
    'my_friends': 'Mes Amis',
    'add_friend': 'Ajouter un ami',
    'friend_requests': 'Demandes reçues',
    'blocked_users': 'Utilisateurs bloqués',
    'online': 'En ligne',
    'offline': 'Hors ligne',
    'search_friends': 'Rechercher par nom, email...',
    'no_friends': 'Aucun ami',
    'no_requests': 'Aucune demande',
    'send_request': 'Demande envoyée',
    'accept': 'Accepter',
    'decline': 'Refuser',
    'block': 'Bloquer',
    'unblock': 'Débloquer',
    'remove': 'Supprimer',
    'suggestions': 'Suggestions',
    'results': 'Résultats',
    'no_result': 'Aucun résultat',

    // QR Code
    'my_qr_code': 'Mon QR Code',
    'scan_qr_code': 'Scanner un QR Code',
    'share_contact': 'Partager mon contact',
    'add_by_qr': 'Ajouter par QR code',
    'scan_hint': 'Placez le QR code dans le cadre',
    'copy': 'Copier',
    'share': 'Partager',

    // Paramètres
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
    'compact_mode': 'Mode compact',
    'font_size': 'Taille de police',
    'small': 'Petite',
    'medium': 'Moyenne',
    'large': 'Grande',
    'french': 'Français',
    'english': 'English',
    'malagasy': 'Malagasy',

    // Sécurité
    'current_password': 'Mot de passe actuel',
    'new_password': 'Nouveau mot de passe',
    'change_password': 'Changer le mot de passe',
    'two_factor_auth': 'Authentification 2FA',
    'login_alerts': 'Alertes de connexion',

    // Confidentialité
    'show_last_seen': 'Afficher la dernière connexion',
    'show_online_status': 'Afficher le statut en ligne',
    'allow_friend_requests': 'Autoriser les demandes d\'amis',
    'profile_visibility': 'Visibilité du profil',
    'public': 'Public',
    'private': 'Privé',
    'friends_only': 'Amis uniquement',

    // Notifications
    'email_notifications': 'Notifications par email',
    'push_notifications': 'Notifications push',
    'sms_notifications': 'Notifications par SMS',
    'friend_request_notifications': 'Demandes d\'amis',
    'message_notifications': 'Nouveaux messages',

    // Chat
    'type_message': 'Écrire un message...',
    'no_conversations': 'Aucune conversation',
    'start_chat': 'Démarrer une discussion',
    'voice_recording': 'Enregistrement vocal...',
    'upload_file': 'Joindre un fichier',
    'emoji': 'Emojis',
    'call': 'Appel',
    'video_call': 'Appel vidéo',
    'typing': 'En train d\'écrire...',

    // Transactions
    'transaction_history': 'Historique des transactions',
    'transaction_details': 'Détails de la transaction',
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

    // Messages d'erreur
    'error_loading': 'Erreur de chargement',
    'error_connection': 'Erreur de connexion',
    'error_save': 'Erreur lors de la sauvegarde',
    'error_delete': 'Erreur lors de la suppression',
    'success_save': 'Enregistré avec succès',
    'success_delete': 'Supprimé avec succès',
    'confirm_delete': 'Voulez-vous vraiment supprimer ?',
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
    'not_specified': 'Not specified',
    'balance': 'Available balance',
    'search': 'Search',
    'dashboard': 'Dashboard',
    'overview': 'Platform overview',
    'users': 'Users',
    'total_users': 'Total users',
    'active_users': 'Active users',
    'total_transactions': 'Total transactions',
    'total_volume': 'Total volume',
    'statistics': 'Statistics',
    'maintenance_mode': 'Maintenance mode',
    'admin_profile': 'Admin Profile',
    'super_admin': 'Super Administrator',
    'admin': 'Administrator',
    'user': 'User',
    'role': 'Role',
    'active': 'Active',
    'inactive': 'Inactive',
    'friends_label': 'Friends',
    'login': 'Login',
    'register': 'Register',
    'email': 'Email',
    'password': 'Password',
    'confirm_password': 'Confirm password',
    'forgot_password': 'Forgot password?',
    'no_account': 'No account yet?',
    'have_account': 'Already have an account?',
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
    'send_money': 'Send money',
    'receive_money': 'Receive money',
    'amount': 'Amount',
    'fee': 'Fee',
    'total': 'Total',
    'transfer': 'Transfer',
    'insufficient_balance': 'Insufficient balance',
    'confirm_transfer': 'Confirm transfer',
    'transfer_success': 'Transfer successful!',
    'new_transfer': 'New transfer',
    'phone_number': 'Phone number',
    'minimum_amount': 'Minimum amount',
    'maximum_amount': 'Maximum amount',
    'operator': 'Operator',
    'select_operator': 'Select your operator',
    'my_friends': 'My Friends',
    'add_friend': 'Add friend',
    'friend_requests': 'Friend requests',
    'blocked_users': 'Blocked users',
    'online': 'Online',
    'offline': 'Offline',
    'search_friends': 'Search by name, email...',
    'no_friends': 'No friends',
    'no_requests': 'No requests',
    'send_request': 'Request sent',
    'accept': 'Accept',
    'decline': 'Decline',
    'block': 'Block',
    'unblock': 'Unblock',
    'remove': 'Remove',
    'suggestions': 'Suggestions',
    'results': 'Results',
    'no_result': 'No result',
    'my_qr_code': 'My QR Code',
    'scan_qr_code': 'Scan QR Code',
    'share_contact': 'Share my contact',
    'add_by_qr': 'Add by QR code',
    'scan_hint': 'Place the QR code in the frame',
    'copy': 'Copy',
    'share': 'Share',
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
    'compact_mode': 'Compact mode',
    'font_size': 'Font size',
    'small': 'Small',
    'medium': 'Medium',
    'large': 'Large',
    'french': 'French',
    'english': 'English',
    'malagasy': 'Malagasy',
    'current_password': 'Current password',
    'new_password': 'New password',
    'change_password': 'Change password',
    'two_factor_auth': '2FA Authentication',
    'login_alerts': 'Login alerts',
    'show_last_seen': 'Show last seen',
    'show_online_status': 'Show online status',
    'allow_friend_requests': 'Allow friend requests',
    'profile_visibility': 'Profile visibility',
    'public': 'Public',
    'private': 'Private',
    'friends_only': 'Friends only',
    'email_notifications': 'Email notifications',
    'push_notifications': 'Push notifications',
    'sms_notifications': 'SMS notifications',
    'friend_request_notifications': 'Friend requests',
    'message_notifications': 'New messages',
    'type_message': 'Type a message...',
    'no_conversations': 'No conversations',
    'start_chat': 'Start a conversation',
    'voice_recording': 'Voice recording...',
    'upload_file': 'Attach a file',
    'emoji': 'Emojis',
    'call': 'Call',
    'video_call': 'Video call',
    'typing': 'Typing...',
    'transaction_history': 'Transaction history',
    'transaction_details': 'Transaction details',
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
    'not_specified': 'Tsy voalaza',
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
    'admin_profile': 'Momoko Mpitantana',
    'super_admin': 'Mpitantana Ambony',
    'admin': 'Mpitantana',
    'user': 'Mpampiasa',
    'role': 'Anjara',
    'active': 'Mavitrika',
    'inactive': 'Tsy mavitrika',
    'friends_label': 'Namana',
    'login': 'Hiditra',
    'register': 'Hisoratra',
    'email': 'Mailaka',
    'password': 'Tenimiafina',
    'confirm_password': 'Hamafy ny tenimiafina',
    'forgot_password': 'Hadino ny tenimiafina?',
    'no_account': 'Mbola tsy manana kaonty?',
    'have_account': 'Efa manana kaonty?',
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
    'send_money': 'Handefa vola',
    'receive_money': 'Handray vola',
    'amount': 'Volana',
    'fee': 'Saram-pandraharahana',
    'total': 'Tontaliny',
    'transfer': 'Famindrana',
    'insufficient_balance': 'Tsy ampy ny volana',
    'confirm_transfer': 'Hamafy ny famindrana',
    'transfer_success': 'Vita soa ny famindrana!',
    'new_transfer': 'Famindrana vaovao',
    'phone_number': 'Laharan-telefaonina',
    'minimum_amount': 'Volana farany',
    'maximum_amount': 'Volana indrindra',
    'operator': 'Mpandraharaha',
    'select_operator': 'Misafidia mpandraharaha',
    'my_friends': 'Namako',
    'add_friend': 'Hanampy namana',
    'friend_requests': 'Fangatahana namana',
    'blocked_users': 'Namana voasakana',
    'online': 'Mifandray',
    'offline': 'Tsy mifandray',
    'search_friends': 'Tadiavo amin\'ny anarana, mailaka...',
    'no_friends': 'Tsy misy namana',
    'no_requests': 'Tsy misy fangatahana',
    'send_request': 'Nalefa ny fangatahana',
    'accept': 'Ekena',
    'decline': 'Holavina',
    'block': 'Hasakana',
    'unblock': 'Hesorina ny sakana',
    'remove': 'Hofafana',
    'suggestions': 'Soso-kevitra',
    'results': 'Valiny',
    'no_result': 'Tsy misy valiny',
    'my_qr_code': 'Ny QR Code-ko',
    'scan_qr_code': 'Scan QR Code',
    'share_contact': 'Hizara ny fifandraisako',
    'add_by_qr': 'Hanampy amin\'ny QR code',
    'scan_hint': 'Apetraho ao anaty refy ny QR code',
    'copy': 'Adika',
    'share': 'Hizara',
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
    'compact_mode': 'Fomba kely',
    'font_size': 'Haben\'ny soratra',
    'small': 'Kely',
    'medium': 'Antonony',
    'large': 'Lehibe',
    'french': 'Frantsay',
    'english': 'Anglisy',
    'malagasy': 'Malagasy',
    'current_password': 'Tenimiafina ankehitriny',
    'new_password': 'Tenimiafina vaovao',
    'change_password': 'Hanova tenimiafina',
    'two_factor_auth': 'Fanamarinana roa',
    'login_alerts': 'Fampandremana fidirana',
    'show_last_seen': 'Aseho ny fidirana farany',
    'show_online_status': 'Aseho ny satan\'ny aterineto',
    'allow_friend_requests': 'Avela ny fangatahana namana',
    'profile_visibility': 'Fahitana ny momoko',
    'public': 'Ho an\'ny rehetra',
    'private': 'Mangingina',
    'friends_only': 'Namana ihany',
    'email_notifications': 'Fampahafantarana amin\'ny mailaka',
    'push_notifications': 'Fampahafantarana push',
    'sms_notifications': 'Fampahafantarana amin\'ny SMS',
    'friend_request_notifications': 'Fangatahana namana',
    'message_notifications': 'Hafatra vaovao',
    'type_message': 'Hanoratra hafatra...',
    'no_conversations': 'Tsy misy resaka',
    'start_chat': 'Hanomboka resaka',
    'voice_recording': 'Fandraisam-peo...',
    'upload_file': 'Hanampy rakitra',
    'emoji': 'Emoji',
    'call': 'Antso',
    'video_call': 'Antso an-tsary',
    'typing': 'Mamoratra hafatra...',
    'transaction_history': 'Tantaran\'ny fifanakalozana',
    'transaction_details': 'Antony ny fifanakalozana',
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
  }
};

// ============================================================
// GLOBAL EVENT EMITTER
// ============================================================
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

// ============================================================
// TRANSLATION SERVICE (Singleton)
// ============================================================
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
      if (saved && TRANSLATIONS[saved as keyof typeof TRANSLATIONS]) {
        this.currentLanguage = saved;
      }
    } catch {}
    this.initialized = true;
  }

  getLanguage(): string {
    return this.currentLanguage;
  }

  async setLanguage(lang: string) {
    if (!TRANSLATIONS[lang as keyof typeof TRANSLATIONS]) return;
    this.currentLanguage = lang;
    await storage.setItem('app_language', lang);
    languageEvents.emit(lang);
  }

  translate(key: string): string {
    const dict = TRANSLATIONS[this.currentLanguage as keyof typeof TRANSLATIONS];
    return (dict as any)?.[key] ?? key;
  }

  t(key: string): string {
    return this.translate(key);
  }
}

// ============================================================
// HOOK - useTranslation
// ============================================================
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