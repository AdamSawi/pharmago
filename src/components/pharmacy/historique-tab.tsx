import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconDocument, IconSearch } from '@/components/icons';
import { GlassCard } from '@/components/ui/glass-card';
import { FilterButton, FilterSheet } from '@/components/ui/filter-sheet';
import { SkeletonList } from '@/components/ui/skeleton-loader';
import { ORDER_STATUS_CONFIG } from '@/constants/order-status';
import { FontFamily, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { listenPharmacyHistory, type FirestoreOrder } from '@/services/orders';
import { getDeliveryProfile } from '@/services/reviews';
import { generateInvoicePDF } from '@/utils/generate-invoice';

type Filter = 'all' | 'delivered' | 'rejected' | 'cancelled';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'delivered', label: 'Livrées' },
  { id: 'rejected', label: 'Refusées' },
  { id: 'cancelled', label: 'Annulées' },
];

function HistoryCard({
  order,
  deliveryName,
  colors,
  styles,
}: {
  order: FirestoreOrder;
  deliveryName?: string;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
}) {
  const config = ORDER_STATUS_CONFIG[order.status];
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const dateLabel = order.updatedAt
    ? new Date(order.updatedAt.toMillis()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '';

  async function handleInvoice() {
    if (generatingInvoice) return;
    setGeneratingInvoice(true);
    try {
      await generateInvoicePDF(order);
    } catch {
      Alert.alert('Erreur', "La facture n'a pas pu être générée.");
    } finally {
      setGeneratingInvoice(false);
    }
  }

  return (
    <Pressable onPress={() => router.push({ pathname: '/(pharmacy)/order-detail', params: { id: order.id } })}>
      <GlassCard style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.info}>
            <Text style={styles.name}>{order.clientName}</Text>
            <Text style={styles.meta}>#{order.id.slice(-4).toUpperCase()} · {dateLabel}</Text>
            <Text style={styles.meta}>
              {order.items.length} article{order.items.length > 1 ? 's' : ''}
              {order.status === 'delivered' && deliveryName ? ` · Livré par ${deliveryName}` : ''}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: `${config.color}22`, borderColor: `${config.color}4D` }]}>
            <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
          </View>
          <Text style={styles.price}>{(order.totalPrice ?? 0).toFixed(2)} €</Text>
        </View>
        {order.status === 'delivered' && (
          <Pressable onPress={handleInvoice} disabled={generatingInvoice} hitSlop={6} style={styles.invoiceBtn}>
            <IconDocument size={13} color={colors.amberBright} strokeWidth={1.8} />
            <Text style={styles.invoiceBtnText}>{generatingInvoice ? 'Génération…' : 'Facture'}</Text>
          </Pressable>
        )}
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
  const [filter, setFilter] = useState<Filter>('all');
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deliveryNames, setDeliveryNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    const unsub = listenPharmacyHistory(user.uid, (data) => {
      setOrders(data);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    const missingIds = [...new Set(
      orders
        .filter((o) => o.status === 'delivered' && o.deliveryId && !(o.deliveryId in deliveryNames))
        .map((o) => o.deliveryId as string),
    )];
    if (missingIds.length === 0) return;
    missingIds.forEach((deliveryId) => {
      getDeliveryProfile(deliveryId).then((profile) => {
        if (!profile) return;
        setDeliveryNames((prev) => ({ ...prev, [deliveryId]: profile.name }));
      }).catch(() => {});
    });
  }, [orders, deliveryNames]);

  const searchLower = search.trim().toLowerCase();
  const filtered = orders.filter((o) => {
    if (filter !== 'all' && o.status !== filter) return false;
    if (!searchLower) return true;
    return (
      o.id.slice(-4).toLowerCase().includes(searchLower) ||
      (o.clientName ?? '').toLowerCase().includes(searchLower)
    );
  });
  const activeFilterLabel = filter === 'all' ? null : (FILTERS.find((f) => f.id === filter)?.label ?? null);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headingRow}>
          <Text style={styles.heading}>Historique</Text>
          <FilterButton activeLabel={activeFilterLabel} onPress={() => setFilterSheetVisible(true)} />
        </View>

        <GlassCard style={styles.searchBar}>
          <IconSearch size={16} color={colors.text.tertiary} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher par numéro ou client…"
            placeholderTextColor={colors.text.tertiary}
            value={search}
            onChangeText={setSearch}
          />
        </GlassCard>

        {loading ? <SkeletonList /> : (
        <View style={styles.list}>
          {filtered.map((o) => (
            <HistoryCard
              key={o.id}
              order={o}
              deliveryName={o.deliveryId ? deliveryNames[o.deliveryId] : undefined}
              colors={colors}
              styles={styles}
            />
          ))}
          {filtered.length === 0 && (
            <Text style={styles.emptyText}>Aucune commande dans l'historique</Text>
          )}
        </View>
        )}
      </ScrollView>

      <FilterSheet
        visible={filterSheetVisible}
        onClose={() => setFilterSheetVisible(false)}
        title="Filtrer l'historique"
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
      marginBottom: 16,
      paddingRight: 50,
    },
    heading: {
      fontFamily: FontFamily.serif,
      fontSize: 27,
      color: colors.text.primary,
      letterSpacing: -0.27,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 16,
      borderRadius: Radius.lg,
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
      gap: 10,
    },
    cardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    invoiceBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: Radius.pill,
      backgroundColor: colors.amberSoft,
      borderWidth: 1,
      borderColor: 'rgba(235,162,78,0.30)',
    },
    invoiceBtnText: {
      fontFamily: FontFamily.sansBold,
      fontSize: 11.5,
      color: colors.amberBright,
    },
    info: { flex: 1, gap: 2 },
    name: {
      fontFamily: FontFamily.sansBold,
      fontSize: 14,
      color: colors.text.primary,
    },
    meta: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 11.5,
      color: colors.text.tertiary,
    },
    badge: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: Radius.pill,
      borderWidth: 1,
    },
    badgeText: {
      fontFamily: FontFamily.sansBold,
      fontSize: 10.5,
    },
    price: {
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
