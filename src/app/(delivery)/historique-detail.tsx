import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AmbientBackground } from '@/components/ambient-background';
import { IconChevronLeft, IconMapPin } from '@/components/icons';
import { GlassCard } from '@/components/ui/glass-card';
import { FontFamily, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { listenClientOrder, type FirestoreOrder } from '@/services/orders';

export default function HistoriqueDetailScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [order, setOrder] = useState<FirestoreOrder | null>(null);

  useEffect(() => {
    if (!orderId) return;
    const unsub = listenClientOrder(orderId, setOrder);
    return unsub;
  }, [orderId]);

  if (!order) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        <AmbientBackground />
        <View style={styles.centerState}>
          <Text style={styles.stateText}>Chargement…</Text>
        </View>
      </View>
    );
  }

  const dateLabel = order.updatedAt
    ? new Date(order.updatedAt.toMillis()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <AmbientBackground />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topbar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <IconChevronLeft size={18} color={colors.text.secondary} strokeWidth={2.2} />
          </Pressable>
          <Text style={styles.heading}>Détail livraison</Text>
          <View style={styles.backBtn} />
        </View>

        <GlassCard strong style={styles.hero}>
          <Text style={styles.heroRef}>Commande #{order.id.slice(-4).toUpperCase()}</Text>
          <Text style={styles.heroFee}>+{(order.deliveryFee ?? 0).toFixed(2)} €</Text>
          <Text style={styles.heroDate}>{dateLabel}</Text>
        </GlassCard>

        <Text style={styles.sectionLabel}>Produits</Text>
        <GlassCard style={styles.card}>
          {order.items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQty}>×{item.quantity}</Text>
            </View>
          ))}
        </GlassCard>

        <Text style={styles.sectionLabel}>Pharmacie</Text>
        <GlassCard style={styles.card}>
          <Text style={styles.stopName}>{order.pharmacyName}</Text>
          <View style={styles.stopMeta}>
            <IconMapPin size={12} color={colors.text.tertiary} strokeWidth={1.8} />
            <Text style={styles.stopAddr}>{order.pharmacyAddress ?? 'Adresse non renseignée'}</Text>
          </View>
        </GlassCard>

        <Text style={styles.sectionLabel}>Client</Text>
        <GlassCard style={styles.card}>
          <Text style={styles.stopName}>{order.clientName}</Text>
          <View style={styles.stopMeta}>
            <IconMapPin size={12} color={colors.text.tertiary} strokeWidth={1.8} />
            <Text style={styles.stopAddr}>
              {order.deliveryAddress
                ? `${order.deliveryAddress.street}, ${order.deliveryAddress.zipCode} ${order.deliveryAddress.city}`
                : 'Adresse non renseignée'}
            </Text>
          </View>
        </GlassCard>

        <Text style={styles.sectionLabel}>Récapitulatif</Text>
        <GlassCard style={styles.card}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Votre gain</Text>
            <Text style={styles.summaryValue}>{(order.deliveryFee ?? 0).toFixed(2)} €</Text>
          </View>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.surface },
  content: { paddingHorizontal: Spacing.xl },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stateText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 15,
    color: colors.text.tertiary,
  },
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
  hero: {
    padding: 20,
    borderRadius: Radius.xl,
    gap: 6,
    marginBottom: 22,
  },
  heroRef: {
    fontFamily: FontFamily.sansBold,
    fontSize: 14,
    color: colors.text.secondary,
  },
  heroFee: {
    fontFamily: FontFamily.serif,
    fontSize: 26,
    color: colors.amberBright,
  },
  heroDate: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 12.5,
    color: colors.text.tertiary,
  },
  sectionLabel: {
    fontFamily: FontFamily.sansExtraBold,
    fontSize: 10.5,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  card: {
    padding: 16,
    borderRadius: Radius.lg,
    gap: 8,
    marginBottom: 22,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemName: {
    flex: 1,
    fontFamily: FontFamily.sansMedium,
    fontSize: 13.5,
    color: colors.text.primary,
  },
  itemQty: {
    fontFamily: FontFamily.sansBold,
    fontSize: 13.5,
    color: colors.text.tertiary,
  },
  stopName: {
    fontFamily: FontFamily.sansBold,
    fontSize: 15,
    color: colors.text.primary,
  },
  stopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stopAddr: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 12,
    color: colors.text.tertiary,
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontFamily: FontFamily.sansBold,
    fontSize: 13,
    color: colors.text.primary,
  },
  });
}
