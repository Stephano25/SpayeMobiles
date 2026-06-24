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
import { useTranslation } from '../../src/services/TranslationService';

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();
  const { showError, showSuccess } = useNotification();
  const { t } = useTranslation();
  const scrollViewRef = useRef<ScrollView>(null);

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password) {
      showError(t('error'));
      return;
    }
    if (password !== confirm) {
      showError(t('error'));
      return;
    }
    if (password.length < 6) {
      showError(t('error'));
      return;
    }

    setLoading(true);
    try {
      await register({ firstName, lastName, email, password, phoneNumber: phone });
    } catch (e: any) {
      showError(e?.response?.data?.message || t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    try {
      const apiUrl = await AuthService.getApiUrl();
      const result = await WebBrowser.openAuthSessionAsync(
        `${apiUrl}/auth/google`,
        'spaye://auth/callback'
      );

      if (result.type === 'success') {
        const url = new URL(result.url);
        const token = url.searchParams.get('token');
        if (token) {
          await AuthService.handleGoogleCallback(token);
          const user = await AuthService.getUser();
          const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
          router.replace(isAdmin ? '/(admin)' : '/(user)');
          showSuccess(t('success'));
        } else {
          showError(t('error'));
        }
      } else if (result.type === 'cancel') {
        showError(t('error'));
      }
    } catch (error: any) {
      console.error('Erreur Google Register:', error);
      showError(t('error'));
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
              <Ionicons name="person-add-outline" size={48} color={COLORS.white} />
            </View>
            <Text style={styles.title}>{t('app_name')}</Text>
            <Text style={styles.subtitle}>{t('register')}</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder={t('first_name')}
              placeholderTextColor={COLORS.gray400}
              value={firstName}
              onChangeText={setFirstName}
              editable={!loading && !googleLoading}
              returnKeyType="next"
            />

            <TextInput
              style={styles.input}
              placeholder={t('last_name')}
              placeholderTextColor={COLORS.gray400}
              value={lastName}
              onChangeText={setLastName}
              editable={!loading && !googleLoading}
              returnKeyType="next"
            />

            <TextInput
              style={styles.input}
              placeholder={t('email')}
              placeholderTextColor={COLORS.gray400}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading && !googleLoading}
              returnKeyType="next"
            />

            <TextInput
              style={styles.input}
              placeholder={t('phone')}
              placeholderTextColor={COLORS.gray400}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={!loading && !googleLoading}
              returnKeyType="next"
            />

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.inputWithIcon}
                placeholder={t('password')}
                placeholderTextColor={COLORS.gray400}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                editable={!loading && !googleLoading}
                returnKeyType="next"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={COLORS.gray400} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.inputWithIcon}
                placeholder={t('confirm_password')}
                placeholderTextColor={COLORS.gray400}
                secureTextEntry={!showConfirmPassword}
                value={confirm}
                onChangeText={setConfirm}
                editable={!loading && !googleLoading}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                <Ionicons name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={COLORS.gray400} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, (loading || googleLoading) && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading || googleLoading}
            >
              {loading ? <ActivityIndicator color={COLORS.primary} size="small" /> : <Text style={styles.buttonText}>{t('register')}</Text>}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[styles.googleButton, (loading || googleLoading) && styles.buttonDisabled]}
              onPress={handleGoogleRegister}
              disabled={loading || googleLoading}
              activeOpacity={0.7}
            >
              {googleLoading ? (
                <ActivityIndicator color={COLORS.primary} size="small" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={22} color={COLORS.primary} />
                  <Text style={styles.googleButtonText}>{t('continue_with_google')}</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/(auth)/login')} disabled={loading || googleLoading}>
              <Text style={styles.link}>{t('have_account')}</Text>
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
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 40 },
  logoContainer: { alignItems: 'center', marginBottom: 24 },
  logoCircle: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 32, fontWeight: 'bold', color: COLORS.white, textAlign: 'center' },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 4 },
  form: { width: '100%' },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: 16,
    marginBottom: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  inputWithIcon: { flex: 1, paddingVertical: 16, fontSize: 16, color: COLORS.text },
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
  link: { color: COLORS.white, textAlign: 'center', marginTop: 20, textDecorationLine: 'underline', fontSize: 14 },
  bottomSpacer: { height: 30 },
});