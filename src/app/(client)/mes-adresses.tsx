import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AmbientBackground } from '@/components/ambient-background';
import { SwipeableAddressCard } from '@/components/client/swipeable-address-card';
import { IconChevronLeft, IconPlus } from '@/components/icons';
import { GlassCard } from '@/components/ui/glass-card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { FontFamily, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import {
  addClientAddress,
  deleteClientAddress,
  listenUserAddresses,
  setDefaultAddress,
  updateClientAddress,
} from '@/services/addresses';
import type { ClientAddress } from '@/services/auth';

export default function ClientMesAdressesScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [addresses, setAddresses] = useState<ClientAddress[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [recipientFirstName, setRecipientFirstName] = useState('');
  const [recipientLastName, setRecipientLastName] = useState('');
  const [street, setStreet] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [city, setCity] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = listenUserAddresses(user.uid, setAddresses);
    return unsub;
  }, [user]);

  if (!user) return null;
  const uid = user.uid;

  function resetForm() {
    setEditingId(null);
    setLabel('');
    setRecipientFirstName('');
    setRecipientLastName('');
    setStreet('');
    setZipCode('');
    setCity('');
  }

  function handleStartEdit(address: ClientAddress) {
    setEditingId(address.id);
    setLabel(address.label);
    setRecipientFirstName(address.recipientFirstName ?? '');
    setRecipientLastName(address.recipientLastName ?? '');
    setStreet(address.street);
    setZipCode(address.zipCode);
    setCity(address.city);
    setShowForm(true);
  }

  async function handleSave() {
    if (saving) return;
    if (!label.trim() || !street.trim() || !zipCode.trim() || !city.trim()) {
      Alert.alert('Champs incomplets', "Merci de renseigner le nom de l'adresse et les 3 champs d'adresse.");
      return;
    }
    setSaving(true);
    try {
      const data = {
        label: label.trim(),
        street: street.trim(),
        zipCode: zipCode.trim(),
        city: city.trim(),
        recipientFirstName: recipientFirstName.trim() || undefined,
        recipientLastName: recipientLastName.trim() || undefined,
      };
      if (editingId) {
        await updateClientAddress(uid, addresses, editingId, data);
      } else {
        await addClientAddress(uid, addresses, data);
      }
      resetForm();
      setShowForm(false);
    } catch {
      Alert.alert('Erreur', "L'adresse n'a pas pu être enregistrée.");
    } finally {
      setSaving(false);
    }
  }

  function handleSetDefault(id: string) {
    setDefaultAddress(uid, addresses, id).catch(() => {
      Alert.alert('Erreur', 'Impossible de définir cette adresse par défaut.');
    });
  }

  function handleDelete(id: string) {
    deleteClientAddress(uid, addresses, id).catch(() => {
      Alert.alert('Erreur', "L'adresse n'a pas pu être supprimée.");
    });
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

        <View style={styles.list}>
          {addresses.map((address) => (
            <SwipeableAddressCard
              key={address.id}
              address={address}
              onSetDefault={() => handleSetDefault(address.id)}
              onDelete={() => handleDelete(address.id)}
              onEdit={() => handleStartEdit(address)}
            />
          ))}
          {addresses.length === 0 && !showForm && (
            <Text style={styles.emptyText}>
              Aucune adresse enregistrée. Ajoutez-en une pour pouvoir commander.
            </Text>
          )}
        </View>

        {showForm ? (
          <GlassCard style={styles.form}>
            <TextField
              label="Nom de l'adresse"
              value={label}
              onChangeText={setLabel}
              placeholder="Chez mamie, Bureau Lyon…"
            />
            <View style={styles.formRow}>
              <View style={{ flex: 1 }}>
                <TextField label="Prénom du destinataire" value={recipientFirstName} onChangeText={setRecipientFirstName} placeholder="Jean" />
              </View>
              <View style={{ flex: 1 }}>
                <TextField label="Nom du destinataire" value={recipientLastName} onChangeText={setRecipientLastName} placeholder="Dupont" />
              </View>
            </View>
            <TextField label="Numéro et rue" value={street} onChangeText={setStreet} placeholder="12 rue de la République" />
            <TextField label="Code postal" value={zipCode} onChangeText={setZipCode} placeholder="69001" keyboardType="numeric" maxLength={5} />
            <TextField label="Ville" value={city} onChangeText={setCity} placeholder="Lyon" />
            <View style={styles.formActions}>
              <Pressable
                onPress={() => { setShowForm(false); resetForm(); }}
                style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </Pressable>
              <View style={{ flex: 1 }}>
                <PrimaryButton label={editingId ? 'Mettre à jour' : 'Ajouter'} onPress={handleSave} loading={saving} />
              </View>
            </View>
          </GlassCard>
        ) : (
          <Pressable
            onPress={() => setShowForm(true)}
            style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
          >
            <IconPlus size={15} color={colors.amberBright} strokeWidth={2.2} />
            <Text style={styles.addBtnText}>Ajouter une adresse</Text>
          </Pressable>
        )}
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
    list: {
      gap: 10,
      marginBottom: 16,
    },
    emptyText: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 13.5,
      color: colors.text.tertiary,
      textAlign: 'center',
      paddingVertical: 24,
    },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 16,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: 'rgba(235,162,78,0.30)',
    },
    addBtnText: {
      fontFamily: FontFamily.sansBold,
      fontSize: 14,
      color: colors.amberBright,
    },
    form: {
      padding: 18,
      borderRadius: Radius.lg,
      gap: 4,
    },
    formRow: {
      flexDirection: 'row',
      gap: 10,
    },
    formActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 8,
    },
    cancelBtn: {
      paddingVertical: 16,
      paddingHorizontal: 14,
    },
    cancelBtnText: {
      fontFamily: FontFamily.sansBold,
      fontSize: 14,
      color: colors.text.secondary,
    },
  });
}
