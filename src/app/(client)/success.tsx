import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { AmbientBackground } from '@/components/ambient-background';
import { IconMapPin } from '@/components/icons';
import { GlassCard } from '@/components/ui/glass-card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { FontFamily, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Address } from '@/services/auth';
import type { OrderItem } from '@/services/orders';

function buildConfettiColors(colors: ThemeColors) {
  return [
    colors.amberBright,
    '#ffd599',
    colors.sageBright,
    '#a9d8c1',
    '#ffc06e',
    '#8fe0b8',
    '#f59e0b',
  ];
}

function ConfettiParticle({ index, colors }: { index: number; colors: ThemeColors }) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);

  const confettiColors = buildConfettiColors(colors);
  const color = confettiColors[index % confettiColors.length];
  const isRect = index % 3 !== 0;
  const startX = (index % 7) * 46 - 160;
  const delay = index * 60;

  useEffect(() => {
    const randX = startX + (Math.random() * 40 - 20);
    const randY = -(80 + Math.random() * 140);
    opacity.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(400, withTiming(0, { duration: 600 })),
    ));
    scale.value = withDelay(delay, withSpring(1, { damping: 8 }));
    tx.value = withDelay(delay, withTiming(randX, { duration: 1000, easing: Easing.out(Easing.cubic) }));
    ty.value = withDelay(delay, withTiming(randY, { duration: 1000, easing: Easing.out(Easing.cubic) }));
    rotate.value = withDelay(delay, withTiming(Math.random() * 360 - 180, { duration: 1000 }));
  }, [delay, opacity, rotate, scale, startX, tx, ty]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
    position: 'absolute',
    backgroundColor: color,
    width: isRect ? 6 : 8,
    height: isRect ? 10 : 8,
    borderRadius: isRect ? 2 : 4,
  }));

  return <Animated.View style={style} />;
}

