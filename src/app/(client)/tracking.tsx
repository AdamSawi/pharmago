import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { IconCheck, IconChevronLeft, IconClock, IconPhone } from '@/components/icons';
import { GlassCard } from '@/components/ui/glass-card';
import { FontFamily, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const MAP_W = 320;
const MAP_H = 170;

// Waypoints: pickup → midpoint → delivery
const WP = [
  { x: 34, y: 138 },
  { x: 172, y: 88 },
  { x: 290, y: 28 },
];

const STEPS = [
  { id: 'accepted', label: 'Commande acceptée', sub: 'Votre pharmacie prépare votre commande', done: true, active: false },
  { id: 'transit', label: 'En route', sub: 'Votre livreur est en chemin', done: false, active: true },
  { id: 'delivered', label: 'Livraison', sub: 'À domicile dans ~14 min', done: false, active: false },
];

function StepperDot({
  done,
  active,
  colors,
  styles,
}: {
  done: boolean;
  active: boolean;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (active) {
      scale.value = withRepeat(
        withTiming(1.35, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    }
  }, [active, scale]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (done) {
    return (
      <View style={[styles.dotWrap, { backgroundColor: colors.sageSoft, borderColor: colors.sage }]}>
        <IconCheck size={13} color={colors.sageBright} strokeWidth={2.5} />
      </View>
    );
  }
  if (active) {
    return (
      <View style={styles.dotWrap}>
        <Animated.View style={[styles.dotPulse, animStyle]} />
        <View style={[styles.dotInner, { backgroundColor: colors.amberBright }]} />
      </View>
    );
  }
  return (
    <View style={[styles.dotWrap, { backgroundColor: colors.bg.card, borderColor: colors.border.glass }]}>
      <View style={[styles.dotInner, { backgroundColor: colors.text.tertiary, opacity: 0.4 }]} />
    </View>
  );
}

export default function TrackingScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Courier dot progress: 0→1 over 12s, loops
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 12000, easing: Easing.linear }), -1, false);
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

  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);

  useEffect(() => {
    pulseScale.value = withRepeat(withTiming(2.2, { duration: 1800 }), -1, false);
    pulseOpacity.value = withRepeat(withTiming(0, { duration: 1800 }), -1, false);
  }, [pulseScale, pulseOpacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <AmbientBackground />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={styles.topbar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <IconChevronLeft size={18} color={colors.text.secondary} strokeWidth={2.2} />
          </Pressable>
          <Text style={styles.heading}>Suivi de livraison</Text>
          <View style={styles.backBtn} />
        </View>

        {/* Map */}
        <GlassCard strong style={styles.mapCard}>
          <View style={styles.mapContainer}>
            <Svg width={MAP_W} height={MAP_H} viewBox={`0 0 ${MAP_W} ${MAP_H}`}>
              <Defs>
                <SvgGradient id="pathGrad" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor={colors.sage} stopOpacity={0.5} />
                  <Stop offset="1" stopColor={colors.amber} stopOpacity={0.5} />
                </SvgGradient>
              </Defs>
              {/* Street grid */}
              <Path d={`M0 90 H${MAP_W}`} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
              <Path d={`M0 45 H${MAP_W}`} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
              <Path d={`M0 135 H${MAP_W}`} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
              <Path d={`M80 0 V${MAP_H}`} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
              <Path d={`M160 0 V${MAP_H}`} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
              <Path d={`M240 0 V${MAP_H}`} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
              {/* Route path — dashed bezier */}
              <Path
                d={`M ${WP[0].x} ${WP[0].y} Q 120 60 ${WP[1].x} ${WP[1].y} Q 240 100 ${WP[2].x} ${WP[2].y}`}
                stroke="url(#pathGrad)"
                strokeWidth={2.5}
                fill="none"
                strokeDasharray="4 10"
                strokeLinecap="round"
              />
              {/* Pickup dot (sage) */}
              <Circle cx={WP[0].x} cy={WP[0].y} r={7} fill="rgba(127,184,158,0.9)" />
              <Circle cx={WP[0].x} cy={WP[0].y} r={3.5} fill="#fff" />
              {/* Delivery dot (amber outline) */}
              <Circle cx={WP[2].x} cy={WP[2].y} r={7} fill="rgba(235,162,78,0.35)" stroke={colors.amberBright} strokeWidth={1.5} />
            </Svg>
            {/* Animated courier dot */}
            <Animated.View style={[styles.courierDotWrap, dotStyle]}>
              <Animated.View style={[styles.courierPulse, pulseStyle]} />
              <View style={styles.courierDot} />
            </Animated.View>
          </View>
          {/* ETA pill */}
          <View style={styles.etaPill}>
            <IconClock size={12} color={colors.amberBright} strokeWidth={1.8} />
            <Text style={styles.etaText}>~14 min</Text>
          </View>
        </GlassCard>

        {/* Status stepper */}
        <GlassCard style={styles.stepperCard}>
          {STEPS.map((step, i) => (
            <View key={step.id} style={styles.stepRow}>
              <View style={styles.stepLeft}>
                <StepperDot done={step.done} active={step.active} colors={colors} styles={styles} />
                {i < STEPS.length - 1 && (
                  <View style={[styles.stepLine, step.done && styles.stepLineDone]} />
                )}
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepLabel, step.active && styles.stepLabelActive, step.done && styles.stepLabelDone]}>
                  {step.label}
                </Text>
                <Text style={styles.stepSub}>{step.sub}</Text>
              </View>
            </View>
          ))}
        </GlassCard>

        {/* Courier card */}
        <GlassCard style={styles.courierCard}>
          <View style={styles.courierAvatar}>
            <Text style={styles.courierAvatarText}>KD</Text>
          </View>
          <View style={styles.courierInfo}>
            <Text style={styles.courierName}>Kevin Dubois</Text>
            <Text style={styles.courierRole}>Votre livreur · note 4.9</Text>
          </View>
          <Pressable style={styles.callBtn}>
            <IconPhone size={17} color={colors.sageBright} strokeWidth={1.8} />
          </Pressable>
        </GlassCard>
      </ScrollView>
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
    courierDotWrap: {
      position: 'absolute',
      width: 16,
      height: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    courierPulse: {
      position: 'absolute',
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.amberBright,
      opacity: 0.5,
    },
    courierDot: {
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
    etaPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      alignSelf: 'flex-end',
      margin: 12,
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
    stepperCard: {
      padding: 18,
      borderRadius: Radius.lg,
      marginBottom: 14,
      gap: 0,
    },
    stepRow: {
      flexDirection: 'row',
      gap: 14,
    },
    stepLeft: {
      alignItems: 'center',
      width: 28,
    },
    dotWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.amberBright,
      backgroundColor: 'rgba(235,162,78,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    dotPulse: {
      position: 'absolute',
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.amberBright,
    },
    dotInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    stepLine: {
      width: 1.5,
      flex: 1,
      backgroundColor: colors.border.glass,
      marginVertical: 4,
    },
    stepLineDone: {
      backgroundColor: colors.sage,
    },
    stepContent: {
      flex: 1,
      paddingBottom: 22,
      gap: 3,
    },
    stepLabel: {
      fontFamily: FontFamily.sansBold,
      fontSize: 14,
      color: colors.text.tertiary,
    },
    stepLabelActive: {
      color: colors.text.primary,
    },
    stepLabelDone: {
      color: colors.sageBright,
    },
    stepSub: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 12,
      color: colors.text.tertiary,
    },
    courierCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      padding: 16,
      borderRadius: Radius.lg,
    },
    courierAvatar: {
      width: 46,
      height: 46,
      borderRadius: 15,
      backgroundColor: 'rgba(127,184,158,0.15)',
      borderWidth: 1,
      borderColor: 'rgba(127,184,158,0.25)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    courierAvatarText: {
      fontFamily: FontFamily.sansBold,
      fontSize: 15,
      color: colors.sageBright,
    },
    courierInfo: {
      flex: 1,
      gap: 3,
    },
    courierName: {
      fontFamily: FontFamily.sansBold,
      fontSize: 14.5,
      color: colors.text.primary,
    },
    courierRole: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 12,
      color: colors.text.tertiary,
    },
    callBtn: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor: colors.sageSoft,
      borderWidth: 1,
      borderColor: 'rgba(127,184,158,0.25)',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
