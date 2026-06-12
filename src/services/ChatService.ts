import { io, Socket } from 'socket.io-client';
import { API_URL, SOCKET_URL } from '../config';
import { Conversation, Message } from '../types';
import api from './api';

class ChatService {
  private socket: Socket | null = null;
  private messageCallbacks: ((msg: Message) => void)[] = [];
  private typingCallbacks: ((data: { userId: string; isTyping: boolean }) => void)[] = [];
  private onlineCallbacks: ((data: { userId: string; isOnline: boolean }) => void)[] = [];

  /**
   * Établit la connexion WebSocket avec le serveur
   * @param token JWT token de l'utilisateur
   */
  connect(token: string) {
    if (this.socket?.connected) return;
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('newMessage', (msg: Message) => {
      this.messageCallbacks.forEach(cb => cb(msg));
    });

    this.socket.on('userTyping', (data) => {
      this.typingCallbacks.forEach(cb => cb(data));
    });

    this.socket.on('userOnline', (data) => {
      this.onlineCallbacks.forEach(cb => cb(data));
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });
  }

  /**
   * Déconnecte le WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * S'abonne aux nouveaux messages
   * @returns fonction de désabonnement
   */
  onNewMessage(callback: (msg: Message) => void) {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * S'abonne aux événements "en train d'écrire"
   */
  onTyping(callback: (data: { userId: string; isTyping: boolean }) => void) {
    this.typingCallbacks.push(callback);
    return () => {
      this.typingCallbacks = this.typingCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * S'abonne aux changements de statut en ligne des contacts
   */
  onOnlineStatus(callback: (data: { userId: string; isOnline: boolean }) => void) {
    this.onlineCallbacks.push(callback);
    return () => {
      this.onlineCallbacks = this.onlineCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Envoie un message (texte, image, fichier, argent, emoji)
   */
  sendMessage(message: any) {
    this.socket?.emit('sendMessage', message);
  }

  /**
   * Notifie l'autre utilisateur que l'utilisateur courant est en train d'écrire
   */
  sendTyping(receiverId: string, isTyping: boolean) {
    this.socket?.emit('typing', { receiverId, isTyping });
  }

  /**
   * Marque tous les messages d'un expéditeur comme lus
   */
  markAsRead(senderId: string): Promise<void> {
    return api.post(`/chat/read/${senderId}`).then(() => {});
  }

  /**
   * Récupère la liste des conversations (utilisateurs avec qui on a déjà discuté)
   */
  async getConversations(): Promise<Conversation[]> {
    const response = await api.get<Conversation[]>('/chat/conversations');
    return response.data;
  }

  /**
   * Récupère l'historique des messages avec un utilisateur
   */
  async getMessages(userId: string): Promise<Message[]> {
    const response = await api.get<Message[]>(`/chat/messages/${userId}`);
    return response.data;
  }

  /**
   * Upload d'un fichier (image, document, audio) pour l'envoyer ensuite
   * @param file objet contenant uri, type, fileName
   */
  async uploadFile(file: { uri: string; type: string; fileName: string }): Promise<{ url: string; fileName: string; fileSize: number }> {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type,
      name: file.fileName,
    } as any);
    const response = await api.post('/chat/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
}

// Export d'une instance unique
export const chatService = new ChatService();