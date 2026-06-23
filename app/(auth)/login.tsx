import React, { useState, useRef } from 'react';
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
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useNotification } from '../../src/context/NotificationContext';
import { COLORS, RADIUS, SHADOW } from '../../src/config';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { AuthService } from '../../src/services/AuthService';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { showError } = useNotification();
  const scrollViewRef = useRef<ScrollView>(null);

  const handleLogin = async () => {
    if (!email.trim()) {
      showError('Veuillez saisir votre email');
      return;
    }
    if (!password.trim()) {
      showError('Veuillez saisir votre mot de passe');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password.trim());
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Erreur de connexion';
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Connexion Google
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const apiUrl = await AuthService.getApiUrl();
      console.log('📡 API URL pour Google:', apiUrl);
      
      if (!apiUrl || apiUrl === '') {
        showError('URL du serveur non configurée. Veuillez configurer l\'IP.');
        setGoogleLoading(false);
        return;
      }

      const googleAuthUrl = `${apiUrl}/auth/google`;
      console.log('🔗 URL Google Auth:', googleAuthUrl);

      const result = await WebBrowser.openAuthSessionAsync(
        googleAuthUrl,
        'spaye://auth/callback',
        {
          showInRecents: true,
          preferEphemeralSession: false,
        }
      );

      console.log('📱 Résultat WebBrowser:', result);

      if (result.type === 'success' && result.url) {
        console.log('✅ URL de retour:', result.url);
        
        const url = new URL(result.url);
        const token = url.searchParams.get('token');
        
        if (token) {
          console.log('🔑 Token reçu');
          await AuthService.handleGoogleCallback(token);
          const user = await AuthService.getUser();
          const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
          router.replace(isAdmin ? '/(admin)' : '/(user)');
        } else {
          const error = url.searchParams.get('error');
          if (error === 'auth_failed') {
            showError('Échec de l\'authentification Google');
          } else if (error === 'server_error') {
            showError('Erreur serveur lors de l\'authentification');
          } else {
            showError('Erreur d\'authentification Google');
          }
        }
      } else if (result.type === 'cancel') {
        showError('Authentification Google annulée');
      } else {
        showError('Erreur lors de l\'authentification Google');
      }
    } catch (error: any) {
      console.error('❌ Erreur Google Login:', error);
      showError(error?.message || 'Erreur lors de la connexion Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
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
            <Text style={styles.subtitle}>Service de paiement mobile</Text>
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
              onPress={() => router.push('/(auth)/register')}
              style={styles.registerLink}
              disabled={loading || googleLoading}
            >
              <Text style={styles.registerText}>
                Pas encore de compte ? <Text style={styles.registerHighlight}>Inscrivez-vous</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(auth)/ip-config')}
              style={styles.configLink}
            >
              <Ionicons name="settings-outline" size={16} color="rgba(255,255,255,0.6)" />
              <Text style={styles.configText}>Configurer l'IP du serveur</Text>
            </TouchableOpacity>

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
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
  configLink: { marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  configText: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  bottomSpacer: { height: 20 },
});