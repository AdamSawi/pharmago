import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconCheck, IconMapPin, IconSearch } from '@/components/icons';
import { GlassCard } from '@/components/ui/glass-card';
import { SkeletonList } from '@/components/ui/skeleton-loader';
import { FontFamily, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { listenDeliveryHistory, type FirestoreOrder } from '@/services/orders';
import { listenDeliveryReviews } from '@/services/reviews';

function HistoryCard({ order, reviewed }: { order: FirestoreOrder; reviewed: boolean }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const dateLabel = order.updatedAt
    ? new Date(order.updatedAt.toMillis()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    : '';
  const address = order.deliveryAddress
    ? `${order.deliveryAddress.street}, ${order.deliveryAddress.zipCode} ${order.deliveryAddress.city}`
    : 'Adresse non renseignée';

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/(delivery)/historique-detail' as never, params: { orderId: order.id } })}
      style={({ pressed }) => pressed && { opacity: 0.85 }}
    >
      <GlassCard style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.ref}>#CMD-{order.id.slice(-4).toUpperCase()}</Text>
          <Text style={styles.date}>{dateLabel}</Text>
        </View>
        <View style={styles.addrRow}>
          <IconMapPin size={12} color={colors.text.tertiary} strokeWidth={1.8} />
          <Text style={styles.addrText} numberOfLines={1}>{address}</Text>
        </View>
        <View style={styles.footerRow}>
          <Text style={styles.fee}>+{(order.deliveryFee ?? 0).toFixed(2)} €</Text>
          <View style={[styles.badge, reviewed ? styles.badgeReviewed : styles.badgePending]}>
            {reviewed && <IconCheck size={11} color="#8fe0b8" strokeWidth={2.5} />}
            <Text style={[styles.badgeText, reviewed && styles.badgeTextReviewed]}>
              {reviewed ? 'Évalué' : 'Non évalué'}
            </Text>
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

export function HistoriqueTab() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [orders, setOrders] = useState<FirestoreOrder[]>([]);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = listenDeliveryHistory(user.uid, (data) => {
      setOrders(data);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = listenDeliveryReviews(user.uid, (reviews) => {
      setReviewedIds(new Set(reviews.map((r) => r.orderId)));
    });
    return unsub;
  }, [user]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => o.id.slice(-4).toLowerCase().includes(q) || o.id.toLowerCase().includes(q));
  }, [orders, search]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Historique</Text>

        <View style={styles.searchBar}>
          <IconSearch size={16} color={colors.text.tertiary} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher par numéro de commande"
            placeholderTextColor={colors.text.tertiary}
          />
        </View>

        {loading ? <SkeletonList /> : (
        <View style={styles.list}>
          {filtered.map((o) => (
            <HistoryCard key={o.id} order={o} reviewed={reviewedIds.has(o.id)} />
          ))}
          {filtered.length === 0 && (
            <Text style={styles.emptyText}>Aucune livraison dans l'historique</Text>
          )}
        </View>
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.xl },
  heading: {
    fontFamily: FontFamily.serif,
    fontSize: 27,
    color: colors.text.primary,
    letterSpacing: -0.27,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: colors.border.glass,
    backgroundColor: colors.bg.card,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.sansMedium,
    fontSize: 14,
    color: colors.text.primary,
  },
  list: { gap: 9 },
  card: {
    padding: 14,
    borderRadius: Radius.lg,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ref: {
    fontFamily: FontFamily.sansBold,
    fontSize: 13.5,
    color: colors.text.primary,
  },
  date: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 11.5,
    color: colors.text.tertiary,
  },
  addrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addrText: {
    flex: 1,
    fontFamily: FontFamily.sansMedium,
    fontSize: 12,
    color: colors.text.tertiary,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  fee: {
    fontFamily: FontFamily.serif,
    fontSize: 15,
    color: colors.amberBright,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  badgeReviewed: {
    backgroundColor: colors.sageSoft,
    borderColor: 'rgba(127,184,158,0.30)',
  },
  badgePending: {
    backgroundColor: colors.bg.card,
    borderColor: colors.border.glass,
  },
  badgeText: {
    fontFamily: FontFamily.sansExtraBold,
    fontSize: 9.5,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  badgeTextReviewed: {
    color: '#8fe0b8',
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
