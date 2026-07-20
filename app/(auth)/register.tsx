// app/(auth)/register.tsx
// ─────────────────────────────────────────────────────────────
//  SPaye · Register Screen — Design Glassmorphism identique à Angular
//  Compatible avec le backend NestJS
// ─────────────────────────────────────────────────────────────
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
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../src/context/AuthContext';
import { useNotification } from '../../src/context/NotificationContext';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// ─── Design tokens (identique à Angular) ─────────────────────
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

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const { register } = useAuth();
  const { showError } = useNotification();
  const navigation = useNavigation();

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password) {
      showError('Tous les champs sont requis');
      return;
    }
    if (password !== confirm) {
      showError('Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 6) {
      showError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (!acceptTerms) {
      showError('Vous devez accepter les conditions d\'utilisation');
      return;
    }

    setLoading(true);
    try {
      await register({ firstName, lastName, email, password, phoneNumber: phone });
    } catch (e: any) {
      showError(e?.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS_CUSTOM.background} />

      {/* ─── Arrière-plan avec orbes flottantes ─── */}
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
        {/* ─── Carte Glassmorphism ─── */}
        <View style={styles.cardContainer}>
          <View style={styles.glassCard}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Ionicons name="person-add-outline" size={36} color={COLORS_CUSTOM.white} />
              </View>
              <Text style={styles.title}>SPaye</Text>
              <Text style={styles.subtitle}>Créez votre compte</Text>
            </View>

            <Text style={styles.welcomeTitle}>Rejoignez SPaye</Text>
            <Text style={styles.welcomeSubtitle}>Commencez à effectuer vos paiements en toute simplicité</Text>

            {/* Formulaire */}
            <View style={styles.form}>
              {/* Prénom et Nom */}
              <View style={styles.row}>
                <View style={[styles.inputWrapper, styles.halfWidth]}>
                  <Ionicons name="person-outline" size={20} color={COLORS_CUSTOM.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Prénom"
                    placeholderTextColor={COLORS_CUSTOM.textMuted}
                    value={firstName}
                    onChangeText={setFirstName}
                    editable={!loading}
                    returnKeyType="next"
                  />
                </View>
                <View style={[styles.inputWrapper, styles.halfWidth]}>
                  <Ionicons name="person-outline" size={20} color={COLORS_CUSTOM.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nom"
                    placeholderTextColor={COLORS_CUSTOM.textMuted}
                    value={lastName}
                    onChangeText={setLastName}
                    editable={!loading}
                    returnKeyType="next"
                  />
                </View>
              </View>

              {/* Email */}
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
                  editable={!loading}
                  returnKeyType="next"
                />
              </View>

              {/* Téléphone */}
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color={COLORS_CUSTOM.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Téléphone (optionnel)"
                  placeholderTextColor={COLORS_CUSTOM.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  editable={!loading}
                  returnKeyType="next"
                />
              </View>

              {/* Mot de passe */}
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS_CUSTOM.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Mot de passe"
                  placeholderTextColor={COLORS_CUSTOM.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                  returnKeyType="next"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={COLORS_CUSTOM.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Confirmation */}
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS_CUSTOM.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Confirmer le mot de passe"
                  placeholderTextColor={COLORS_CUSTOM.textMuted}
                  secureTextEntry={!showConfirmPassword}
                  value={confirm}
                  onChangeText={setConfirm}
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={COLORS_CUSTOM.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Conditions */}
              <View style={styles.termsContainer}>
                <TouchableOpacity style={styles.termsCheckbox} onPress={() => setAcceptTerms(!acceptTerms)}>
                  <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                    {acceptTerms && <Ionicons name="checkmark" size={14} color={COLORS_CUSTOM.white} />}
                  </View>
                </TouchableOpacity>
                <Text style={styles.termsText}>
                  J'accepte les <Text style={styles.termsLink}>conditions d'utilisation</Text> et la <Text style={styles.termsLink}>politique de confidentialité</Text>
                </Text>
              </View>

              {/* Bouton d'inscription */}
              <TouchableOpacity
                style={[styles.registerButton, (loading || !acceptTerms) && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={loading || !acceptTerms}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS_CUSTOM.white} size="small" />
                ) : (
                  <>
                    <Ionicons name="person-add" size={20} color={COLORS_CUSTOM.white} />
                    <Text style={styles.registerButtonText}>Créer mon compte</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Lien connexion */}
              <View style={styles.loginLinkContainer}>
                <Text style={styles.loginText}>Déjà inscrit ?</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
                  <Text style={styles.loginLink}>Se connecter <Ionicons name="arrow-forward" size={16} color={COLORS_CUSTOM.white} /></Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS_CUSTOM.background,
  },

  // ─── Arrière-plan avec orbes ───
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
    paddingVertical: 30,
  },

  // ─── Carte Glassmorphism ───
  cardContainer: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  glassCard: {
    backgroundColor: COLORS_CUSTOM.surface,
    backdropFilter: Platform.OS === 'ios' ? 'blur(28px)' : undefined,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS_CUSTOM.border,
    padding: 24,
    shadowColor: COLORS_CUSTOM.glassShadow,
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.55,
    shadowRadius: 60,
    elevation: 24,
  },

  // ─── Logo ───
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS_CUSTOM.surfaceStrong,
    borderWidth: 1,
    borderColor: COLORS_CUSTOM.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: COLORS_CUSTOM.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
  title: {
    fontSize: 22,
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
    fontSize: 12,
    marginBottom: 12,
  },

  // ─── Form ───
  form: {
    marginTop: 6,
  },

  // ─── Row ───
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 0,
  },
  halfWidth: {
    flex: 1,
  },

  // ─── Inputs ───
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS_CUSTOM.surface,
    borderRadius: 12,
    marginBottom: 12,
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

  // ─── Terms ───
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
    marginBottom: 16,
    gap: 10,
  },
  termsCheckbox: {
    paddingTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS_CUSTOM.primary,
    borderColor: COLORS_CUSTOM.primary,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: COLORS_CUSTOM.textSecondary,
    lineHeight: 20,
  },
  termsLink: {
    color: '#cfd6ff',
    fontWeight: '500',
  },

  // ─── Register Button ───
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS_CUSTOM.primary,
    paddingVertical: 16,
    borderRadius: 24,
    shadowColor: 'rgba(91, 127, 214, 0.45)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 10,
  },
  registerButtonText: {
    color: COLORS_CUSTOM.white,
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  buttonDisabled: {
    opacity: 0.55,
  },

  // ─── Login Link ───
  loginLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 4,
    flexWrap: 'wrap',
  },
  loginText: {
    fontSize: 13.5,
    color: COLORS_CUSTOM.textSecondary,
  },
  loginLink: {
    fontSize: 13.5,
    color: COLORS_CUSTOM.white,
    fontWeight: '600',
  },

  // ─── Footer ───
  footer: {
    marginTop: 16,
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