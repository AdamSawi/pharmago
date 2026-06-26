import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconArrowRight, IconMapPin } from '@/components/icons';
import { GlassCard } from '@/components/ui/glass-card';
import { SkeletonCard } from '@/components/ui/skeleton-loader';
import { FontFamily, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { listenActiveDelivery, type FirestoreOrder } from '@/services/orders';

export function EnCoursTab() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [order, setOrder] = useState<FirestoreOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = listenActiveDelivery(user.uid, (data) => {
      setOrder(data);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const fee = order ? (order.deliveryFee ?? 0).toFixed(2) : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>En cours</Text>

        {loading ? (
          <SkeletonCard />
        ) : order ? (
          <Pressable
            onPress={() => router.push({ pathname: '/(delivery)/route' as never, params: { orderId: order.id } })}
            style={({ pressed }) => pressed && { opacity: 0.85 }}
          >
            <GlassCard strong style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardRef}>Commande #{order.id.slice(-4).toUpperCase()}</Text>
                <IconArrowRight size={16} color={colors.amberBright} strokeWidth={2.2} />
              </View>
              <Text style={styles.cardClient}>{order.clientName}</Text>
              <View style={styles.cardMeta}>
                <IconMapPin size={12} color={colors.text.tertiary} strokeWidth={1.8} />
                <Text style={styles.cardAddr}>
                  {order.deliveryAddress
                    ? `${order.deliveryAddress.street}, ${order.deliveryAddress.zipCode} ${order.deliveryAddress.city}`
                    : 'Adresse non renseignée'}
                </Text>
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.cardFooterLabel}>Vous gagnez</Text>
                <Text style={styles.cardFooterValue}>{fee} €</Text>
              </View>
            </GlassCard>
          </Pressable>
        ) : (
          <GlassCard style={styles.emptyCard}>
            <Text style={styles.emptyText}>Aucune livraison en cours.</Text>
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
  heading: {
    fontFamily: FontFamily.serif,
    fontSize: 27,
    color: colors.text.primary,
    letterSpacing: -0.27,
    marginBottom: 20,
  },
  card: {
    padding: 18,
    borderRadius: Radius.xl,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardRef: {
    fontFamily: FontFamily.sansBold,
    fontSize: 13.5,
    color: colors.text.secondary,
  },
  cardClient: {
    fontFamily: FontFamily.serif,
    fontSize: 21,
    color: colors.text.primary,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardAddr: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 12.5,
    color: colors.text.tertiary,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border.glass,
    paddingTop: 12,
    marginTop: 4,
  },
  cardFooterLabel: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13,
    color: colors.text.secondary,
  },
  cardFooterValue: {
    fontFamily: FontFamily.serif,
    fontSize: 20,
    color: colors.amberBright,
  },
  emptyCard: {
    padding: 24,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13.5,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  });
}
