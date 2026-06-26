import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { IconCheck, IconDocument, IconX } from '@/components/icons';
import { FontFamily, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import type { Order } from '@/data/mock-orders';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  order: Order;
  onPress: (id: string) => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

const SWIPE_THRESHOLD = 90;

export function SwipeableOrderCard({ order, onPress, onAccept, onReject }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const translateX = useSharedValue(0);
  // Tracks drag so we can distinguish tap from swipe
  const isDragging = useSharedValue(false);

  const isPending = order.status === 'pending';

  const panGesture = Gesture.Pan()
    .enabled(isPending)
    .activeOffsetX([-10, 10])
    .onStart(() => {
      isDragging.value = false;
    })
    .onUpdate((e) => {
      if (Math.abs(e.translationX) > 8) isDragging.value = true;
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      const wasDragged = isDragging.value;
      if (e.translationX > SWIPE_THRESHOLD) {
        runOnJS(onAccept)(order.id);
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        runOnJS(onReject)(order.id);
      } else if (!wasDragged) {
        runOnJS(onPress)(order.id);
      }
      translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
      isDragging.value = false;
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    if (!isDragging.value) runOnJS(onPress)(order.id);
  });

  const gesture = isPending
    ? Gesture.Simultaneous(panGesture, tapGesture)
    : tapGesture;

  // Card slides + rotates — exact from HTML (translateX * 0.02deg)
  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${translateX.value * 0.02}deg` },
    ],
  }));

  // Swipe-bg: invisible at rest, reveals proportionally as card moves
  // This is the core fix — swipe labels NEVER show through card at rest
  const bgOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(Math.abs(translateX.value), [0, 30, SWIPE_THRESHOLD], [0, 0, 1], Extrapolation.CLAMP),
  }));

  return (
    <View style={styles.wrap}>
      {/* Swipe-bg: colored gradient, hidden at rest */}
      {isPending && (
        <Animated.View style={[StyleSheet.absoluteFill, bgOpacity]}>
          <LinearGradient
            colors={[
              'rgba(224,122,107,0.22)',
              'rgba(20,22,26,0)',
              'rgba(20,22,26,0)',
              'rgba(127,184,158,0.22)',
            ]}
            locations={[0, 0.3, 0.7, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[StyleSheet.absoluteFill, styles.swipeBgInner]}
          >
            <View style={styles.rejectSide}>
              <IconX size={15} color="#f0a89e" strokeWidth={2.3} />
              <Text style={styles.rejectText}>Refuser</Text>
            </View>
            <View style={styles.acceptSide}>
              <Text style={styles.acceptText}>Valider</Text>
              <IconCheck size={15} color="#8fe0b8" strokeWidth={2.3} />
            </View>
          </LinearGradient>
        </Animated.View>
      )}

      <GestureDetector gesture={gesture}>
        {/* The card must be visually opaque so it fully hides swipe-bg at rest.
            On iOS: BlurView renders as frosted glass (opaque enough).
            On Android: solid surface color makes it fully opaque. */}
        <Animated.View style={[styles.card, cardStyle]}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.cardBgAndroid]} />
          )}
          {/* Glass tint + border shimmer */}
          <View style={[StyleSheet.absoluteFill, styles.cardGlassTint]} />

          {/* Content */}
          <View
            style={[
              styles.iconWrap,
              order.status === 'transit' ? styles.iconTransit : styles.iconPending,
            ]}
          >
            {order.status === 'transit' ? (
              <IconCheck size={19} color="#8fe0b8" strokeWidth={2} />
            ) : (
              <IconDocument size={19} color={colors.amberBright} strokeWidth={1.7} />
            )}
          </View>

          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {order.clientName}
            </Text>
            <Text style={styles.meta}>{order.meta}</Text>
          </View>

          {isPending && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>NOUVEAU</Text>
            </View>
          )}
          {order.status === 'transit' && (
            <View style={[styles.tag, styles.tagTransit]}>
              <Text style={[styles.tagText, styles.tagTransitText]}>EN ROUTE</Text>
            </View>
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      height: 74,
      borderRadius: Radius.lg,
      overflow: 'hidden',
      flexShrink: 0,
    },
    swipeBgInner: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 22,
      borderRadius: Radius.lg,
    },
    rejectSide: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    acceptSide: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    rejectText: {
      fontFamily: FontFamily.sansBold,
      fontSize: 12,
      color: '#f0a89e',
    },
    acceptText: {
      fontFamily: FontFamily.sansBold,
      fontSize: 12,
      color: '#8fe0b8',
    },
    card: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
      paddingHorizontal: Spacing.lg,
      borderWidth: 1,
      borderColor: colors.border.glass,
      borderRadius: Radius.lg,
      overflow: 'hidden',
    },
    // Android: solid near-opaque surface so swipe-bg is fully hidden at rest
    cardBgAndroid: {
      backgroundColor: 'rgba(16,19,25,0.97)',
    },
    cardGlassTint: {
      backgroundColor: 'rgba(255,255,255,0.04)',
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    iconPending: {
      backgroundColor: colors.amberSoft,
    },
    iconTransit: {
      backgroundColor: colors.sageSoft,
    },
    info: {
      flex: 1,
      minWidth: 0,
    },
    name: {
      fontFamily: FontFamily.sansBold,
      fontSize: 14.5,
      color: colors.text.primary,
      marginBottom: 2,
    },
    meta: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 12,
      color: colors.text.tertiary,
    },
    tag: {
      backgroundColor: colors.amberSoft,
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 8,
      flexShrink: 0,
    },
    tagText: {
      fontFamily: FontFamily.sansExtraBold,
      fontSize: 10.5,
      color: colors.amberBright,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    tagTransit: {
      backgroundColor: colors.sageSoft,
    },
    tagTransitText: {
      color: '#8fe0b8',
    },
  });
}
