// app/(auth)/register.tsx
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="person-add-outline" size={48} color={COLORS.white} />
          </View>
          <Text style={styles.title}>SPaye</Text>
          <Text style={styles.subtitle}>Inscription</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Prénom"
            placeholderTextColor={COLORS.gray400}
            value={firstName}
            onChangeText={setFirstName}
            editable={!loading}
            returnKeyType="next"
          />

          <TextInput
            style={styles.input}
            placeholder="Nom"
            placeholderTextColor={COLORS.gray400}
            value={lastName}
            onChangeText={setLastName}
            editable={!loading}
            returnKeyType="next"
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.gray400}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
            returnKeyType="next"
          />

          <TextInput
            style={styles.input}
            placeholder="Téléphone (optionnel)"
            placeholderTextColor={COLORS.gray400}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            editable={!loading}
            returnKeyType="next"
          />

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.inputWithIcon}
              placeholder="Mot de passe"
              placeholderTextColor={COLORS.gray400}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              editable={!loading}
              returnKeyType="next"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={COLORS.gray400} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.inputWithIcon}
              placeholder="Confirmer le mot de passe"
              placeholderTextColor={COLORS.gray400}
              secureTextEntry={!showConfirmPassword}
              value={confirm}
              onChangeText={setConfirm}
              editable={!loading}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
              <Ionicons name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={COLORS.gray400} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.primary} size="small" />
            ) : (
              <Text style={styles.buttonText}>S'inscrire</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login' as never)}
            disabled={loading}
            style={styles.loginLink}
          >
            <Text style={styles.link}>Déjà un compte ? Se connecter</Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 40 },
  logoContainer: { alignItems: 'center', marginBottom: 24 },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
  loginLink: { marginTop: 20, alignItems: 'center' },
  link: { color: COLORS.white, textDecorationLine: 'underline', fontSize: 14 },
  bottomSpacer: { height: 30 },
});