import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconChevronRight } from '@/components/icons';
import { SwipeableOrderCard } from '@/components/pharmacy/swipeable-order-card';
import { GlassCard } from '@/components/ui/glass-card';
import { SkeletonList, SkeletonStat } from '@/components/ui/skeleton-loader';
import { FontFamily, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import type { Order, OrderStatus } from '@/data/mock-orders';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import {
  acceptOrder,
  listenPharmacyOrders,
  rejectOrder,
  type FirestoreOrder,
} from '@/services/orders';

type Filter = 'all' | 'pending' | 'prescription' | 'in_delivery';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'pending', label: 'En attente' },
  { id: 'prescription', label: 'Ordonnance' },
  { id: 'in_delivery', label: 'En livraison' },
];

function firestoreToLocal(o: FirestoreOrder): Order {
  const minutesAgo = o.createdAt
    ? Math.round((Date.now() - o.createdAt.toMillis()) / 60000)
    : 0;
  const timeLabel =
    minutesAgo < 60
      ? `Il y a ${minutesAgo} min`
      : `Il y a ${Math.round(minutesAgo / 60)}h`;
  const itemCount = o.items.length;

  let status: OrderStatus;
  if (o.status === 'pending') status = 'pending';
  else if (o.status === 'accepted' || o.status === 'in_delivery') status = 'transit';
  else if (o.status === 'delivered') status = 'delivered';
  else status = 'rejected';

  return {
    id: o.id,
    ref: `#CMD-${o.id.slice(-4).toUpperCase()}`,
    clientName: o.clientName,
    meta: `${timeLabel} · ${itemCount} article${itemCount > 1 ? 's' : ''}`,
    status,
    total: o.totalPrice,
    items: o.items.map((i) => ({ name: i.name, qty: `×${i.quantity}` })),
    hasPrescription: o.hasOrdonnance,
    prescriptionLabel: o.hasOrdonnance ? 'Ordonnance jointe' : undefined,
  };
}

// ── Island notification banner ──────────────────────────────────────────────

function NewOrderIsland({
  count,
  onDismiss,
  colors,
}: {
  count: number;
  onDismiss: () => void;
  colors: ThemeColors;
}) {
  const translateY = useSharedValue(-80);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 16, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 250 });
    const timer = setTimeout(() => {
      translateY.value = withTiming(-80, { duration: 350 });
      opacity.value = withTiming(0, { duration: 350 });
      setTimeout(onDismiss, 360);
    }, 3500);
    return () => clearTimeout(timer);
  }, [onDismiss, opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const islandStyles = useMemo(() => createIslandStyles(colors), [colors]);

  return (
    <Animated.View style={[islandStyles.wrap, animStyle]}>
      <View style={islandStyles.dot} />
      <Text style={islandStyles.text}>
        {count} nouvelle{count > 1 ? 's' : ''} commande{count > 1 ? 's' : ''}
      </Text>
    </Animated.View>
  );
}

function createIslandStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      position: 'absolute',
      top: 0,
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.amberBright,
      borderRadius: 20,
      paddingVertical: 9,
      paddingHorizontal: 18,
      zIndex: 100,
      shadowColor: colors.amberBright,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 10,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: '#221204',
    },
    text: {
      fontFamily: FontFamily.sansBold,
      fontSize: 13,
      color: '#221204',
    },
  });
}

