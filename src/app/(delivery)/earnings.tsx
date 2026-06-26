import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AmbientBackground } from '@/components/ambient-background';
import { IconChevronLeft, IconMapPin } from '@/components/icons';
import { GlassCard } from '@/components/ui/glass-card';
import { SkeletonList } from '@/components/ui/skeleton-loader';
import { FontFamily, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import {
  getDeliveryStats,
  listenDeliveryEarningsMonth,
  listenDeliveryEarningsToday,
  listenDeliveryEarningsWeek,
  listenDeliveryHistory,
  type FirestoreOrder,
} from '@/services/orders';

function EarningCard({ order }: { order: FirestoreOrder }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const dateLabel = order.updatedAt
    ? new Date(order.updatedAt.toMillis()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    : '';
  const address = order.deliveryAddress
    ? `${order.deliveryAddress.street}, ${order.deliveryAddress.zipCode} ${order.deliveryAddress.city}`
    : 'Adresse non renseignée';

  return (
    <GlassCard style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.ref}>#CMD-{order.id.slice(-4).toUpperCase()}</Text>
        <Text style={styles.date}>{dateLabel}</Text>
      </View>
      <View style={styles.addrRow}>
        <IconMapPin size={12} color={colors.text.tertiary} strokeWidth={1.8} />
        <Text style={styles.addrText} numberOfLines={1}>{address}</Text>
      </View>
      <Text style={styles.fee}>+{(order.deliveryFee ?? 0).toFixed(2)} €</Text>
    </GlassCard>
  );
}

export default function EarningsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [today, setToday] = useState({ earnings: 0, count: 0 });
  const [week, setWeek] = useState({ earnings: 0, count: 0 });
  const [month, setMonth] = useState({ earnings: 0, count: 0 });
  const [total, setTotal] = useState({ totalDeliveries: 0, totalEarnings: 0 });
  const [history, setHistory] = useState<FirestoreOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsubToday = listenDeliveryEarningsToday(user.uid, setToday);
    const unsubWeek = listenDeliveryEarningsWeek(user.uid, setWeek);
    const unsubMonth = listenDeliveryEarningsMonth(user.uid, setMonth);
    const unsubHistory = listenDeliveryHistory(user.uid, (data) => {
      setHistory(data);
      setLoading(false);
    });
    getDeliveryStats(user.uid).then(setTotal).catch(() => {});
    return () => {
      unsubToday();
      unsubWeek();
      unsubMonth();
      unsubHistory();
    };
  }, [user]);

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
          <Text style={styles.heading}>Mes gains</Text>
          <View style={styles.backBtn} />
        </View>

        <View style={styles.statsGrid}>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statValue}>{today.earnings.toFixed(2)} €</Text>
            <Text style={styles.statLabel}>Aujourd'hui</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statValue}>{week.earnings.toFixed(2)} €</Text>
            <Text style={styles.statLabel}>Cette semaine</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statValue}>{month.earnings.toFixed(2)} €</Text>
            <Text style={styles.statLabel}>Ce mois</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.amberBright }]}>{total.totalEarnings.toFixed(2)} €</Text>
            <Text style={styles.statLabel}>Total</Text>
          </GlassCard>
        </View>

        <Text style={styles.sectionLabel}>Livraisons payées</Text>
        {loading ? <SkeletonList /> : (
          <View style={styles.list}>
            {history.map((o) => (
              <EarningCard key={o.id} order={o} />
            ))}
            {history.length === 0 && (
              <Text style={styles.emptyText}>Aucun gain enregistré pour le moment</Text>
            )}
          </View>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: 24,
  },
  statCard: {
    width: '47.5%',
    padding: 16,
    borderRadius: Radius.lg,
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
    fontSize: 10.5,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  list: { gap: 9 },
  card: {
    padding: 14,
    borderRadius: Radius.lg,
    gap: 8,
  },
  cardHeader: {
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
  fee: {
    fontFamily: FontFamily.serif,
    fontSize: 15,
    color: colors.amberBright,
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
