import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconClock, IconMapPin } from '@/components/icons';
import { GlassCard } from '@/components/ui/glass-card';
import { SkeletonList } from '@/components/ui/skeleton-loader';
import { FontFamily, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { listenAvailableDeliveries, listenDeliveryEarningsToday, type FirestoreOrder } from '@/services/orders';

function DeliveryCard({ order, onPress }: { order: FirestoreOrder; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const itemCount = order.items.length;
  const fee = (order.deliveryFee ?? 0).toFixed(2);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.82 }}>
      <GlassCard style={styles.delivCard}>
        <View style={styles.routeWrap}>
          <View style={styles.routeStop}>
            <View style={[styles.stopDot, { backgroundColor: colors.sage }]} />
            <View style={styles.routeStopInfo}>
              <Text style={styles.stopRole}>DÉPART · PHARMACIE</Text>
              <Text style={styles.stopName}>Commande #{order.id.slice(-4).toUpperCase()}</Text>
              <Text style={styles.stopAddr}>{itemCount} article{itemCount > 1 ? 's' : ''} · {order.clientName}</Text>
            </View>
          </View>
          <View style={styles.routeConnector}>
            <View style={styles.connectorLine} />
          </View>
          <View style={styles.routeStop}>
            <View style={[styles.stopDot, { backgroundColor: colors.amber }]} />
            <View style={styles.routeStopInfo}>
              <Text style={styles.stopRole}>ARRIVÉE · CLIENT</Text>
              <Text style={styles.stopName}>{order.clientName}</Text>
              <Text style={styles.stopAddr}>Adresse de livraison</Text>
            </View>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <IconClock size={12} color={colors.text.tertiary} strokeWidth={1.8} />
            <Text style={styles.metaText}>~15 min</Text>
          </View>
          <View style={styles.metaItem}>
            <IconMapPin size={12} color={colors.text.tertiary} strokeWidth={1.8} />
            <Text style={styles.metaText}>~2 km</Text>
          </View>
          <View style={styles.feeChip}>
            <Text style={styles.feeText}>{fee} €</Text>
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

export function LivraisonsTab() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [availableOrders, setAvailableOrders] = useState<FirestoreOrder[]>([]);
  const [online, setOnline] = useState(true);
  const [today, setToday] = useState({ earnings: 0, count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = listenAvailableDeliveries((data) => {
      setAvailableOrders(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = listenDeliveryEarningsToday(user.uid, setToday);
    return unsub;
  }, [user]);

  const stats = useMemo(() => ({
    earnings: today.earnings.toFixed(2),
    deliveries: today.count,
    rating: (user?.rating ?? 5.0).toFixed(1),
  }), [today, user]);

  function handleOpenDetail(order: FirestoreOrder) {
    router.push({ pathname: '/(delivery)/delivery-detail' as never, params: { orderId: order.id } });
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.topbar}>
          <View>
            <Text style={styles.subGreet}>Tableau de bord</Text>
            <Text style={styles.heading}>Livraisons</Text>
          </View>
          {/* Online toggle */}
          <Pressable
            onPress={() => setOnline((v) => !v)}
            style={[styles.toggle, online ? styles.toggleOn : styles.toggleOff]}
          >
            <View style={[styles.toggleDot, online ? styles.toggleDotOn : styles.toggleDotOff]} />
            <Text style={[styles.toggleLabel, { color: online ? colors.sageBright : colors.text.tertiary }]}>
              {online ? 'En ligne' : 'Hors ligne'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <Pressable onPress={() => router.push('/(delivery)/earnings' as never)} style={styles.statCardPressable}>
            <GlassCard style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.amberBright }]}>{stats.earnings} €</Text>
              <Text style={styles.statLabel}>Gains</Text>
            </GlassCard>
          </Pressable>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statValue}>{stats.deliveries}</Text>
            <Text style={styles.statLabel}>Livraisons</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.sageBright }]}>{stats.rating}</Text>
            <Text style={styles.statLabel}>Note</Text>
          </GlassCard>
        </View>

        {/* Available deliveries */}
        <Text style={styles.sectionLabel}>
          {online ? 'Disponibles près de vous' : 'Hors ligne — activez pour voir les livraisons'}
        </Text>

        {online ? loading ? (
          <SkeletonList />
        ) : (
          <View style={styles.list}>
            {availableOrders.map((order) => (
              <DeliveryCard
                key={order.id}
                order={order}
                onPress={() => handleOpenDetail(order)}
              />
            ))}
            {availableOrders.length === 0 && (
              <GlassCard style={styles.offlineCard}>
                <Text style={styles.offlineText}>Aucune livraison disponible pour le moment.</Text>
              </GlassCard>
            )}
          </View>
        ) : (
          <GlassCard style={styles.offlineCard}>
            <Text style={styles.offlineText}>
              Activez le mode en ligne pour recevoir des livraisons.
            </Text>
          </GlassCard>
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.xl },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingRight: 50,
  },
  subGreet: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 12.5,
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  heading: {
    fontFamily: FontFamily.serif,
    fontSize: 28,
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  toggleOn: {
    backgroundColor: colors.sageSoft,
    borderColor: 'rgba(127,184,158,0.30)',
  },
  toggleOff: {
    backgroundColor: colors.bg.card,
    borderColor: colors.border.glass,
  },
  toggleDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  toggleDotOn: {
    backgroundColor: colors.sageBright,
  },
  toggleDotOff: {
    backgroundColor: colors.text.tertiary,
  },
  toggleLabel: {
    fontFamily: FontFamily.sansBold,
    fontSize: 12.5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 24,
  },
  statCardPressable: {
    flex: 1,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontFamily: FontFamily.serif,
    fontSize: 22,
    color: colors.text.primary,
  },
  statLabel: {
    fontFamily: FontFamily.sansExtraBold,
    fontSize: 10,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionLabel: {
    fontFamily: FontFamily.sansExtraBold,
    fontSize: 11,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  list: {
    gap: 10,
  },
  delivCard: {
    padding: 16,
    borderRadius: Radius.lg,
    gap: 14,
  },
  routeWrap: {
    gap: 0,
  },
  routeStop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stopDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 14,
    flexShrink: 0,
  },
  routeStopInfo: {
    flex: 1,
    paddingVertical: 6,
    gap: 2,
  },
  stopRole: {
    fontFamily: FontFamily.sansExtraBold,
    fontSize: 9.5,
    color: colors.text.tertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  stopName: {
    fontFamily: FontFamily.sansBold,
    fontSize: 13.5,
    color: colors.text.primary,
  },
  stopAddr: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 11.5,
    color: colors.text.tertiary,
  },
  routeConnector: {
    paddingLeft: 4,
    height: 14,
    justifyContent: 'center',
  },
  connectorLine: {
    width: 1.5,
    height: 14,
    backgroundColor: colors.border.glassStrong,
    marginLeft: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border.glass,
    paddingTop: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 12.5,
    color: colors.text.secondary,
  },
  feeChip: {
    marginLeft: 'auto' as const,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
    backgroundColor: colors.amberSoft,
    borderWidth: 1,
    borderColor: 'rgba(235,162,78,0.25)',
  },
  feeText: {
    fontFamily: FontFamily.serif,
    fontSize: 15,
    color: colors.amberBright,
  },
  offlineCard: {
    padding: 20,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  offlineText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13.5,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  });
}
