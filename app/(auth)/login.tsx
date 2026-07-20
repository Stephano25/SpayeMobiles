// app/(auth)/login.tsx
import React, { useState, useEffect } from 'react';
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
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../src/context/AuthContext';
import { useNotification } from '../../src/context/NotificationContext';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { getBaseUrl } from '../../src/config/api';
import * as Linking from 'expo-linking';

const { width, height } = Dimensions.get('window');

WebBrowser.maybeCompleteAuthSession();

// ─── Design tokens ─────────────────────────────────────────────
const COLORS_CUSTOM = {
  primary: '#6366f1',
  primaryLight: 'rgba(99, 102, 241, 0.15)',
  primaryDark: '#4f46e5',
  secondary: '#8b5cf6',
  background: '#0d0820',
  surface: 'rgba(255, 255, 255, 0.10)',
  surfaceStrong: 'rgba(255, 255, 255, 0.16)',
  border: 'rgba(255, 255, 255, 0.22)',
  text: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.68)',
  textMuted: 'rgba(255, 255, 255, 0.46)',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  white: '#ffffff',
  black: '#000000',
  glassShadow: 'rgba(10, 6, 30, 0.55)',
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login, loginWithToken } = useAuth();
  const { showError } = useNotification();
  const navigation = useNavigation();
  const isWeb = Platform.OS === 'web';

  // ✅ Gérer le deep link pour le callback Google
  useEffect(() => {
    const handleDeepLink = async (event: any) => {
      const url = event.url;
      console.log('🔗 Deep Link reçu:', url);
      
      if (url && url.includes('auth/callback')) {
        try {
          const parsedUrl = new URL(url);
          const token = parsedUrl.searchParams.get('token');
          if (token) {
            console.log('✅ Token trouvé dans le deep link');
            navigation.navigate('AuthCallback' as never, { token } as never);
          }
        } catch (error) {
          console.error('❌ Erreur parsing deep link:', error);
        }
      }
    };

    // ✅ Sur le web, vérifier les paramètres d'URL
    if (isWeb) {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const error = urlParams.get('error');
      
      if (token) {
        console.log('✅ Token trouvé dans l\'URL');
        navigation.navigate('AuthCallback' as never, { token } as never);
      } else if (error) {
        console.error('❌ Erreur dans l\'URL:', error);
        showError(error === 'auth_failed' ? 'Échec de l\'authentification' : 'Erreur serveur');
      }
    }

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url && url.includes('auth/callback')) {
        try {
          const parsedUrl = new URL(url);
          const token = parsedUrl.searchParams.get('token');
          if (token) {
            console.log('✅ Token trouvé dans le lien initial');
            navigation.navigate('AuthCallback' as never, { token } as never);
          }
        } catch (error) {
          console.error('❌ Erreur parsing lien initial:', error);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

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
      await login(email.trim(), password.trim());
    } catch (error: any) {
      const message = error?.message || 'Erreur de connexion';
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ GOOGLE LOGIN - Version avec header ngrok
  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);

      const baseUrl = await getBaseUrl();
      if (!baseUrl) {
        showError('Serveur non configuré');
        setGoogleLoading(false);
        return;
      }

      // ✅ Web: on tague explicitement la plateforme pour que le backend
      // sache vers quelle URL rediriger une fois Google terminé.
      if (isWeb) {
        const googleAuthUrl = `${baseUrl}/api/auth/google?platform=web`;
        console.log('🌐 Redirection vers Google:', googleAuthUrl);
        window.location.href = googleAuthUrl;
        return;
      }

      const redirectUrl = Linking.createURL('auth/callback');

      // ✅ Mobile: on transmet notre propre deep link au backend (il varie
      // selon Expo Go / dev client / build standalone) pour que le backend
      // redirige vers CE lien précis une fois le login Google terminé,
      // au lieu d'une URL Expo générique codée en dur côté serveur.
      const googleAuthUrl = `${baseUrl}/api/auth/google?platform=mobile&redirect_uri=${encodeURIComponent(redirectUrl)}`;

      console.log('🔀 Google Login - Base URL:', baseUrl);
      console.log('🔀 Google Login - Auth URL:', googleAuthUrl);
      console.log('🔀 Google Login - Redirect URL:', redirectUrl);

      const result = await WebBrowser.openAuthSessionAsync(
        googleAuthUrl,
        redirectUrl,
        {
          showInRecents: true,
          preferEphemeralSession: false,
          createTask: true,
          enableDefaultShareMenuItem: false,
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        }
      );

      console.log('📱 Google Login - Result type:', result.type);

      if (result.type === 'success' && result.url) {
        const url = result.url;
        console.log('📱 Google Login - Callback URL:', url);

        try {
          const parsedUrl = new URL(url);
          const token = parsedUrl.searchParams.get('token');
          const error = parsedUrl.searchParams.get('error');
          
          if (token) {
            console.log('✅ Google Login - Token reçu');
            navigation.navigate('AuthCallback' as never, { token } as never);
          } else if (error) {
            console.error('❌ Google Login - Erreur:', error);
            showError(error === 'auth_failed' ? 'Échec de l\'authentification' : 'Erreur serveur');
          } else {
            showError('Token manquant');
          }
        } catch (parseError) {
          console.error('❌ Erreur parsing URL:', parseError);
          showError('Erreur lors du traitement de la réponse');
        }
      } else if (result.type === 'cancel') {
        console.log('👤 Google Login - Annulé par l\'utilisateur');
      } else {
        console.error('❌ Google Login - Type inattendu:', result.type);
        showError('Erreur lors de la connexion Google');
      }
    } catch (error: any) {
      console.error('❌ Google Login - Erreur:', error);
      showError(error?.message || 'Erreur lors de la connexion Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS_CUSTOM.background} />
      
      <View style={styles.backgroundContainer}>
        <View style={[styles.orb, styles.orb1]} />
        <View style={[styles.orb, styles.orb2]} />
        <View style={[styles.orb, styles.orb3]} />
        <View style={[styles.orb, styles.orb4]} />
        <View style={[styles.particle, styles.particle1]} />
        <View style={[styles.particle, styles.particle2]} />
        <View style={[styles.particle, styles.particle3]} />
        <View style={[styles.particle, styles.particle4]} />
        <View style={[styles.particle, styles.particle5]} />
        <View style={[styles.particle, styles.particle6]} />
        <View style={[styles.particle, styles.particle7]} />
        <View style={[styles.particle, styles.particle8]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={styles.cardContainer}>
          <View style={styles.glassCard}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Ionicons name="wallet-outline" size={36} color={COLORS_CUSTOM.white} />
              </View>
              <Text style={styles.title}>SPaye</Text>
              <Text style={styles.subtitle}>Service de paiement mobile</Text>
            </View>

            <Text style={styles.welcomeTitle}>Bienvenue</Text>
            <Text style={styles.welcomeSubtitle}>Connectez-vous à votre compte</Text>

            <View style={styles.form}>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color={COLORS_CUSTOM.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Adresse email"
                  placeholderTextColor={COLORS_CUSTOM.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading && !googleLoading}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS_CUSTOM.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Mot de passe"
                  placeholderTextColor={COLORS_CUSTOM.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading && !googleLoading}
                  onSubmitEditing={handleLogin}
                  returnKeyType="done"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={COLORS_CUSTOM.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.formOptions}>
                <TouchableOpacity style={styles.rememberMe} onPress={() => setRememberMe(!rememberMe)}>
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe && <Ionicons name="checkmark" size={14} color={COLORS_CUSTOM.white} />}
                  </View>
                  <Text style={styles.rememberMeText}>Se souvenir de moi</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword' as never)}>
                  <Text style={styles.forgotLink}>Mot de passe oublié ?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.loginButton, (loading || googleLoading) && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading || googleLoading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS_CUSTOM.white} size="small" />
                ) : (
                  <>
                    <Ionicons name="log-in-outline" size={20} color={COLORS_CUSTOM.white} />
                    <Text style={styles.loginButtonText}>Se connecter</Text>
                  </>
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
                  <ActivityIndicator color={COLORS_CUSTOM.primary} size="small" />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={22} color="#4285F4" />
                    <Text style={styles.googleButtonText}>Continuer avec Google</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.registerLinkContainer}>
                <Text style={styles.registerText}>Pas encore de compte ?</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register' as never)}>
                  <Text style={styles.registerLink}>
                    Créer un compte <Ionicons name="arrow-forward" size={16} color={COLORS_CUSTOM.white} />
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>&copy; 2024 SPaye. Tous droits réservés.</Text>
          <View style={styles.footerLinks}>
            <Text style={styles.footerLink}>Conditions</Text>
            <Text style={styles.footerSeparator}>•</Text>
            <Text style={styles.footerLink}>Confidentialité</Text>
            <Text style={styles.footerSeparator}>•</Text>
            <Text style={styles.footerLink}>Aide</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS_CUSTOM.background,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.3,
  },
  orb1: {
    width: width * 0.8,
    height: width * 0.8,
    top: -height * 0.15,
    left: -width * 0.2,
    backgroundColor: 'rgba(124, 58, 237, 0.25)',
  },
  orb2: {
    width: width * 0.9,
    height: width * 0.9,
    bottom: -height * 0.2,
    right: -width * 0.2,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  orb3: {
    width: width * 0.6,
    height: width * 0.6,
    top: '40%',
    left: '55%',
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
  },
  orb4: {
    width: width * 0.5,
    height: width * 0.5,
    top: '10%',
    right: '5%',
    backgroundColor: 'rgba(79, 70, 229, 0.15)',
  },
  particle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    opacity: 0.3,
  },
  particle1: { width: 6, height: 6, top: '10%', left: '20%' },
  particle2: { width: 4, height: 4, top: '25%', left: '85%' },
  particle3: { width: 8, height: 8, top: '60%', left: '5%' },
  particle4: { width: 5, height: 5, top: '80%', left: '70%' },
  particle5: { width: 7, height: 7, top: '45%', left: '50%' },
  particle6: { width: 3, height: 3, top: '15%', left: '60%' },
  particle7: { width: 5, height: 5, top: '70%', left: '30%' },
  particle8: { width: 4, height: 4, top: '35%', left: '15%' },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  glassCard: {
    backgroundColor: COLORS_CUSTOM.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS_CUSTOM.border,
    padding: 28,
    shadowColor: COLORS_CUSTOM.glassShadow,
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.55,
    shadowRadius: 60,
    elevation: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 14,
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS_CUSTOM.surfaceStrong,
    borderWidth: 1,
    borderColor: COLORS_CUSTOM.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: COLORS_CUSTOM.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: COLORS_CUSTOM.text,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS_CUSTOM.textSecondary,
    marginTop: 2,
  },
  welcomeTitle: {
    textAlign: 'center',
    color: COLORS_CUSTOM.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  welcomeSubtitle: {
    textAlign: 'center',
    color: COLORS_CUSTOM.textSecondary,
    fontSize: 12.5,
    marginBottom: 16,
  },
  form: {
    marginTop: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS_CUSTOM.surface,
    borderRadius: 12,
    marginBottom: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255, 255, 255, 0.35)',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS_CUSTOM.text,
  },
  passwordInput: {
    paddingRight: 8,
  },
  eyeIcon: {
    padding: 8,
  },
  formOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    flexWrap: 'wrap',
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: COLORS_CUSTOM.primary,
    borderColor: COLORS_CUSTOM.primary,
  },
  rememberMeText: {
    fontSize: 13.5,
    color: COLORS_CUSTOM.textSecondary,
  },
  forgotLink: {
    fontSize: 13.5,
    color: '#cfd6ff',
    fontWeight: '500',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS_CUSTOM.primary,
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: 'rgba(91, 127, 214, 0.45)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 10,
  },
  loginButtonText: {
    color: COLORS_CUSTOM.white,
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  dividerText: {
    color: COLORS_CUSTOM.textMuted,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS_CUSTOM.border,
  },
  googleButtonText: {
    color: '#3c3c3c',
    fontWeight: '500',
    fontSize: 15,
  },
  registerLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 4,
    flexWrap: 'wrap',
  },
  registerText: {
    fontSize: 14,
    color: COLORS_CUSTOM.textSecondary,
  },
  registerLink: {
    fontSize: 14,
    color: COLORS_CUSTOM.white,
    fontWeight: '600',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS_CUSTOM.textMuted,
    marginBottom: 4,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerLink: {
    fontSize: 12,
    color: COLORS_CUSTOM.textMuted,
  },
  footerSeparator: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.25)',
  },
});