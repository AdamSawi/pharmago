import { router, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AmbientBackground } from '@/components/ambient-background';
import { IconChevronLeft } from '@/components/icons';
import { GlassCard } from '@/components/ui/glass-card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { FontFamily, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { db } from '@/config/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { addProduct, updateProduct, type ProductDoc } from '@/services/products';

export default function ProductFormScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const isEditing = !!productId;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [requiresOrdonnance, setRequiresOrdonnance] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!productId) return;
    getDoc(doc(db, 'products', productId)).then((snap) => {
      if (snap.exists()) {
        const p = snap.data() as ProductDoc;
        setName(p.name);
        setDescription(p.description ?? '');
        setPrice(String(p.price));
        setStock(String(p.stock));
        setRequiresOrdonnance(p.requiresOrdonnance);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [productId]);

  async function handleSubmit() {
    if (!user || saving) return;
    const priceNum = parseFloat(price.replace(',', '.'));
    const stockNum = parseInt(stock, 10);

    if (!name.trim()) {
      Alert.alert('Champ requis', 'Le nom du produit est obligatoire.');
      return;
    }
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Prix invalide', 'Merci de renseigner un prix valide.');
      return;
    }
    if (Number.isNaN(stockNum) || stockNum < 0) {
      Alert.alert('Stock invalide', 'Merci de renseigner un stock valide.');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && productId) {
        await updateProduct(productId, {
          name: name.trim(),
          description: description.trim(),
          price: priceNum,
          stock: stockNum,
          requiresOrdonnance,
        });
      } else {
        await addProduct({
          pharmacyId: user.uid,
          name: name.trim(),
          description: description.trim(),
          price: priceNum,
          stock: stockNum,
          requiresOrdonnance,
        });
      }
      router.back();
    } catch {
      Alert.alert('Erreur', "Le produit n'a pas pu être enregistré.");
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
          <Text style={styles.heading}>{isEditing ? 'Modifier le produit' : 'Nouveau produit'}</Text>
          <View style={styles.backBtn} />
        </View>

        {!loading && (
          <GlassCard style={styles.form}>
            <TextField label="Nom" value={name} onChangeText={setName} placeholder="Doliprane 1000mg" />
            <TextField label="Description" value={description} onChangeText={setDescription} placeholder="Optionnel" />
            <TextField label="Prix (€)" value={price} onChangeText={setPrice} placeholder="4.40" keyboardType="decimal-pad" />
            <TextField label="Stock disponible" value={stock} onChangeText={setStock} placeholder="20" keyboardType="numeric" />

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Ordonnance requise</Text>
              <Switch
                value={requiresOrdonnance}
                onValueChange={setRequiresOrdonnance}
                trackColor={{ false: colors.border.glass, true: colors.amberBright }}
                thumbColor="#fff"
              />
            </View>

            <PrimaryButton
              label={isEditing ? 'Mettre à jour' : 'Ajouter au catalogue'}
              onPress={handleSubmit}
              loading={saving}
            />
          </GlassCard>
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
    form: {
      padding: 18,
      borderRadius: Radius.lg,
      gap: 4,
    },
    toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      marginBottom: 14,
    },
    toggleLabel: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 14,
      color: colors.text.primary,
    },
  });
}
