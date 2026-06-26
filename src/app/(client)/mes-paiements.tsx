import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AmbientBackground } from '@/components/ambient-background';
import { SwipeablePaymentCard } from '@/components/client/swipeable-payment-card';
import { IconChevronLeft, IconPlus } from '@/components/icons';
import { GlassCard } from '@/components/ui/glass-card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { FontFamily, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import {
  addPaymentMethod,
  deletePaymentMethod,
  listenPaymentMethods,
  setDefaultPaymentMethod,
  type PaymentMethod,
} from '@/services/payment-methods';
import { formatCardNumber, formatExpiry } from '@/utils/card-format';

export default function MesPaiementsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = listenPaymentMethods(user.uid, setMethods);
    return unsub;
  }, [user]);

  if (!user) return null;
  const uid = user.uid;

  function resetForm() {
    setCardNumber('');
    setExpiry('');
    setCvv('');
    setCardHolder('');
  }

  async function handleAdd() {
    if (saving) return;
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 13 || expiry.length !== 5 || cvv.length < 3 || !cardHolder.trim()) {
      Alert.alert('Champs incomplets', 'Merci de renseigner tous les champs de la carte.');
      return;
    }
    setSaving(true);
    try {
      await addPaymentMethod(uid, methods, { cardNumber, expiry, cardHolder: cardHolder.trim() });
      resetForm();
      setShowForm(false);
    } catch {
      Alert.alert('Erreur', "La carte n'a pas pu être ajoutée.");
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(method: PaymentMethod) {
    deletePaymentMethod(uid, methods, method.id).catch(() => {
      Alert.alert('Erreur', "La carte n'a pas pu être supprimée.");
    });
  }

  function handleSetDefault(id: string) {
    setDefaultPaymentMethod(uid, methods, id).catch(() => {
      Alert.alert('Erreur', 'Impossible de définir cette carte par défaut.');
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
          <Text style={styles.heading}>Mes moyens de paiement</Text>
          <View style={styles.backBtn} />
        </View>

        <View style={styles.list}>
          {methods.map((method) => (
            <SwipeablePaymentCard
              key={method.id}
              method={method}
              onSetDefault={() => handleSetDefault(method.id)}
              onDelete={() => handleDelete(method)}
            />
          ))}
          {methods.length === 0 && !showForm && (
            <Text style={styles.emptyText}>Aucune carte enregistrée.</Text>
          )}
        </View>

        {showForm ? (
          <GlassCard style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Numéro de carte</Text>
              <TextInput
                style={styles.fieldInput}
                value={cardNumber}
                onChangeText={(t) => setCardNumber(formatCardNumber(t))}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="numeric"
                maxLength={19}
              />
            </View>
            <View style={styles.fieldRow}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Expiration</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={expiry}
                  onChangeText={(t) => setExpiry(formatExpiry(t))}
                  placeholder="MM/AA"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>CVV</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={cvv}
                  onChangeText={setCvv}
                  placeholder="•••"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="numeric"
                  maxLength={3}
                  secureTextEntry
                />
              </View>
            </View>
            <TextField label="Nom sur la carte" value={cardHolder} onChangeText={setCardHolder} placeholder="JEAN DUPONT" autoCapitalize="characters" />
            <View style={styles.formActions}>
              <Pressable
                onPress={() => { setShowForm(false); resetForm(); }}
                style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </Pressable>
              <View style={{ flex: 1 }}>
                <PrimaryButton label="Ajouter" onPress={handleAdd} loading={saving} />
              </View>
            </View>
          </GlassCard>
        ) : (
          <Pressable
            onPress={() => setShowForm(true)}
            style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
          >
            <IconPlus size={15} color={colors.amberBright} strokeWidth={2.2} />
            <Text style={styles.addBtnText}>Ajouter une carte</Text>
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
    list: { gap: 10, marginBottom: 16 },
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
      gap: 14,
    },
    fieldRow: {
      flexDirection: 'row',
      gap: 12,
    },
    field: { gap: 8 },
    fieldLabel: {
      fontFamily: FontFamily.sansExtraBold,
      fontSize: 10.5,
      color: colors.text.tertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    fieldInput: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 15,
      color: colors.text.primary,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.glass,
      paddingBottom: 8,
    },
    formActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
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
