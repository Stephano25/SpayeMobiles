import { storage } from '../utils/storage';

// Dictionnaire des traductions
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
    
    // Portefeuille
    'balance': 'Solde disponible',
    'send': 'Envoyer',
    'receive': 'Recevoir',
    'mobile_money': 'Mobile Money',
    'scan_qr': 'Scanner QR',
    'recent_activity': 'Activité récente',
    'view_all': 'Voir tout',
    'no_transactions': 'Aucune transaction',
    
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
    
    // Privacy
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
    
    // Mobile Money
    'select_operator': 'Choisissez votre opérateur',
    'operator': 'Opérateur',
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
  },
  en: {
    // General
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
    
    // Login
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
    
    // Wallet
    'balance': 'Available balance',
    'send': 'Send',
    'receive': 'Receive',
    'mobile_money': 'Mobile Money',
    'scan_qr': 'Scan QR',
    'recent_activity': 'Recent activity',
    'view_all': 'View all',
    'no_transactions': 'No transactions',
    
    // Friends
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
    
    // QR Code
    'my_qr_code': 'My QR Code',
    'scan_qr_code': 'Scan QR Code',
    'share_contact': 'Share my contact',
    'add_by_qr': 'Add by QR code',
    'scan_hint': 'Place the QR code in the frame',
    'copy': 'Copy',
    'share': 'Share',
    
    // Settings
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
    
    // Security
    'current_password': 'Current password',
    'new_password': 'New password',
    'change_password': 'Change password',
    'two_factor_auth': '2FA',
    'login_alerts': 'Login alerts',
    
    // Privacy
    'show_last_seen': 'Show last seen',
    'show_online_status': 'Show online status',
    'allow_friend_requests': 'Allow friend requests',
    'profile_visibility': 'Profile visibility',
    'public': 'Public',
    'private': 'Private',
    'friends_only': 'Friends only',
    
    // Notifications
    'email_notifications': 'Email notifications',
    'push_notifications': 'Push notifications',
    'sms_notifications': 'SMS notifications',
    'friend_request_notifications': 'Friend requests',
    'message_notifications': 'New messages',
    
    // Chat
    'type_message': 'Type a message...',
    'no_conversations': 'No conversations',
    'start_chat': 'Start a conversation',
    'voice_recording': 'Voice recording...',
    'upload_file': 'Attach a file',
    'emoji': 'Emojis',
    'call': 'Call',
    'video_call': 'Video call',
    
    // Mobile Money
    'select_operator': 'Select your operator',
    'operator': 'Operator',
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
  },
  mg: {
    // Général
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
    
    // Connexion
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
    
    // Portefeuille
    'balance': 'Volana misy',
    'send': 'Handefa',
    'receive': 'Handray',
    'mobile_money': 'Volan\'ny finday',
    'scan_qr': 'Scan QR',
    'recent_activity': 'Asa farany',
    'view_all': 'Jereo daholo',
    'no_transactions': 'Tsy misy fifanakalozana',
    
    // Amis
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
    
    // QR Code
    'my_qr_code': 'Ny QR Code-ko',
    'scan_qr_code': 'Scan QR Code',
    'share_contact': 'Hizara ny fifandraisako',
    'add_by_qr': 'Hanampy amin\'ny QR code',
    'scan_hint': 'Apetraho ao anaty refy ny QR code',
    'copy': 'Adika',
    'share': 'Hizara',
    
    // Paramètres
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
    
    // Sécurité
    'current_password': 'Tenimiafina ankehitriny',
    'new_password': 'Tenimiafina vaovao',
    'change_password': 'Hanova tenimiafina',
    'two_factor_auth': 'Fanamarinana roa',
    'login_alerts': 'Fampandremana fidirana',
    
    // Privacy
    'show_last_seen': 'Aseho ny fidirana farany',
    'show_online_status': 'Aseho ny satan\'ny aterineto',
    'allow_friend_requests': 'Avela ny fangatahana namana',
    'profile_visibility': 'Fahitana ny momoko',
    'public': 'Ho an\'ny rehetra',
    'private': 'Mangingina',
    'friends_only': 'Namana ihany',
    
    // Notifications
    'email_notifications': 'Fampahafantarana amin\'ny mailaka',
    'push_notifications': 'Fampahafantarana push',
    'sms_notifications': 'Fampahafantarana amin\'ny SMS',
    'friend_request_notifications': 'Fangatahana namana',
    'message_notifications': 'Hafatra vaovao',
    
    // Chat
    'type_message': 'Hanoratra hafatra...',
    'no_conversations': 'Tsy misy resaka',
    'start_chat': 'Hanomboka resaka',
    'voice_recording': 'Fandraisam-peo...',
    'upload_file': 'Hanampy rakitra',
    'emoji': 'Emoji',
    'call': 'Antso',
    'video_call': 'Antso an-tsary',
    
    // Mobile Money
    'select_operator': 'Misafidia mpandraharaha',
    'operator': 'Mpandraharaha',
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
  }
};

export class TranslationService {
  private static instance: TranslationService;
  private currentLanguage: string = 'fr';

  private constructor() {
    this.loadLanguage();
  }

  static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }

  private async loadLanguage() {
    try {
      const savedLang = await storage.getItem<string>('app_language');
      if (savedLang && TRANSLATIONS[savedLang as keyof typeof TRANSLATIONS]) {
        this.currentLanguage = savedLang;
      }
    } catch (error) {
      console.error('Erreur chargement langue:', error);
    }
  }

  getLanguage(): string {
    return this.currentLanguage;
  }

  async setLanguage(lang: string) {
    if (TRANSLATIONS[lang as keyof typeof TRANSLATIONS]) {
      this.currentLanguage = lang;
      await storage.setItem('app_language', lang);
    }
  }

  translate(key: string): string {
    const lang = this.currentLanguage as keyof typeof TRANSLATIONS;
    const translations = TRANSLATIONS[lang];
    return translations?.[key as keyof typeof translations] || key;
  }

  t(key: string): string {
    return this.translate(key);
  }
}

// Hook personnalisé pour utiliser la traduction
export const useTranslation = () => {
  const service = TranslationService.getInstance();
  return {
    t: (key: string) => service.translate(key),
    language: service.getLanguage(),
    setLanguage: (lang: string) => service.setLanguage(lang),
  };
};