// ── Animated check circle ──────────────────────────────────────────────────────
function AnimatedCheck() {
  const { colors } = useTheme();
  const circleScale = useSharedValue(0);
  const checkScale = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.5);

  useEffect(() => {
    circleScale.value = withSpring(1, { damping: 12, stiffness: 120 });
    checkScale.value = withDelay(250, withSpring(1, { damping: 10, stiffness: 160 }));
    pulseScale.value = withDelay(300, withRepeat(
      withSequence(
        withTiming(1.4, { duration: 800, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 0 }),
      ),
      3,
      false,
    ));
    pulseOpacity.value = withDelay(300, withRepeat(
      withSequence(
        withTiming(0, { duration: 800, easing: Easing.out(Easing.ease) }),
        withTiming(0.4, { duration: 0 }),
      ),
      3,
      false,
    ));
  }, [checkScale, circleScale, pulseOpacity, pulseScale]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
  }));
  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <View style={check.container}>
      {/* Pulse ring */}
      <Animated.View style={[check.pulse, pulseStyle]} />
      {/* Circle */}
      <Animated.View style={[check.circle, circleStyle]}>
        <Svg width={86} height={86} viewBox="0 0 86 86">
          <Circle
            cx={43}
            cy={43}
            r={40}
            fill="none"
            stroke={colors.sageBright}
            strokeWidth={2}
            opacity={0.3}
          />
          <Circle
            cx={43}
            cy={43}
            r={43}
            fill="rgba(127,184,158,0.12)"
          />
        </Svg>
        {/* Check icon */}
        <Animated.View style={[check.checkWrap, checkStyle]}>
          <Svg width={36} height={36} viewBox="0 0 24 24">
            <Path
              d="M5 12l4.5 4.5L19 7"
              stroke={colors.sageBright}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const check = StyleSheet.create({
  container: {
    width: 86,
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(143,224,184,0.2)',
  },
  circle: {
    width: 86,
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkWrap: {
    position: 'absolute',
  },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function SuccessScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { orderId, pharmacyName, total, items: itemsStr, deliveryAddress: deliveryAddressStr } = useLocalSearchParams<{
    orderId: string;
    pharmacyName: string;
    total: string;
    items: string;
    deliveryAddress: string;
  }>();

  const orderRef = orderId ? `#${orderId.slice(-6).toUpperCase()}` : '—';

  const items: OrderItem[] = itemsStr ? JSON.parse(itemsStr) : [];
  const deliveryAddress: Address | null = deliveryAddressStr ? JSON.parse(deliveryAddressStr) : null;

  const contentOpacity = useSharedValue(0);
  const contentY = useSharedValue(24);

  useEffect(() => {
    contentOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
    contentY.value = withDelay(200, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));
  }, [contentOpacity, contentY]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentY.value }],
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <AmbientBackground />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Check + confetti */}
        <View style={styles.heroSection}>
          <View style={styles.confettiWrap}>
            {Array.from({ length: 14 }).map((_, i) => (
              <ConfettiParticle key={i} index={i} colors={colors} />
            ))}
          </View>
          <AnimatedCheck />
        </View>

        {/* Title */}
        <Animated.View style={[styles.textSection, contentStyle]}>
          <Text style={styles.title}>Merci pour votre{'\n'}
            <Text style={styles.titleItalic}>commande !</Text>
          </Text>
          <Text style={styles.subtitle}>
            Votre pharmacie a été notifiée et prépare votre commande.
          </Text>
        </Animated.View>

        {/* Order ref card */}
        <Animated.View style={contentStyle}>
          <GlassCard strong style={styles.refCard}>
            <View style={styles.refRow}>
              <View>
                <Text style={styles.refLabel}>Numéro de commande</Text>
                <Text style={styles.refValue}>{orderRef}</Text>
              </View>
              <View style={styles.refBadge}>
                <View style={styles.refBadgeDot} />
                <Text style={styles.refBadgeText}>En attente</Text>
              </View>
            </View>
            <View style={styles.refDivider} />
            <View style={styles.refMeta}>
              <Text style={styles.refMetaLabel}>Pharmacie</Text>
              <Text style={styles.refMetaValue}>{pharmacyName ?? '—'}</Text>
            </View>
            <View style={styles.refMeta}>
              <Text style={styles.refMetaLabel}>Total payé</Text>
              <Text style={[styles.refMetaValue, { color: colors.amberBright }]}>
                {parseFloat(total ?? '0').toFixed(2)} €
              </Text>
            </View>
          </GlassCard>

          {/* Items recap */}
          {items.length > 0 && (
            <View style={styles.itemsSection}>
              <Text style={styles.sectionLabel}>Récapitulatif</Text>
              <GlassCard style={styles.itemsList}>
                {items.map((item, i) => (
                  <View key={i} style={[styles.itemRow, i < items.length - 1 && styles.itemRowBorder]}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <View style={styles.itemRight}>
                      <Text style={styles.itemQty}>×{item.quantity}</Text>
                      <Text style={styles.itemPrice}>
                        {((item.price ?? 0) * (item.quantity ?? 0)).toFixed(2)} €
                      </Text>
                    </View>
                  </View>
                ))}
              </GlassCard>
            </View>
          )}

          {/* Delivery address */}
          {deliveryAddress && (
            <View style={styles.addressSection}>
              <Text style={styles.sectionLabel}>Adresse de livraison</Text>
              <GlassCard style={styles.addressCard}>
                <IconMapPin size={17} color={colors.amberBright} strokeWidth={1.8} />
                <Text style={styles.addressText}>
                  {deliveryAddress.street}, {deliveryAddress.zipCode} {deliveryAddress.city}
                </Text>
              </GlassCard>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <PrimaryButton
          label="Suivre ma commande"
          onPress={() => router.replace({ pathname: '/(client)' as never, params: { tab: 'commandes', orderId } })}
        />
        <SecondaryButton
          label="Retour à l'accueil"
          onPress={() => router.replace({ pathname: '/(client)' as never, params: { tab: 'pharmacies' } })}
          style={styles.homeBtn}
        />
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg.surface },
    content: { paddingHorizontal: Spacing.xl, alignItems: 'stretch' },
    heroSection: {
      alignItems: 'center',
      justifyContent: 'center',
      height: 160,
      marginBottom: 8,
    },
    confettiWrap: {
      position: 'absolute',
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      bottom: '50%',
    },
    textSection: {
      alignItems: 'center',
      marginBottom: 28,
    },
    title: {
      fontFamily: FontFamily.serif,
      fontSize: 34,
      color: colors.text.primary,
      textAlign: 'center',
      lineHeight: 40,
      marginBottom: 10,
    },
    titleItalic: {
      fontFamily: FontFamily.serifItalic,
      color: colors.amberBright,
    },
    subtitle: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 14,
      color: colors.text.secondary,
      textAlign: 'center',
      lineHeight: 21,
      maxWidth: 260,
    },
    refCard: {
      padding: 18,
      borderRadius: Radius.lg,
      gap: 12,
      marginBottom: 14,
    },
    refRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    refLabel: {
      fontFamily: FontFamily.sansExtraBold,
      fontSize: 10,
      color: colors.text.tertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 5,
    },
    refValue: {
      fontFamily: FontFamily.serif,
      fontSize: 22,
      color: colors.amberBright,
      letterSpacing: 0.5,
    },
    refBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.amberSoft,
      borderWidth: 1,
      borderColor: 'rgba(235,162,78,0.25)',
      borderRadius: Radius.pill,
      paddingVertical: 6,
      paddingHorizontal: 11,
    },
    refBadgeDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.amberBright,
    },
    refBadgeText: {
      fontFamily: FontFamily.sansBold,
      fontSize: 11.5,
      color: colors.amberBright,
    },
    refDivider: {
      height: 1,
      backgroundColor: colors.border.glass,
    },
    refMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    refMetaLabel: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 13,
      color: colors.text.tertiary,
    },
    refMetaValue: {
      fontFamily: FontFamily.sansBold,
      fontSize: 13,
      color: colors.text.primary,
    },
    itemsSection: { gap: 10 },
    sectionLabel: {
      fontFamily: FontFamily.sansExtraBold,
      fontSize: 10.5,
      color: colors.text.tertiary,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    itemsList: {
      borderRadius: Radius.lg,
      overflow: 'hidden',
    },
    itemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 13,
      paddingHorizontal: 16,
    },
    itemRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border.glass,
    },
    itemName: {
      fontFamily: FontFamily.sansBold,
      fontSize: 13.5,
      color: colors.text.primary,
      flex: 1,
    },
    itemRight: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    itemQty: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 12,
      color: colors.text.tertiary,
    },
    itemPrice: {
      fontFamily: FontFamily.sansBold,
      fontSize: 13.5,
      color: colors.text.primary,
    },
    addressSection: { gap: 10, marginTop: 14 },
    addressCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 14,
      borderRadius: Radius.lg,
    },
    addressText: {
      flex: 1,
      fontFamily: FontFamily.sansMedium,
      fontSize: 13,
      color: colors.text.secondary,
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: Spacing.xl,
      paddingTop: 10,
      gap: 10,
      alignItems: 'center',
    },
    homeBtn: { width: '100%' },
  });
}
