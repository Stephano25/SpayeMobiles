import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { AdminService } from '../../src/services/AdminService';
import { COLORS } from '../../src/config';
import { router } from 'expo-router';

export default function AdminSettingsScreen() {
  const { colors } = useTheme();
  const [settings, setSettings] = useState<any>({ general: { maintenanceMode: false } });

  useEffect(() => { AdminService.getSettings().then(setSettings); }, []);

  const toggleMaintenance = async () => {
    const newMode = !settings.general.maintenanceMode;
    const updated = { ...settings, general: { ...settings.general, maintenanceMode: newMode } };
    await AdminService.updateSettings(updated);
    setSettings(updated);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres</Text><View style={{ width: 40 }} />
      </View>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.row}><Text>Mode maintenance</Text><Switch value={settings.general.maintenanceMode} onValueChange={toggleMaintenance} /></View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  backText: { fontSize: 24, color: COLORS.white },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  card: { margin: 20, padding: 20, borderRadius: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12 },
});