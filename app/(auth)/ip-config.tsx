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
  Alert,
} from 'react-native';
import { setBackendIp, getStoredIp, getApiUrl, detectBackendIP, COLORS, SHADOW } from '../../src/config';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function IPConfigScreen() {
  const [ip, setIp] = useState('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [currentApiUrl, setCurrentApiUrl] = useState('');
  const [detectedIp, setDetectedIp] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    loadSavedIP();
    loadCurrentApiUrl();
    autoDetectIPOnStart();
  }, []);

  const loadSavedIP = async () => {
    const savedIp = await getStoredIp();
    if (savedIp) setIp(savedIp);
  };

  const loadCurrentApiUrl = async () => {
    const url = await getApiUrl();
    setCurrentApiUrl(url);
  };

  const autoDetectIPOnStart = async () => {
    setIsDetecting(true);
    try {
      const detected = await detectBackendIP();
      if (detected) {
        setDetectedIp(detected);
        setIp(detected);
        await loadCurrentApiUrl();
        Alert.alert(
          '✅ Connexion automatique',
          `IP ${detected} détectée et configurée automatiquement !`,
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
        );
      }
    } catch (error) {
      console.error('❌ Erreur détection IP:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  const testConnection = async (ipToTest: string = ip) => {
    if (!ipToTest.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse IP');
      return false;
    }

    setTesting(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`http://${ipToTest.trim()}:3000/api/health`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      
      clearTimeout(timeoutId);
      
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
      const success = await testConnection(ip.trim());
      if (success) {
        await setBackendIp(ip.trim());
        await loadCurrentApiUrl();
        Alert.alert(
          'Succès !',
          `IP ${ip.trim()} configurée avec succès !`,
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
        );
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  };

  const manualAutoDetect = async () => {
    setIsDetecting(true);
    Alert.alert('Détection', 'Recherche du serveur sur le réseau local...');
    await autoDetectIPOnStart();
    setIsDetecting(false);
  };

  if (isDetecting) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <View style={styles.detectingCard}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.detectingTitle}>Recherche du serveur...</Text>
          <Text style={styles.detectingSubtitle}>Scan du réseau local en cours</Text>
          <View style={styles.detectingDots}>
            <View style={[styles.dot, styles.dot1]} />
            <View style={[styles.dot, styles.dot2]} />
            <View style={[styles.dot, styles.dot3]} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="settings-outline" size={48} color={COLORS.white} />
          </View>
          <Text style={styles.title}>Configuration IP</Text>
          <Text style={styles.subtitle}>Entrez l'adresse IP du serveur backend</Text>
          
          <View style={styles.currentIpContainer}>
            <Ionicons name="wifi-outline" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={styles.currentIp}>Actuelle: {currentApiUrl || 'Non configurée'}</Text>
          </View>

          {detectedIp && (
            <View style={styles.detectedContainer}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.detectedText}>IP détectée: {detectedIp}</Text>
            </View>
          )}
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Adresse IP du serveur</Text>
            <TextInput
              style={styles.input}
              placeholder="192.168.1.100"
              placeholderTextColor={COLORS.gray400}
              value={ip}
              onChangeText={setIp}
              keyboardType="numeric"
              autoCapitalize="none"
              editable={!loading && !testing}
            />
            <Text style={styles.hint}>💡 L'IP est détectée automatiquement au démarrage</Text>
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, (loading || testing) && styles.buttonDisabled]}
              onPress={saveAndTest}
              disabled={loading || testing || !ip.trim()}
            >
              {loading ? <ActivityIndicator color={COLORS.primary} /> : (
                <>
                  <Ionicons name="save-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.buttonText}>Configurer</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testButton, (loading || testing) && styles.buttonDisabled]}
              onPress={() => testConnection()}
              disabled={loading || testing || !ip.trim()}
            >
              {testing ? <ActivityIndicator color={COLORS.white} /> : (
                <>
                  <Ionicons name="wifi-outline" size={20} color={COLORS.white} />
                  <Text style={styles.testButtonText}>Tester</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.autoDetectButton}
            onPress={manualAutoDetect}
            disabled={loading || testing || isDetecting}
          >
            <Ionicons name="scan-outline" size={20} color={COLORS.white} />
            <Text style={styles.autoDetectText}>
              {isDetecting ? 'Recherche en cours...' : 'Détection automatique'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resetButton}
            onPress={async () => {
              await setBackendIp('');
              setIp('');
              setDetectedIp(null);
              await loadCurrentApiUrl();
              Alert.alert('IP réinitialisée', 'L\'IP par défaut sera utilisée au prochain démarrage.');
            }}
          >
            <Text style={styles.resetText}>Réinitialiser l'IP</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>L'IP est automatiquement sauvegardée pour les prochaines utilisations</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  centerContainer: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { flexGrow: 1, padding: 24, paddingTop: 60 },
  closeBtn: { alignSelf: 'flex-end', padding: 8 },
  header: { alignItems: 'center', marginBottom: 32 },
  iconContainer: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.white, marginTop: 4 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 4, textAlign: 'center' },
  currentIpContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
  },
  currentIp: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  detectedContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
  },
  detectedText: { fontSize: 13, color: COLORS.success, fontWeight: '600' },
  form: { flex: 1 },
  inputContainer: { marginBottom: 20 },
  inputLabel: { color: COLORS.white, fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, fontSize: 16, color: COLORS.text },
  hint: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 8 },
  buttonGroup: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  button: {
    flex: 1, backgroundColor: COLORS.white, padding: 16, borderRadius: 12,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 16 },
  testButton: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', padding: 16, borderRadius: 12,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: COLORS.white,
  },
  testButtonText: { color: COLORS.white, fontWeight: '600', fontSize: 16 },
  autoDetectButton: {
    backgroundColor: 'rgba(255,255,255,0.15)', padding: 14, borderRadius: 12,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', marginBottom: 8,
  },
  autoDetectText: { color: COLORS.white, fontWeight: '600', fontSize: 15 },
  resetButton: { alignItems: 'center', padding: 12 },
  resetText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, textDecorationLine: 'underline' },
  footer: { marginTop: 20, alignItems: 'center' },
  footerText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, textAlign: 'center' },
  detectingCard: {
    backgroundColor: COLORS.white, borderRadius: 24, padding: 40,
    alignItems: 'center', ...SHADOW.lg,
  },
  detectingTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginTop: 20 },
  detectingSubtitle: { fontSize: 14, color: COLORS.gray400, marginTop: 8 },
  detectingDots: { flexDirection: 'row', gap: 8, marginTop: 24 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  dot1: { opacity: 1 },
  dot2: { opacity: 0.5 },
  dot3: { opacity: 0.2 },
});