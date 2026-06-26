import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { GlassCard } from '@/components/ui/glass-card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { FontFamily, Radius, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { changeEmail, changePassword, updateName } from '@/services/auth';

interface AccountSettingsCardProps {
  uid: string;
  nameLabel?: string;
  currentName?: string;
  currentEmail: string;
  onNameSaved?: (name: string) => void;
}

export function AccountSettingsCard({ uid, nameLabel, currentName, currentEmail, onNameSaved }: AccountSettingsCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [name, setName] = useState(currentName ?? '');
  const [savingName, setSavingName] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleSaveName() {
    if (!name.trim() || savingName) return;
    setSavingName(true);
    try {
      await updateName(uid, name.trim());
      onNameSaved?.(name.trim());
      Alert.alert('Nom mis à jour');
    } catch {
      Alert.alert('Erreur', "Le nom n'a pas pu être mis à jour.");
    } finally {
      setSavingName(false);
    }
  }

  async function handleChangeEmail() {
    if (!newEmail.trim() || !emailPassword || savingEmail) return;
    setSavingEmail(true);
    try {
      await changeEmail(emailPassword, newEmail.trim());
      setEmailPassword('');
      setNewEmail('');
      Alert.alert('Email mis à jour');
    } catch {
      Alert.alert('Erreur', "Vérifiez votre mot de passe actuel et le nouvel email.");
    } finally {
      setSavingEmail(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || savingPassword) return;
    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Erreur', 'Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Mot de passe mis à jour');
    } catch {
      Alert.alert('Erreur', 'Vérifiez votre mot de passe actuel.');
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <>
      {nameLabel && (
        <>
          <Text style={styles.sectionLabel}>{nameLabel}</Text>
          <GlassCard style={styles.card}>
            <TextField label={nameLabel} value={name} onChangeText={setName} />
            <PrimaryButton label="Enregistrer" onPress={handleSaveName} loading={savingName} />
          </GlassCard>
        </>
      )}

      <Text style={styles.sectionLabel}>Changer d'email</Text>
      <GlassCard style={styles.card}>
        <Text style={styles.currentValue}>Actuel : {currentEmail}</Text>
        <TextField label="Nouvel email" value={newEmail} onChangeText={setNewEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextField label="Mot de passe actuel" value={emailPassword} onChangeText={setEmailPassword} secureTextEntry />
        <PrimaryButton label="Mettre à jour l'email" onPress={handleChangeEmail} loading={savingEmail} />
      </GlassCard>

      <Text style={styles.sectionLabel}>Changer de mot de passe</Text>
      <GlassCard style={styles.card}>
        <TextField label="Mot de passe actuel" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
        <TextField label="Nouveau mot de passe" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
        <TextField label="Confirmer le nouveau mot de passe" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
        <PrimaryButton label="Mettre à jour le mot de passe" onPress={handleChangePassword} loading={savingPassword} />
      </GlassCard>
    </>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    sectionLabel: {
      fontFamily: FontFamily.sansExtraBold,
      fontSize: 10.5,
      color: colors.text.tertiary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 10,
    },
    card: {
      borderRadius: Radius.lg,
      marginBottom: 22,
      padding: 16,
      gap: 4,
    },
    currentValue: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 12.5,
      color: colors.text.secondary,
      marginBottom: 6,
    },
  });
}
