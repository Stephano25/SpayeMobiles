import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useNotification } from '../../src/context/NotificationContext';
import { chatService } from '../../src/services/ChatService';
import { COLORS, formatTime, getInitials } from '../../src/config';
import { router, useLocalSearchParams } from 'expo-router';

export default function ChatScreen() {
  const { colors } = useTheme();
  const { user, getToken } = useAuth();
  const { friendId } = useLocalSearchParams<{ friendId: string }>();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const token = getToken();
    if (token) chatService.connect(token);
    if (friendId) loadMessages();
    const unsub = chatService.onNewMessage((msg) => {
      if (msg.senderId === friendId || msg.receiverId === friendId) setMessages(prev => [...prev, msg]);
    });
    return () => unsub();
  }, [friendId]);

  const loadMessages = async () => {
    const msgs = await chatService.getMessages(friendId);
    setMessages(msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    chatService.sendMessage({ receiverId: friendId, type: 'text', content: newMessage });
    setNewMessage('');
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Discussion</Text><View style={{ width: 40 }} />
      </View>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.messageRow, item.senderId === user?.id ? styles.rowRight : styles.rowLeft]}>
            <View style={[styles.bubble, item.senderId === user?.id ? styles.bubbleRight : styles.bubbleLeft]}>
              <Text style={styles.messageText}>{item.content}</Text>
              <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
            </View>
          </View>
        )}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />
      <View style={styles.inputContainer}>
        <TextInput style={[styles.input, { backgroundColor: colors.card, color: colors.text }]} placeholder="Message..." value={newMessage} onChangeText={setNewMessage} />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}><Text style={styles.sendButtonText}>📤</Text></TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  backText: { fontSize: 24, color: COLORS.white },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  messageRow: { marginVertical: 4, marginHorizontal: 12 },
  rowRight: { alignItems: 'flex-end' }, rowLeft: { alignItems: 'flex-start' },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 20 },
  bubbleRight: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleLeft: { backgroundColor: COLORS.gray200, borderBottomLeftRadius: 4 },
  messageText: { fontSize: 14, color: COLORS.white },
  time: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 4, alignSelf: 'flex-end' },
  inputContainer: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: COLORS.gray200, gap: 8 },
  input: { flex: 1, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10 },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  sendButtonText: { fontSize: 20, color: COLORS.white },
});