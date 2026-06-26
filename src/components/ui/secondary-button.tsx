import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { FontFamily, Radius, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'ghost' | 'reject';

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export function SecondaryButton({
  label,
  onPress,
  variant = 'ghost',
  style,
  icon,
}: SecondaryButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animStyle, style]}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        onPress={onPress}
        style={[styles.button, variant === 'reject' ? styles.reject : styles.ghost]}
      >
        <Text style={[styles.label, variant === 'reject' ? styles.rejectText : styles.ghostText]}>
          {label}
        </Text>
        {icon}
      </Pressable>
    </Animated.View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: Radius.md,
      borderWidth: 1,
    },
    ghost: {
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderColor: colors.border.glass,
    },
    reject: {
      backgroundColor: colors.redSoft,
      borderColor: colors.redBorder,
    },
    label: {
      fontFamily: FontFamily.sansBold,
      fontSize: 13.5,
    },
    ghostText: {
      color: colors.text.secondary,
    },
    rejectText: {
      color: '#f0a89e',
    },
  });
}
