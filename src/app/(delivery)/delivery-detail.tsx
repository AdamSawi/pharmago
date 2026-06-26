import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AmbientBackground } from '@/components/ambient-background';
import { IconChevronLeft, IconClock, IconMapPin } from '@/components/icons';
import { GlassCard } from '@/components/ui/glass-card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { FontFamily, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { claimDelivery, listenClientOrder, type FirestoreOrder } from '@/services/orders';

export default function DeliveryDetailScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { orderId } = useLocalSearchParams<{ orderId: string }>();

  const [order, setOrder] = useState<FirestoreOrder | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    const unsub = listenClientOrder(orderId, setOrder);
    return unsub;
  }, [orderId]);

  async function handleAccept() {
    if (!user || !orderId || accepting) return;
    setAccepting(true);
    try {
      await claimDelivery(orderId, user.uid);
      router.replace({ pathname: '/(delivery)/route' as never, params: { orderId } });
    } catch {
      setAccepting(false);
    }
  }

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

  const fee = (order.deliveryFee ?? 0).toFixed(2);
  const itemCount = order.items.length;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <AmbientBackground />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 140 }]}
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
          <Text style={styles.heroFee}>Vous gagnez {fee} €</Text>
        </GlassCard>

        <GlassCard style={styles.stopCard}>
          <View style={styles.stopHeader}>
            <View style={[styles.stopBadge, { backgroundColor: colors.sageSoft, borderColor: 'rgba(127,184,158,0.30)' }]}>
              <Text style={[styles.stopBadgeText, { color: colors.sageBright }]}>1</Text>
            </View>
            <Text style={[styles.stopRole, { color: colors.sageBright }]}>Récupération</Text>
          </View>
          <Text style={styles.stopName}>{order.pharmacyName}</Text>
          <View style={styles.stopMeta}>
            <IconMapPin size={12} color={colors.text.tertiary} strokeWidth={1.8} />
            <Text style={styles.stopAddr}>{order.pharmacyAddress ?? 'Adresse non renseignée'}</Text>
          </View>
        </GlassCard>

        <GlassCard style={styles.stopCard}>
          <View style={styles.stopHeader}>
            <View style={[styles.stopBadge, { backgroundColor: colors.amberSoft, borderColor: 'rgba(235,162,78,0.28)' }]}>
              <Text style={[styles.stopBadgeText, { color: colors.amberBright }]}>2</Text>
            </View>
            <Text style={[styles.stopRole, { color: colors.amberBright }]}>Livraison</Text>
          </View>
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

        <GlassCard style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Articles</Text>
            <Text style={styles.summaryValue}>{itemCount} article{itemCount > 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryEtaRow}>
              <IconClock size={12} color={colors.text.tertiary} strokeWidth={1.8} />
              <Text style={styles.summaryLabel}>Distance estimée</Text>
            </View>
            <Text style={styles.summaryValue}>~2 km · ~15 min</Text>
          </View>
        </GlassCard>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.rejectBtn}>
          <SecondaryButton label="Refuser" onPress={() => router.back()} />
        </View>
        <View style={styles.acceptBtn}>
          <PrimaryButton
            label="Accepter cette livraison"
            onPress={handleAccept}
            loading={accepting}
          />
        </View>
      </View>
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
    marginBottom: 14,
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
  stopCard: {
    padding: 16,
    borderRadius: Radius.lg,
    marginBottom: 10,
    gap: 8,
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  stopBadge: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopBadgeText: {
    fontFamily: FontFamily.sansBold,
    fontSize: 12,
  },
  stopRole: {
    fontFamily: FontFamily.sansExtraBold,
    fontSize: 10.5,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
  summaryCard: {
    padding: 16,
    borderRadius: Radius.lg,
    gap: 12,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryEtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: Spacing.xl,
    paddingTop: 12,
    backgroundColor: colors.bg.surface,
  },
  rejectBtn: { flex: 1 },
  acceptBtn: { flex: 1 },
  });
}
