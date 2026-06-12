import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../src/config';

export default function AdminDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard Admin</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.gray50 },
  title: { fontSize: 24, fontWeight: 'bold' },
});