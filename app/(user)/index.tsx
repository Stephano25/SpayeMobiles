import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, formatAmount } from '../../src/config';
import { router } from 'expo-router';

export default function UserHome() {
  const { user, logout } = useAuth();
  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Bienvenue {user?.firstName} {user?.lastName}</Text>
      <Text style={styles.balance}>Solde : {formatAmount(user?.balance || 0)} Ar</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/(user)/wallet')}><Text>Portefeuille</Text></TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={logout}><Text>Déconnexion</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: COLORS.gray50 },
  welcome: { fontSize: 24, marginBottom: 20 },
  balance: { fontSize: 18, color: COLORS.primary, marginBottom: 20 },
  button: { backgroundColor: COLORS.primary, padding: 12, borderRadius: 8, marginVertical: 5, alignItems: 'center' },
});