export function OrdersTab({ onPendingChange }: { onPendingChange?: (count: number) => void }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [firestoreOrders, setFirestoreOrders] = useState<FirestoreOrder[]>([]);
  const [localOverrides, setLocalOverrides] = useState<Record<string, OrderStatus>>({});
  const [filter, setFilter] = useState<Filter>('all');
  const [showIsland, setShowIsland] = useState(false);
  const [islandCount, setIslandCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Track previous order IDs to detect new arrivals
  const prevOrderIds = useRef<Set<string>>(new Set());
  const isFirst = useRef(true);

  useEffect(() => {
    if (!user) return;
    const unsub = listenPharmacyOrders(user.uid, (incoming) => {
      setLoading(false);
      if (isFirst.current) {
        // First load: store existing IDs without notification
        prevOrderIds.current = new Set(incoming.map((o) => o.id));
        isFirst.current = false;
      } else {
        const newOnes = incoming.filter((o) => !prevOrderIds.current.has(o.id));
        if (newOnes.length > 0) {
          setIslandCount(newOnes.length);
          setShowIsland(true);
          newOnes.forEach((o) => prevOrderIds.current.add(o.id));
        }
      }
      setFirestoreOrders(incoming);
    });
    return unsub;
  }, [user]);

  const orders = useMemo<Order[]>(() => {
    return firestoreOrders.map((o) => {
      const local = firestoreToLocal(o);
      if (localOverrides[o.id]) local.status = localOverrides[o.id];
      return local;
    });
  }, [firestoreOrders, localOverrides]);

  const stats = useMemo(() => {
    const pending = firestoreOrders.filter((o) => o.status === 'pending').length;
    const validated = firestoreOrders.filter(
      (o) => o.status === 'accepted' || o.status === 'in_delivery',
    ).length;
    const revenue = firestoreOrders.reduce((acc, o) => acc + (o.totalPrice ?? 0), 0);
    return { pending, validated, revenue: Math.round(revenue) };
  }, [firestoreOrders]);

  useEffect(() => {
    onPendingChange?.(stats.pending);
  }, [stats.pending, onPendingChange]);

  const inDeliveryIds = useMemo(
    () => new Set(firestoreOrders.filter((o) => o.status === 'in_delivery').map((o) => o.id)),
    [firestoreOrders],
  );

  const filtered = orders.filter((o) => {
    if (filter === 'pending') return o.status === 'pending';
    if (filter === 'prescription') return o.hasPrescription;
    if (filter === 'in_delivery') return inDeliveryIds.has(o.id);
    return true;
  });

  const handleAccept = useCallback(
    async (id: string) => {
      setLocalOverrides((prev) => ({ ...prev, [id]: 'transit' }));
      try {
        const order = firestoreOrders.find((o) => o.id === id);
        await acceptOrder(id);
      } catch {
        setLocalOverrides((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    },
    [firestoreOrders],
  );

  const handleReject = useCallback(
    async (id: string) => {
      setLocalOverrides((prev) => ({ ...prev, [id]: 'rejected' }));
      try {
        await rejectOrder(id);
      } catch {
        setLocalOverrides((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    },
    [],
  );

  const handlePress = useCallback((id: string) => {
    router.push({ pathname: '/(pharmacy)/order-detail', params: { id } });
  }, []);

  const visibleOrders = filtered.filter((o) => o.status !== 'rejected');
  const hasPending = visibleOrders.some((o) => o.status === 'pending');

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {showIsland && (
        <NewOrderIsland
          count={islandCount}
          onDismiss={() => setShowIsland(false)}
          colors={colors}
        />
      )}

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topbar}>
          <View>
            <Text style={styles.heading}>Commandes</Text>
            <Text style={styles.greet}>
              {today.charAt(0).toUpperCase() + today.slice(1)} · {stats.pending} nouvelles
            </Text>
          </View>
        </View>

        {loading ? (
          <SkeletonStat />
        ) : (
          <View style={styles.statsRow}>
            <GlassCard style={styles.stat}>
              <Text style={[styles.statN, { color: colors.amberBright }]}>{stats.pending}</Text>
              <Text style={styles.statL}>En attente</Text>
            </GlassCard>
            <GlassCard style={styles.stat}>
              <Text style={[styles.statN, { color: '#8fe0b8' }]}>{stats.validated}</Text>
              <Text style={styles.statL}>Validées</Text>
            </GlassCard>
            <GlassCard style={styles.stat}>
              <Text style={styles.statN}>{stats.revenue}€</Text>
              <Text style={styles.statL}>Aujourd'hui</Text>
            </GlassCard>
          </View>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => (
            <Pressable
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={[styles.chip, filter === f.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, filter === f.id && styles.chipTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {hasPending && (
          <View style={styles.hintRow}>
            <IconChevronRight size={13} color={colors.text.tertiary} strokeWidth={2} />
            <Text style={styles.hintText}>Glissez une commande pour valider ou refuser</Text>
          </View>
        )}

        {loading ? <SkeletonList /> : (
        <View style={styles.list}>
          {visibleOrders.map((order) => (
            <SwipeableOrderCard
              key={order.id}
              order={order}
              onPress={handlePress}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          ))}
          {visibleOrders.length === 0 && (
            <Text style={styles.emptyText}>Aucune commande</Text>
          )}
        </View>
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      paddingHorizontal: Spacing.xl,
    },
    topbar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    heading: {
      fontFamily: FontFamily.serif,
      fontSize: 27,
      letterSpacing: -0.01 * 27,
      color: colors.text.primary,
    },
    greet: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 12.5,
      color: colors.text.tertiary,
      marginTop: 5,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 9,
      marginTop: 20,
      marginBottom: 20,
    },
    stat: {
      flex: 1,
      padding: 15,
      borderRadius: Radius.md,
    },
    statN: {
      fontFamily: FontFamily.serif,
      fontSize: 23,
      color: colors.text.primary,
    },
    statL: {
      fontFamily: FontFamily.sansExtraBold,
      fontSize: 10.5,
      color: colors.text.tertiary,
      marginTop: 2,
      textTransform: 'uppercase',
      letterSpacing: 0.04 * 10.5,
    },
    filterRow: {
      gap: 8,
      paddingBottom: 2,
      marginBottom: 16,
    },
    chip: {
      paddingVertical: 9,
      paddingHorizontal: 16,
      borderRadius: Radius.pill,
      borderWidth: 1,
      borderColor: colors.border.glass,
    },
    chipActive: {
      backgroundColor: colors.amberBright,
      borderColor: colors.amberBright,
    },
    chipText: {
      fontFamily: FontFamily.sansBold,
      fontSize: 12.5,
      color: colors.text.secondary,
    },
    chipTextActive: {
      color: '#221204',
    },
    hintRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      marginBottom: 6,
      opacity: 0.7,
    },
    hintText: {
      fontFamily: FontFamily.sansBold,
      fontSize: 11,
      color: colors.text.tertiary,
    },
    list: {
      gap: 9,
    },
    emptyText: {
      fontFamily: FontFamily.sans,
      fontSize: 14,
      color: colors.text.tertiary,
      textAlign: 'center',
      paddingTop: 40,
    },
  });
}
