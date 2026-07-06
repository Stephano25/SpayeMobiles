// app/(auth)/login.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../src/context/AuthContext';
import { useNotification } from '../../src/context/NotificationContext';
import { COLORS, RADIUS, SHADOW } from '../../src/config/colors';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { getApiUrl } from '../../src/config/api';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { showError } = useNotification();
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (!email.trim()) {
      showError('Email requis');
      return;
    }
    if (!password.trim()) {
      showError('Mot de passe requis');
      return;
    }

    setLoading(true);
    try {
      const result = await login(email.trim(), password.trim());
      // ✅ La navigation est gérée par AuthContext
    } catch (error: any) {
      const message = error?.message || 'Erreur de connexion';
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const apiUrl = await getApiUrl();

      if (!apiUrl) {
        showError('Serveur non configuré');
        setGoogleLoading(false);
        return;
      }

      const googleAuthUrl = `${apiUrl}/auth/google`;

      const result = await WebBrowser.openAuthSessionAsync(
        googleAuthUrl,
        'spaye://auth/callback',
        {
          showInRecents: true,
          preferEphemeralSession: false,
        }
      );

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const token = url.searchParams.get('token');

        if (token) {
          const user = await loginWithGoogleToken(token);
          if (user?.role === 'admin' || user?.role === 'super_admin') {
            navigation.replace('AdminHome' as never);
          } else {
            navigation.replace('UserHome' as never);
          }
        } else {
          showError('Token manquant');
        }
      } else if (result.type === 'cancel') {
        // L'utilisateur a annulé
      } else {
        showError('Erreur lors de la connexion Google');
      }
    } catch (error: any) {
      console.error('❌ Erreur Google Login:', error);
      showError('Erreur lors de la connexion Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const loginWithGoogleToken = async (token: string) => {
    try {
      const response = await fetch(`${await getApiUrl()}/auth/google/callback?token=${token}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur login Google:', error);
      throw error;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="wallet-outline" size={48} color={COLORS.white} />
          </View>
          <Text style={styles.title}>SPaye</Text>
          <Text style={styles.subtitle}>Connexion</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color={COLORS.gray400} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={COLORS.gray400}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading && !googleLoading}
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.gray400} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Mot de passe"
              placeholderTextColor={COLORS.gray400}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              editable={!loading && !googleLoading}
              onSubmitEditing={handleLogin}
              returnKeyType="done"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={COLORS.gray400} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, (loading || googleLoading) && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading || googleLoading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.primary} size="small" />
            ) : (
              <Text style={styles.buttonText}>Se connecter</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.googleButton, (loading || googleLoading) && styles.buttonDisabled]}
            onPress={handleGoogleLogin}
            disabled={loading || googleLoading}
            activeOpacity={0.7}
          >
            {googleLoading ? (
              <ActivityIndicator color={COLORS.primary} size="small" />
            ) : (
              <>
                <Ionicons name="logo-google" size={22} color={COLORS.primary} />
                <Text style={styles.googleButtonText}>Continuer avec Google</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Register' as never)}
            style={styles.registerLink}
            disabled={loading || googleLoading}
          >
            <Text style={styles.registerText}>
              Pas encore de compte ? <Text style={styles.registerHighlight}>S'inscrire</Text>
            </Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 36, fontWeight: 'bold', color: COLORS.white, textAlign: 'center' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 4 },
  form: { width: '100%' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    marginBottom: 14,
    paddingHorizontal: 16,
    ...SHADOW.sm,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: COLORS.text },
  passwordInput: { paddingRight: 8 },
  eyeIcon: { padding: 8 },
  button: {
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: 8,
    ...SHADOW.md,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 16 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  dividerText: { color: 'rgba(255,255,255,0.6)', paddingHorizontal: 16, fontSize: 14 },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    gap: 12,
    ...SHADOW.md,
  },
  googleButtonText: { color: COLORS.text, fontWeight: '600', fontSize: 16 },
  registerLink: { marginTop: 20, alignItems: 'center' },
  registerText: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  registerHighlight: { color: COLORS.white, fontWeight: 'bold', textDecorationLine: 'underline' },
  bottomSpacer: { height: 20 },
});