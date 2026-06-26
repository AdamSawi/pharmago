import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontFamily, Radius, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type NotificationType = 'success' | 'error' | 'info';

function typeColor(colors: ThemeColors): Record<NotificationType, string> {
  return {
    success: colors.amberBright,
    error: '#e07a6b',
    info: colors.sage,
  };
}

interface NotificationBannerProps {
  title: string;
  message?: string;
  type?: NotificationType;
  visible: boolean;
  onHide?: () => void;
}

export function NotificationBanner({ title, message, type = 'info', visible, onHide }: NotificationBannerProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 350 });
      opacity.value = withTiming(1, { duration: 250 });
      translateY.value = withDelay(3000, withTiming(-100, { duration: 350 }));
      opacity.value = withDelay(3000, withTiming(0, { duration: 350 }, () => {
        if (onHide) runOnJS(onHide)();
      }));
    }
  }, [visible, translateY, opacity, onHide]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  const color = typeColor(colors)[type];

  return (
    <Animated.View style={[styles.wrap, { top: insets.top + 8, borderColor: `${color}40`, backgroundColor: `${color}15` }, style]} pointerEvents="none">
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    </Animated.View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      position: 'absolute',
      left: 16,
      right: 16,
      zIndex: 200,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      padding: 14,
      borderRadius: Radius.lg,
      borderWidth: 1,
      backgroundColor: colors.bg.card,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginTop: 4,
    },
    textWrap: { flex: 1, gap: 2 },
    title: {
      fontFamily: FontFamily.sansBold,
      fontSize: 13.5,
      color: colors.text.primary,
    },
    message: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 12,
      color: colors.text.secondary,
    },
  });
}
