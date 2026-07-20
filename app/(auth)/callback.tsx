// app/(auth)/callback.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../src/context/AuthContext';
import { useNotification } from '../../src/context/NotificationContext';
import { Ionicons } from '@expo/vector-icons';
import { getApiUrl } from '../../src/config/api';

const { width } = Dimensions.get('window');

const COLORS_CUSTOM = {
  primary: '#6366f1',
  background: '#0d0820',
  surface: 'rgba(255, 255, 255, 0.10)',
  border: 'rgba(255, 255, 255, 0.22)',
  text: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.68)',
  success: '#10b981',
  error: '#ef4444',
  white: '#ffffff',
  glassShadow: 'rgba(10, 6, 30, 0.55)',
};

export default function AuthCallbackScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { loginWithToken } = useAuth();
  const { showError } = useNotification();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // ✅ Récupérer le token des paramètres
  const token = (route.params as any)?.token;

  useEffect(() => {
    console.log('📱 AuthCallback - Token reçu:', token ? token.substring(0, 20) + '...' : 'AUCUN');
    
    if (token) {
      handleToken(token);
    } else {
      setError('Token manquant');
      setLoading(false);
      setTimeout(() => navigation.replace('Login'), 3000);
    }
  }, [token]);

  const handleToken = async (token: string) => {
    try {
      console.log('✅ Callback - Traitement du token');
      
      const apiUrl = await getApiUrl();
      console.log(`📡 Appel API: ${apiUrl}/auth/profile`);
      
      // ✅ Récupérer le profil
      const response = await fetch(`${apiUrl}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`📡 Response status: ${response.status}`);

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ Callback - Profil récupéré:', userData.email);
        
        // ✅ Connexion via le contexte avec loginWithToken
        await loginWithToken(token, userData);
        
        setLoading(false);
        
        // ✅ La redirection est gérée par loginWithToken
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Callback - Erreur profil:', errorData);
        setError(errorData.message || 'Erreur lors de la récupération du profil');
        setLoading(false);
        setTimeout(() => navigation.replace('Login'), 3000);
      }
    } catch (error: any) {
      console.error('❌ Callback - Erreur:', error);
      setError(error.message || 'Erreur de connexion');
      setLoading(false);
      setTimeout(() => navigation.replace('Login'), 3000);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS_CUSTOM.background} />
      
      <View style={styles.card}>
        <View style={styles.logoCircle}>
          <Ionicons name="account-balance-wallet" size={36} color={COLORS_CUSTOM.white} />
        </View>

        {loading ? (
          <>
            <View style={styles.spinnerWrapper}>
              <ActivityIndicator size="large" color={COLORS_CUSTOM.primary} />
            </View>
            <Text style={styles.title}>Connexion en cours…</Text>
            <Text style={styles.subtitle}>Vérification de vos identifiants</Text>
            <View style={styles.progressBar}>
              <View style={styles.progressFill} />
            </View>
          </>
        ) : error ? (
          <>
            <Ionicons name="alert-circle" size={48} color={COLORS_CUSTOM.error} />
            <Text style={[styles.title, styles.errorText]}>Erreur de connexion</Text>
            <Text style={[styles.subtitle, styles.errorMessage]}>{error}</Text>
          </>
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={48} color={COLORS_CUSTOM.success} />
            <Text style={styles.title}>Connexion réussie !</Text>
            <Text style={styles.subtitle}>Redirection en cours...</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS_CUSTOM.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: COLORS_CUSTOM.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS_CUSTOM.border,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: COLORS_CUSTOM.glassShadow,
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.55,
    shadowRadius: 60,
    elevation: 24,
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: COLORS_CUSTOM.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  spinnerWrapper: {
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS_CUSTOM.text,
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS_CUSTOM.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 20,
  },
  progressFill: {
    width: '60%',
    height: '100%',
    backgroundColor: COLORS_CUSTOM.primary,
    borderRadius: 999,
  },
  errorText: {
    color: COLORS_CUSTOM.error,
  },
  errorMessage: {
    color: COLORS_CUSTOM.error,
    marginTop: 8,
  },
});