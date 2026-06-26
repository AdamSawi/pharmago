import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { FontFamily, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  style?: ViewStyle;
  error?: string | null;
}

export function TextField({ label, style, error, ...props }: TextFieldProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const focused = useSharedValue(0);
  const errorVal = useSharedValue(0);

  useEffect(() => {
    errorVal.value = withTiming(error ? 1 : 0, { duration: 150 });
  }, [error, errorVal]);

  const animBorder = useAnimatedStyle(() => {
    if (errorVal.value > 0.5) {
      return { borderColor: 'rgba(248,113,113,0.65)' };
    }
    return {
      borderColor: interpolateColor(
        focused.value,
        [0, 1],
        [colors.border.glass, 'rgba(235,162,78,0.45)'],
      ),
    };
  });

  return (
    <View style={[styles.wrapper, style]}>
      <Animated.View style={[styles.container, animBorder]}>
        <Text style={[styles.label, error ? styles.labelError : null]}>{label}</Text>
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.text.tertiary}
          onFocus={() => { focused.value = withTiming(1, { duration: 200 }); }}
          onBlur={() => { focused.value = withTiming(0, { duration: 200 }); }}
          {...props}
        />
      </Animated.View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrapper: {
      marginBottom: 11,
    },
    container: {
      backgroundColor: colors.bg.card,
      borderWidth: 1,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.lg + 2,
      paddingVertical: Spacing.lg,
      gap: 3,
    },
    label: {
      fontFamily: FontFamily.sansExtraBold,
      fontSize: 10.5,
      textTransform: 'uppercase',
      letterSpacing: 1,
      color: colors.text.tertiary,
    },
    labelError: {
      color: 'rgba(248,113,113,0.85)',
    },
    input: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 16,
      color: colors.text.primary,
      paddingTop: 2,
    },
    errorText: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 12,
      color: '#f87171',
      marginTop: 5,
      marginLeft: 4,
    },
  });
}
