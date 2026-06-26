import { router } from 'expo-router';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconChevronRight } from '@/components/icons';
import { FilterButton, FilterSheet } from '@/components/ui/filter-sheet';
import { GlassCard } from '@/components/ui/glass-card';
import { SkeletonList } from '@/components/ui/skeleton-loader';
import { ORDER_STATUS_CONFIG } from '@/constants/order-status';
import { FontFamily, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { listenClientOrders, type FirestoreOrder, type OrderStatus } from '@/services/orders';

// ── Progress bar ──────────────────────────────────────────────────────────────

const STEPS: { key: OrderStatus | 'pending'; label: string }[] = [
  { key: 'pending', label: 'Reçue' },
  { key: 'accepted', label: 'Acceptée' },
  { key: 'in_delivery', label: 'En livraison' },
  { key: 'delivered', label: 'Livrée' },
];

function statusToStep(status: OrderStatus): number {
  if (status === 'pending') return 0;
  if (status === 'accepted') return 1;
  if (status === 'in_delivery') return 2;
  if (status === 'delivered') return 3;
  return 0;
}

function ProgressBar({ status }: { status: OrderStatus }) {
  const { colors } = useTheme();
  const progress = useMemo(() => createProgressStyles(colors), [colors]);
  const step = statusToStep(status);
  const color = ORDER_STATUS_CONFIG[status].color;

  return (
    <View style={progress.track}>
      {STEPS.map((s, i) => {
        const done = i <= step;
        const active = i === step;
        const lineDone = i < step;
        return (
          <Fragment key={s.key}>
            {/* Column: dot stacked above its label, sized to its own content
                so the first/last dots land flush at the bar's edges. */}
            <View style={progress.stepCol}>
              <View style={progress.dotSlot}>
                <View style={[
                  progress.dot,
                  done && { backgroundColor: color },
                  active && progress.dotActive,
                ]}>
                  {active && status !== 'delivered' && (
                    <View style={[progress.dotInner, { backgroundColor: color }]} />
                  )}
                </View>
              </View>
              <Text style={[progress.label, done && { color }]} numberOfLines={1}>
                {s.label}
              </Text>
            </View>
            {/* Connector — fills the remaining space between two columns,
                vertically centered on the dots above. */}
            {i < STEPS.length - 1 && (
              <View style={[progress.line, lineDone && { backgroundColor: color }]} />
            )}
          </Fragment>
        );
      })}
    </View>
  );
}

function createProgressStyles(colors: ThemeColors) {
  return StyleSheet.create({
    track: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    stepCol: {
      alignItems: 'center',
      gap: 6,
    },
    dotSlot: {
      height: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    line: {
      flex: 1,
      height: 2,
      marginTop: 6,
      marginHorizontal: 4,
      backgroundColor: colors.border.glassStrong,
      borderRadius: 1,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.border.glassStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dotActive: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 2,
      borderColor: colors.border.glass,
      backgroundColor: colors.bg.card,
    },
    dotInner: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    label: {
      fontFamily: FontFamily.sansBold,
      fontSize: 9,
      color: colors.text.tertiary,
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
  });
}

// ── Order card ────────────────────────────────────────────────────────────────

function OrderCard({
  order,
  onPress,
  highlighted,
  colors,
  styles,
}: {
  order: FirestoreOrder;
  onPress: () => void;
  highlighted?: boolean;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
}) {
  const minutesAgo = order.createdAt
    ? Math.round((Date.now() - order.createdAt.toMillis()) / 60000)
    : 0;
  const timeLabel =
    minutesAgo < 60
      ? `Il y a ${minutesAgo} min`
      : minutesAgo < 1440
        ? `Il y a ${Math.round(minutesAgo / 60)}h`
        : `Il y a ${Math.round(minutesAgo / 1440)}j`;

  const statusColor = ORDER_STATUS_CONFIG[order.status].color;
  const statusLabel = ORDER_STATUS_CONFIG[order.status].label;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.82 }}>
      <GlassCard style={[styles.orderCard, highlighted && styles.orderCardHighlighted]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderRef}>
              #{order.id.slice(-6).toUpperCase()}
            </Text>
            <Text style={styles.orderMeta}>
              {order.pharmacyName} · {timeLabel}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.statusBadge, { borderColor: `${statusColor}40`, backgroundColor: `${statusColor}15` }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
            <IconChevronRight size={14} color={colors.text.tertiary} strokeWidth={2} />
          </View>
        </View>

        {/* Progress bar — hidden for rejected/cancelled */}
        {order.status !== 'rejected' && order.status !== 'cancelled' && (
          <View style={styles.progressSection}>
            <ProgressBar status={order.status} />
          </View>
        )}

        {/* Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.footerItems}>
            {order.items.length} article{order.items.length > 1 ? 's' : ''}
          </Text>
          <Text style={styles.footerTotal}>{(order.totalPrice ?? 0).toFixed(2)} €</Text>
        </View>
      </GlassCard>
    </Pressable>
  );
}

// ── Filters ───────────────────────────────────────────────────────────────────

type Filter = 'all' | OrderStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Toutes les commandes' },
  { id: 'pending', label: 'En attente' },
  { id: 'accepted', label: 'Acceptées' },
  { id: 'in_delivery', label: 'En livraison' },
  { id: 'delivered', label: 'Livrées' },
  { id: 'rejected', label: 'Refusées' },
  { id: 'cancelled', label: 'Annulées' },
];

// ── Tab ───────────────────────────────────────────────────────────────────────

export function OrdersTab({ highlightOrderId }: { highlightOrderId?: string }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [orders, setOrders] = useState<FirestoreOrder[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const autoOpened = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = listenClientOrders(user.uid, (data) => {
      setOrders(data);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  // Auto-open the order detail once when arriving fresh from checkout success
  useEffect(() => {
    if (highlightOrderId && autoOpened.current !== highlightOrderId) {
      autoOpened.current = highlightOrderId;
      router.push({
        pathname: '/(client)/order-tracking' as never,
        params: { orderId: highlightOrderId },
      });
    }
  }, [highlightOrderId]);

  const filteredOrders = orders.filter((o) => filter === 'all' || o.status === filter);
  const activeFilterLabel = filter === 'all' ? null : (FILTERS.find((f) => f.id === filter)?.label ?? null);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headingRow}>
          <Text style={styles.heading}>Mes commandes</Text>
          <FilterButton activeLabel={activeFilterLabel} onPress={() => setFilterSheetVisible(true)} />
        </View>

        {loading ? (
          <SkeletonList />
        ) : filteredOrders.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Aucune commande</Text>
            <Text style={styles.emptySub}>
              Vos commandes apparaîtront ici en temps réel.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                highlighted={order.id === highlightOrderId}
                onPress={() =>
                  router.push({
                    pathname: '/(client)/order-tracking' as never,
                    params: { orderId: order.id },
                  })
                }
                colors={colors}
                styles={styles}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <FilterSheet
        visible={filterSheetVisible}
        onClose={() => setFilterSheetVisible(false)}
        title="Filtrer mes commandes"
        options={FILTERS}
        value={filter}
        defaultValue="all"
        onApply={setFilter}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1 },
    content: { paddingHorizontal: Spacing.xl },
    headingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
      paddingRight: 50,
    },
    heading: {
      fontFamily: FontFamily.serif,
      fontSize: 27,
      color: colors.text.primary,
      letterSpacing: -0.27,
    },
    list: { gap: 10 },
    orderCard: {
      padding: 16,
      borderRadius: Radius.lg,
      gap: 14,
    },
    orderCardHighlighted: {
      borderColor: colors.amberBright,
      borderWidth: 1.5,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    orderRef: {
      fontFamily: FontFamily.sansBold,
      fontSize: 15,
      color: colors.text.primary,
      marginBottom: 3,
    },
    orderMeta: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 12,
      color: colors.text.tertiary,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      borderWidth: 1,
      borderRadius: Radius.pill,
      paddingVertical: 4,
      paddingHorizontal: 10,
    },
    statusDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
    },
    statusText: {
      fontFamily: FontFamily.sansBold,
      fontSize: 10.5,
    },
    progressSection: {
      paddingVertical: 4,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.border.glass,
      paddingTop: 10,
    },
    footerItems: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 12.5,
      color: colors.text.tertiary,
    },
    footerTotal: {
      fontFamily: FontFamily.serif,
      fontSize: 17,
      color: colors.amberBright,
    },
    empty: {
      paddingTop: 80,
      alignItems: 'center',
      gap: 12,
    },
    emptyTitle: {
      fontFamily: FontFamily.serif,
      fontSize: 22,
      color: colors.text.primary,
    },
    emptySub: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 13.5,
      color: colors.text.tertiary,
      textAlign: 'center',
      lineHeight: 21,
      maxWidth: 240,
    },
  });
}
