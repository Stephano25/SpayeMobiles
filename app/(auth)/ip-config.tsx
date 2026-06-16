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
  Alert,
} from 'react-native';
import { setBackendIp, getStoredIp, getApiUrl } from '../../src/config';
import { COLORS } from '../../src/config';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function IPConfigScreen() {
  const [ip, setIp] = useState('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadSavedIP();
  }, []);

  const loadSavedIP = async () => {
    const savedIp = await getStoredIp();
    if (savedIp) {
      setIp(savedIp);
    }
  };

  const testConnection = async () => {
    if (!ip.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse IP');
      return;
    }

    setTesting(true);
    try {
      const apiUrl = `http://${ip.trim()}:3000/api/health`;
      const response = await fetch(apiUrl);
      if (response.ok) {
        Alert.alert('Succès', '✅ Connexion au serveur réussie !');
        return true;
      } else {
        Alert.alert('Erreur', '❌ Le serveur répond mais avec une erreur');
        return false;
      }
    } catch (error) {
      Alert.alert('Erreur', '❌ Serveur inaccessible. Vérifiez l\'IP et le réseau.');
      return false;
    } finally {
      setTesting(false);
    }
  };

  const saveAndTest = async () => {
    if (!ip.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse IP');
      return;
    }

    setLoading(true);
    try {
      // Tester la connexion
      const apiUrl = `http://${ip.trim()}:3000/api/health`;
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        // Sauvegarder l'IP
        await setBackendIp(ip.trim());
        Alert.alert(
          'Succès !',
          `IP ${ip.trim()} configurée avec succès !\nL'application va redémarrer.`,
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace('/(auth)/login');
              },
            },
          ]
        );
      } else {
        Alert.alert('Erreur', 'Le serveur répond mais avec une erreur. Vérifiez que le backend est correctement configuré.');
      }
    } catch (error) {
      Alert.alert(
        'Erreur de connexion',
        'Impossible de contacter le serveur.\n\nVérifiez :\n1. L\'IP est correcte\n2. Le backend est démarré\n3. Vous êtes sur le même réseau WiFi'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Ionicons name="settings-outline" size={48} color={COLORS.white} />
          <Text style={styles.title}>Configuration IP</Text>
          <Text style={styles.subtitle}>Entrez l'adresse IP du serveur backend</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Adresse IP du serveur</Text>
            <TextInput
              style={styles.input}
              placeholder="192.168.188.135"
              placeholderTextColor={COLORS.gray400}
              value={ip}
              onChangeText={setIp}
              keyboardType="numeric"
              autoCapitalize="none"
              editable={!loading && !testing}
            />
            <Text style={styles.hint}>
              💡 Tapez "ipconfig" (Windows) ou "ifconfig" (Mac) pour trouver votre IP
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, (loading || testing) && styles.buttonDisabled]}
            onPress={saveAndTest}
            disabled={loading || testing || !ip.trim()}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color={COLORS.white} />
                <Text style={styles.buttonText}>Configurer et tester</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, (loading || testing) && styles.buttonDisabled]}
            onPress={testConnection}
            disabled={loading || testing || !ip.trim()}
          >
            {testing ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <>
                <Ionicons name="wifi-outline" size={20} color={COLORS.primary} />
                <Text style={styles.testButtonText}>Tester la connexion</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resetButton}
            onPress={async () => {
              await setBackendIp('');
              setIp('');
              Alert.alert('IP réinitialisée', 'L\'IP par défaut sera utilisée au prochain démarrage.');
            }}
          >
            <Text style={styles.resetText}>Réinitialiser l'IP</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            L'IP sera sauvegardée pour les prochaines utilisations
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  hint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 8,
  },
  button: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  testButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.white,
    marginBottom: 12,
  },
  testButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  resetButton: {
    alignItems: 'center',
    padding: 12,
  },
  resetText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    textAlign: 'center',
  },
});