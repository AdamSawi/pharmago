import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import { AmbientBackground } from '@/components/ambient-background';
import {
  IconChat,
  IconCheck,
  IconChevronLeft,
  IconClock,
  IconMapPin,
  IconNavigation,
} from '@/components/icons';
import { GlassCard } from '@/components/ui/glass-card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { FontFamily, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { getOrCreateConversation } from '@/services/chat';
import { listenClientOrder, markDelivered, type FirestoreOrder } from '@/services/orders';

const MAP_W = 320;
const MAP_H = 160;
const WP = [
  { x: 34, y: 130 },
  { x: 170, y: 82 },
  { x: 290, y: 26 },
];

export default function RouteScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { orderId } = useLocalSearchParams<{ orderId: string }>();

  const [delivered, setDelivered] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [order, setOrder] = useState<FirestoreOrder | null>(null);
  const [contacting, setContacting] = useState(false);
  const [codeInput, setCodeInput] = useState('');

  async function handleContactClient() {
    if (!user || !order || contacting) return;
    setContacting(true);
    try {
      const conversationId = await getOrCreateConversation({
        uidA: user.uid,
        nameA: user.name,
        roleA: 'delivery',
        uidB: order.clientId,
        nameB: order.clientName,
        roleB: 'client',
        orderId: order.id,
      });
      router.push({ pathname: '/(delivery)/conversation' as never, params: { conversationId } });
    } finally {
      setContacting(false);
    }
  }

  useEffect(() => {
    if (!orderId) return;
    const unsub = listenClientOrder(orderId, setOrder);
    return unsub;
  }, [orderId]);

  // Rider dot animation
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 10000, easing: Easing.linear }), -1, false);
  }, [progress]);

  const dotStyle = useAnimatedStyle(() => {
    const p = progress.value;
    let x, y;
    if (p < 0.5) {
      const t = p * 2;
      x = WP[0].x + (WP[1].x - WP[0].x) * t;
      y = WP[0].y + (WP[1].y - WP[0].y) * t;
    } else {
      const t = (p - 0.5) * 2;
      x = WP[1].x + (WP[2].x - WP[1].x) * t;
      y = WP[1].y + (WP[2].y - WP[1].y) * t;
    }
    return { left: x - 8, top: y - 8 };
  });

  const pulseS = useSharedValue(1);
  const pulseO = useSharedValue(0.6);
  useEffect(() => {
    pulseS.value = withRepeat(withTiming(2.0, { duration: 1600 }), -1, false);
    pulseO.value = withRepeat(withTiming(0, { duration: 1600 }), -1, false);
  }, [pulseS, pulseO]);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseS.value }],
    opacity: pulseO.value,
  }));

  const toastOpacity = useSharedValue(0);
  const toastStyle = useAnimatedStyle(() => ({ opacity: toastOpacity.value }));

  const handleDeliver = async () => {
    if (!order || codeInput.trim() !== order.deliveryCode) {
      Alert.alert('Code incorrect', "Le code saisi ne correspond pas au code remis par le client.");
      return;
    }
    setDelivered(true);
    setShowToast(true);
    if (orderId) {
      try { await markDelivered(orderId); } catch { /* optimistic */ }
    }
    toastOpacity.value = withTiming(1, { duration: 300 });
    setTimeout(() => {
      toastOpacity.value = withTiming(0, { duration: 400 });
      setTimeout(() => router.replace('/(delivery)'), 500);
    }, 2200);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <AmbientBackground />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 140 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={styles.topbar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <IconChevronLeft size={18} color={colors.text.secondary} strokeWidth={2.2} />
          </Pressable>
          <Text style={styles.heading}>Itinéraire</Text>
          <View style={styles.backBtn} />
        </View>

        {/* Map */}
        <GlassCard strong style={styles.mapCard}>
          <View style={styles.mapContainer}>
            <Svg width={MAP_W} height={MAP_H} viewBox={`0 0 ${MAP_W} ${MAP_H}`}>
              <Defs>
                <SvgGradient id="routeGrad" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor={colors.sage} stopOpacity={0.55} />
                  <Stop offset="1" stopColor={colors.amber} stopOpacity={0.55} />
                </SvgGradient>
              </Defs>
              {/* Streets */}
              <Path d={`M0 80 H${MAP_W}`} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
              <Path d={`M0 40 H${MAP_W}`} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
              <Path d={`M0 120 H${MAP_W}`} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
              <Path d={`M80 0 V${MAP_H}`} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
              <Path d={`M160 0 V${MAP_H}`} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
              <Path d={`M240 0 V${MAP_H}`} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
              {/* Route */}
              <Path
                d={`M ${WP[0].x} ${WP[0].y} Q 110 52 ${WP[1].x} ${WP[1].y} Q 240 95 ${WP[2].x} ${WP[2].y}`}
                stroke="url(#routeGrad)"
                strokeWidth={2.5}
                fill="none"
                strokeDasharray="4 9"
                strokeLinecap="round"
              />
              {/* Pickup (sage) */}
              <Circle cx={WP[0].x} cy={WP[0].y} r={7} fill="rgba(127,184,158,0.9)" />
              <Circle cx={WP[0].x} cy={WP[0].y} r={3.5} fill="#fff" />
              {/* Delivery (amber) */}
              <Circle cx={WP[2].x} cy={WP[2].y} r={7} fill="rgba(235,162,78,0.35)" stroke={colors.amberBright} strokeWidth={1.5} />
            </Svg>
            {/* Rider dot */}
            <Animated.View style={[styles.riderDotWrap, dotStyle]}>
              <Animated.View style={[styles.riderPulse, pulseStyle]} />
              <View style={styles.riderDot} />
            </Animated.View>
          </View>
          {/* ETA + nav */}
          <View style={styles.mapFooter}>
            <View style={styles.etaPill}>
              <IconClock size={12} color={colors.amberBright} strokeWidth={1.8} />
              <Text style={styles.etaText}>~15 min</Text>
            </View>
            <Pressable style={styles.navBtn}>
              <IconNavigation size={16} color="#221204" />
              <Text style={styles.navBtnText}>Démarrer</Text>
            </Pressable>
          </View>
        </GlassCard>

        {/* Stop card — pickup */}
        <GlassCard style={[styles.stopCard, styles.stopCardSage]}>
          <View style={styles.stopHeader}>
            <View style={[styles.stopBadge, { backgroundColor: colors.sageSoft, borderColor: 'rgba(127,184,158,0.30)' }]}>
              <Text style={[styles.stopBadgeText, { color: colors.sageBright }]}>1</Text>
            </View>
            <Text style={[styles.stopCardRole, { color: colors.sageBright }]}>Récupération</Text>
          </View>
          <Text style={styles.stopCardName}>{order?.pharmacyName ?? 'Pharmacie'}</Text>
          <View style={styles.stopCardMeta}>
            <IconMapPin size={12} color={colors.text.tertiary} strokeWidth={1.8} />
            <Text style={styles.stopCardAddr}>{order?.pharmacyAddress ?? 'Adresse non renseignée'}</Text>
          </View>
          <View style={styles.stopCardDivider} />
          <Text style={styles.stopCardItems}>Médicaments à récupérer</Text>
        </GlassCard>

        {/* Stop card — dropoff */}
        <GlassCard style={[styles.stopCard, styles.stopCardAmber]}>
          <View style={styles.stopHeader}>
            <View style={[styles.stopBadge, { backgroundColor: colors.amberSoft, borderColor: 'rgba(235,162,78,0.28)' }]}>
              <Text style={[styles.stopBadgeText, { color: colors.amberBright }]}>2</Text>
            </View>
            <Text style={[styles.stopCardRole, { color: colors.amberBright }]}>Livraison</Text>
          </View>
          <Text style={styles.stopCardName}>{order?.clientName ?? 'Client'}</Text>
          <View style={styles.stopCardMeta}>
            <IconMapPin size={12} color={colors.text.tertiary} strokeWidth={1.8} />
            <Text style={styles.stopCardAddr}>
              {order?.deliveryAddress
                ? `${order.deliveryAddress.street}, ${order.deliveryAddress.zipCode} ${order.deliveryAddress.city}`
                : 'Adresse non renseignée'}
            </Text>
          </View>
          {order && (
            <Pressable onPress={handleContactClient} disabled={contacting} style={styles.contactBtn}>
              <IconChat size={14} color={colors.amberBright} strokeWidth={2} />
              <Text style={styles.contactBtnText}>Contacter le client</Text>
            </Pressable>
          )}
        </GlassCard>

        {/* Order summary */}
        <GlassCard style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Commande</Text>
            <Text style={styles.summaryValue}>#{orderId?.slice(-4).toUpperCase() ?? '—'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Distance</Text>
            <Text style={styles.summaryValue}>~2 km</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Gain estimé</Text>
            <Text style={[styles.summaryValue, { color: colors.amberBright }]}>
              {order ? `${(order.deliveryFee ?? 0).toFixed(2)} €` : '—'}
            </Text>
          </View>
        </GlassCard>
      </ScrollView>

      {/* Footer button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {!delivered && (
          <TextInput
            style={styles.codeInput}
            value={codeInput}
            onChangeText={(v) => setCodeInput(v.replace(/[^0-9]/g, '').slice(0, 4))}
            placeholder="Code client (4 chiffres)"
            placeholderTextColor={colors.text.tertiary}
            keyboardType="number-pad"
            maxLength={4}
          />
        )}
        <PrimaryButton
          label={delivered ? 'Livraison confirmée' : 'Marquer comme livrée'}
          onPress={delivered ? () => {} : handleDeliver}
          disabled={!delivered && codeInput.length !== 4}
        />
      </View>

      {/* Toast */}
      {showToast && (
        <Animated.View style={[styles.toast, toastStyle]}>
          <View style={styles.toastInner}>
            <View style={styles.toastIcon}>
              <IconCheck size={16} color={colors.sageBright} strokeWidth={2.5} />
            </View>
            <Text style={styles.toastText}>Livraison confirmée !</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.surface,
  },
  content: {
    paddingHorizontal: Spacing.xl,
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
  mapCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    marginBottom: 14,
  },
  mapContainer: {
    width: MAP_W,
    height: MAP_H,
    overflow: 'hidden',
    position: 'relative',
    alignSelf: 'center',
  },
  riderDotWrap: {
    position: 'absolute',
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderPulse: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.amberBright,
  },
  riderDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.amberBright,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: colors.amberBright,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  mapFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingTop: 8,
  },
  etaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(235,162,78,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(235,162,78,0.28)',
  },
  etaText: {
    fontFamily: FontFamily.sansBold,
    fontSize: 12,
    color: colors.amberBright,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: Radius.pill,
    backgroundColor: colors.amberBright,
    overflow: 'hidden',
  },
  navBtnText: {
    fontFamily: FontFamily.sansBold,
    fontSize: 13,
    color: '#221204',
  },
  stopCard: {
    padding: 16,
    borderRadius: Radius.lg,
    marginBottom: 10,
    gap: 8,
  },
  stopCardSage: {
    borderColor: 'rgba(127,184,158,0.22)',
  },
  stopCardAmber: {
    borderColor: 'rgba(235,162,78,0.22)',
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
  stopCardRole: {
    fontFamily: FontFamily.sansExtraBold,
    fontSize: 10.5,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  stopCardName: {
    fontFamily: FontFamily.sansBold,
    fontSize: 15,
    color: colors.text.primary,
  },
  stopCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stopCardAddr: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 12,
    color: colors.text.tertiary,
    flex: 1,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 4,
    paddingVertical: 9,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(235,162,78,0.28)',
    backgroundColor: colors.amberSoft,
  },
  contactBtnText: {
    fontFamily: FontFamily.sansBold,
    fontSize: 12.5,
    color: colors.amberBright,
  },
  stopCardDivider: {
    height: 1,
    backgroundColor: colors.border.glass,
  },
  stopCardItems: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 12.5,
    color: colors.text.secondary,
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
    paddingHorizontal: Spacing.xl,
    paddingTop: 12,
    gap: 10,
  },
  codeInput: {
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: colors.border.glass,
    backgroundColor: colors.bg.card,
    paddingHorizontal: 16,
    fontFamily: FontFamily.sansBold,
    fontSize: 16,
    letterSpacing: 4,
    color: colors.text.primary,
    textAlign: 'center',
  },
  toast: {
    position: 'absolute',
    top: 60,
    left: Spacing.xl,
    right: Spacing.xl,
    zIndex: 200,
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: Radius.lg,
    backgroundColor: colors.sageSoft,
    borderWidth: 1,
    borderColor: 'rgba(127,184,158,0.30)',
  },
  toastIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(127,184,158,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastText: {
    fontFamily: FontFamily.sansBold,
    fontSize: 15,
    color: colors.sageBright,
  },
  });
}
