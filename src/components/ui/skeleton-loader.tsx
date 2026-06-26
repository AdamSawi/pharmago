import { useEffect, useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Radius, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function useShimmer() {
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 700 }),
        withTiming(0.3, { duration: 700 }),
      ),
      -1,
      true,
    );
  }, [opacity]);
  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}

function Block({ style }: { style: ViewStyle }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const shimmerStyle = useShimmer();
  return <Animated.View style={[styles.block, style, shimmerStyle]} />;
}

export function SkeletonCard() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Block style={{ width: 44, height: 44, borderRadius: 14 }} />
        <View style={{ flex: 1, gap: 6 }}>
          <Block style={{ width: '60%', height: 13, borderRadius: 4 }} />
          <Block style={{ width: '40%', height: 11, borderRadius: 4 }} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View style={{ gap: 9 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

export function SkeletonStat() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.statRow}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.statCard}>
          <Block style={{ width: '50%', height: 18, borderRadius: 4, marginBottom: 6 }} />
          <Block style={{ width: '70%', height: 9, borderRadius: 4 }} />
        </View>
      ))}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    block: {
      backgroundColor: colors.border.glassStrong,
    },
    card: {
      padding: 14,
      borderRadius: Radius.lg,
      backgroundColor: colors.bg.card,
      borderWidth: 1,
      borderColor: colors.border.glass,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    statRow: {
      flexDirection: 'row',
      gap: 9,
      marginBottom: 22,
    },
    statCard: {
      flex: 1,
      padding: 14,
      borderRadius: Radius.md,
      backgroundColor: colors.bg.card,
      borderWidth: 1,
      borderColor: colors.border.glass,
    },
  });
}
