import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AmbientBackground } from '@/components/ambient-background';
import { IconChevronLeft } from '@/components/icons';
import { GlassCard } from '@/components/ui/glass-card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { FontFamily, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Address } from '@/services/auth';

interface SingleAddressScreenProps {
  initialAddress?: Address;
  onSave: (address: Address) => Promise<void>;
}

export function SingleAddressScreen({ initialAddress, onSave }: SingleAddressScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [street, setStreet] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [city, setCity] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialAddress) {
      setStreet(initialAddress.street);
      setZipCode(initialAddress.zipCode);
      setCity(initialAddress.city);
    }
  }, [initialAddress]);

  async function handleSave() {
    if (saving) return;
    if (!street.trim() || !zipCode.trim() || !city.trim()) {
      Alert.alert('Adresse incomplète', 'Merci de renseigner les 3 champs.');
      return;
    }
    setSaving(true);
    try {
      await onSave({ street: street.trim(), zipCode: zipCode.trim(), city: city.trim() });
      Alert.alert('Adresse enregistrée');
    } catch {
      Alert.alert('Erreur', "L'adresse n'a pas pu être enregistrée.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <AmbientBackground />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topbar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <IconChevronLeft size={18} color={colors.text.secondary} strokeWidth={2.2} />
          </Pressable>
          <Text style={styles.heading}>Mes adresses</Text>
          <View style={styles.backBtn} />
        </View>

        <GlassCard style={styles.form}>
          <TextField label="Numéro et rue" value={street} onChangeText={setStreet} placeholder="12 rue de la République" />
          <TextField label="Code postal" value={zipCode} onChangeText={setZipCode} placeholder="69001" keyboardType="numeric" maxLength={5} />
          <TextField label="Ville" value={city} onChangeText={setCity} placeholder="Lyon" />
          <PrimaryButton label="Enregistrer" onPress={handleSave} loading={saving} />
        </GlassCard>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg.surface },
    content: { paddingHorizontal: Spacing.xl },
    topbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 22,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor: colors.bg.card,
      borderWidth: 1,
      borderColor: colors.border.glass,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heading: {
      fontFamily: FontFamily.serif,
      fontSize: 18,
      color: colors.text.primary,
    },
    form: {
      padding: 18,
      borderRadius: Radius.lg,
      gap: 4,
    },
  });
}
