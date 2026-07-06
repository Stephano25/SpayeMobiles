// app/(admin)/admins/create.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../src/context/ThemeContext';
import { useNotification } from '../../../src/context/NotificationContext';
import { AdminService } from '../../../src/services/AdminService';
import { COLORS } from '../../../src/config/colors';

const ROLES = [
  { value: 'admin', label: 'Administrateur', icon: 'shield-outline', color: '#f59e0b' },
  { value: 'super_admin', label: 'Super Administrateur', icon: 'shield-checkmark-outline', color: '#7c3aed' },
];

export default function AdminCreateScreen() {
  const { colors } = useTheme();
  const { showSuccess, showError } = useNotification();
  const navigation = useNavigation();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [isActive, setIsActive] = useState(true);
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // QR Code
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [qrCodeGenerated, setQrCodeGenerated] = useState(false);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  const generateQRCode = async () => {
    if (!firstName || !lastName || !email || !password || !reference) {
      showError('Veuillez remplir tous les champs requis');
      return;
    }

    setGeneratingQR(true);
    try {
      const response = await AdminService.generateQRCode('deposit');
      setQrCodeImage(response.qrCodeImage);
      setQrCodeGenerated(true);
      setShowQRModal(true);
      showSuccess('QR Code généré avec succès');
    } catch (error) {
      showError('Erreur lors de la génération du QR Code');
    } finally {
      setGeneratingQR(false);
    }
  };

  const handleSubmit = async () => {
    if (!firstName || !lastName || !email || !password || !reference) {
      showError('Veuillez remplir tous les champs requis');
      return;
    }

    if (password !== confirmPassword) {
      showError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 8) {
      showError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (!qrCodeGenerated) {
      showError('Veuillez générer le QR Code');
      return;
    }

    setLoading(true);
    try {
      await AdminService.createAdmin({
        firstName,
        lastName,
        email,
        phoneNumber: phoneNumber || undefined,
        password,
        role,
        reference,
        isActive,
        qrCode: qrCodeImage,
      });
      showSuccess('Administrateur créé avec succès');
      navigation.goBack();
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score += 20;
    if (pwd.length >= 12) score += 10;
    if (/[A-Z]/.test(pwd)) score += 20;
    if (/[a-z]/.test(pwd)) score += 20;
    if (/[0-9]/.test(pwd)) score += 15;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 15;

    if (score < 40) return { label: 'Très faible', color: '#ef4444', width: score };
    if (score < 60) return { label: 'Faible', color: '#f59e0b', width: score };
    if (score < 80) return { label: 'Bon', color: '#3b82f6', width: score };
    if (score < 100) return { label: 'Fort', color: '#10b981', width: score };
    return { label: 'Très fort', color: '#10b981', width: score };
  };

  const getRoleLabel = (roleValue: string) => {
    const r = ROLES.find(r => r.value === roleValue);
    return r?.label || roleValue;
  };

  const getRoleColor = (roleValue: string) => {
    const r = ROLES.find(r => r.value === roleValue);
    return r?.color || '#6366f1';
  };

  const getRoleIcon = (roleValue: string) => {
    const r = ROLES.find(r => r.value === roleValue);
    return r?.icon || 'shield-outline';
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Créer un Administrateur</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          <Ionicons name="person-outline" size={20} color={COLORS.primary} /> Informations personnelles
        </Text>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Prénom *</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Jean"
              placeholderTextColor={COLORS.gray400}
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Nom *</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Dupont"
              placeholderTextColor={COLORS.gray400}
            />
          </View>
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Email *</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          value={email}
          onChangeText={setEmail}
          placeholder="admin@email.com"
          placeholderTextColor={COLORS.gray400}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Téléphone</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="0341234567"
          placeholderTextColor={COLORS.gray400}
          keyboardType="phone-pad"
        />

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>
          <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} /> Sécurité
        </Text>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Mot de passe *</Text>
        <View style={[styles.passwordWrapper, { borderColor: colors.border }]}>
          <TextInput
            style={[styles.passwordInput, { color: colors.text }]}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={COLORS.gray400}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.gray400} />
          </TouchableOpacity>
        </View>

        {password.length > 0 && (
          <View style={styles.strengthContainer}>
            <Text style={styles.strengthLabel}>Force :</Text>
            <View style={styles.strengthBar}>
              <View style={[styles.strengthFill, { 
                width: `${getPasswordStrength(password).width}%`,
                backgroundColor: getPasswordStrength(password).color 
              }]} />
            </View>
            <Text style={[styles.strengthText, { color: getPasswordStrength(password).color }]}>
              {getPasswordStrength(password).label}
            </Text>
          </View>
        )}

        <Text style={[styles.label, { color: colors.textSecondary }]}>Confirmer le mot de passe *</Text>
        <View style={[styles.passwordWrapper, { borderColor: colors.border }]}>
          <TextInput
            style={[styles.passwordInput, { color: colors.text }]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="••••••••"
            placeholderTextColor={COLORS.gray400}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
            <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.gray400} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>
          <Ionicons name="settings-outline" size={20} color={COLORS.primary} /> Rôle et statut
        </Text>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Rôle *</Text>
        <View style={styles.roleContainer}>
          {ROLES.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={[
                styles.roleOption,
                { backgroundColor: colors.background },
                role === r.value && { borderColor: r.color, backgroundColor: r.color + '15' }
              ]}
              onPress={() => setRole(r.value)}
            >
              <Ionicons name={r.icon as any} size={24} color={role === r.value ? r.color : COLORS.gray400} />
              <Text style={[styles.roleLabel, { color: role === r.value ? r.color : colors.textSecondary }]}>
                {r.label}
              </Text>
              {role === r.value && (
                <View style={[styles.roleCheck, { backgroundColor: r.color }]}>
                  <Ionicons name="checkmark" size={12} color={COLORS.white} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Référence *</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          value={reference}
          onChangeText={setReference}
          placeholder="ADMIN-001"
          placeholderTextColor={COLORS.gray400}
        />

        <View style={styles.statusRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Compte actif</Text>
          <Switch
            value={isActive}
            onValueChange={setIsActive}
            trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
            thumbColor={COLORS.white}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>
          <Ionicons name="qr-code-outline" size={20} color={COLORS.primary} /> QR Code
        </Text>

        <TouchableOpacity
          style={[styles.qrButton, { backgroundColor: COLORS.primary }]}
          onPress={generateQRCode}
          disabled={generatingQR || !firstName || !lastName || !email || !password || !reference}
        >
          {generatingQR ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="qr-code" size={20} color={COLORS.white} />
              <Text style={styles.qrButtonText}>Générer le QR Code</Text>
            </>
          )}
        </TouchableOpacity>

        {qrCodeGenerated && (
          <View style={styles.qrStatus}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={[styles.qrStatusText, { color: COLORS.success }]}>QR Code généré avec succès</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: COLORS.primary }]}
          onPress={handleSubmit}
          disabled={loading || !qrCodeGenerated}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitButtonText}>Créer l'administrateur</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal QR Code */}
      <Modal
        visible={showQRModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>QR Code</Text>
              <TouchableOpacity onPress={() => setShowQRModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {qrCodeImage && (
              <Image source={{ uri: qrCodeImage }} style={styles.qrImage} resizeMode="contain" />
            )}

            <View style={styles.qrDetails}>
              <View style={styles.qrDetail}>
                <Text style={[styles.qrDetailLabel, { color: colors.textSecondary }]}>Nom</Text>
                <Text style={[styles.qrDetailValue, { color: colors.text }]}>
                  {firstName} {lastName}
                </Text>
              </View>
              <View style={styles.qrDetail}>
                <Text style={[styles.qrDetailLabel, { color: colors.textSecondary }]}>Email</Text>
                <Text style={[styles.qrDetailValue, { color: colors.text }]}>{email}</Text>
              </View>
              <View style={styles.qrDetail}>
                <Text style={[styles.qrDetailLabel, { color: colors.textSecondary }]}>Rôle</Text>
                <Text style={[styles.qrDetailValue, { color: getRoleColor(role) }]}>
                  {getRoleLabel(role)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.modalCloseBtn, { backgroundColor: COLORS.primary }]}
              onPress={() => setShowQRModal(false)}
            >
              <Text style={styles.modalCloseBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white, flex: 1, marginLeft: 8 },
  card: {
    margin: 16,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    marginBottom: 4,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
  },
  eyeBtn: {
    padding: 8,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 4,
    gap: 8,
  },
  strengthLabel: {
    fontSize: 12,
    color: COLORS.gray400,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.gray200,
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  roleOption: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    gap: 4,
  },
  roleLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  roleCheck: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  qrButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 15,
  },
  qrStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  qrStatusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  qrImage: {
    width: '100%',
    height: 200,
    marginBottom: 16,
  },
  qrDetails: {
    gap: 8,
    marginBottom: 16,
  },
  qrDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray200,
  },
  qrDetailLabel: {
    fontSize: 13,
  },
  qrDetailValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalCloseBtn: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 15,
  },
});