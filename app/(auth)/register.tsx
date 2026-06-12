import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useNotification } from '../../src/context/NotificationContext';
import { COLORS } from '../../src/config';
import { router } from 'expo-router';

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { showError } = useNotification();

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password) return showError('Tous les champs obligatoires');
    if (password !== confirm) return showError('Les mots de passe ne correspondent pas');
    if (password.length < 6) return showError('Mot de passe min 6 caractères');
    setLoading(true);
    try {
      await register({ firstName, lastName, email, password, phoneNumber: phone });
    } catch (e: any) {
      showError(e.response?.data?.message || 'Erreur inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.logo}>SPaye</Text>
      <Text style={styles.subtitle}>Créer un compte</Text>
      <TextInput style={styles.input} placeholder="Prénom" value={firstName} onChangeText={setFirstName} />
      <TextInput style={styles.input} placeholder="Nom" value={lastName} onChangeText={setLastName} />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Téléphone (optionnel)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Mot de passe" secureTextEntry value={password} onChangeText={setPassword} />
      <TextInput style={styles.input} placeholder="Confirmer mot de passe" secureTextEntry value={confirm} onChangeText={setConfirm} />
      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>S'inscrire</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
        <Text style={styles.link}>Déjà un compte ? Se connecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary, padding: 20, paddingTop: 80 },
  logo: { fontSize: 48, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 18, color: 'white', textAlign: 'center', marginBottom: 30 },
  input: { backgroundColor: 'white', borderRadius: 10, padding: 15, marginBottom: 15, fontSize: 16 },
  button: { backgroundColor: COLORS.white, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 16 },
  link: { color: 'white', textAlign: 'center', marginTop: 20, textDecorationLine: 'underline' },
});