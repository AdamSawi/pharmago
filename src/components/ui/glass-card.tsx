import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { Platform, StyleSheet, View, type ViewProps } from 'react-native';
import { Radius, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface GlassCardProps extends ViewProps {
  /**
   * strong: uses a diagonal gradient (glass-strong from reference HTML)
   *   background: linear-gradient(155deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03))
   */
  strong?: boolean;
  radius?: number;
}

export function GlassCard({ style, strong, radius, children, ...props }: GlassCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const r = radius ?? Radius.lg;

  return (
    <View style={[styles.container, { borderRadius: r }, style]} {...props}>
      {/* Blur layer — iOS only; Android gets opaque dark bg */}
      {Platform.OS === 'ios' ? (
        <BlurView intensity={28} tint="dark" style={[StyleSheet.absoluteFill, { borderRadius: r }]} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.androidBg, { borderRadius: r }]} />
      )}

      {/* Glass tint — subtle white overlay (or diagonal gradient for strong) */}
      {strong ? (
        <LinearGradient
          colors={['rgba(255,255,255,0.09)', 'rgba(255,255,255,0.03)']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: r }]}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.glassTint, { borderRadius: r }]} />
      )}

      {children}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      borderWidth: 1,
      borderColor: colors.border.glass,
      overflow: 'hidden',
    },
    androidBg: {
      // Near-opaque surface — makes card fully cover content behind it on Android
      backgroundColor: 'rgba(16,19,25,0.94)',
    },
    glassTint: {
      backgroundColor: 'rgba(255,255,255,0.04)',
    },
  });
}
