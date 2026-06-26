import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { FontFamily, Radius } from '@/constants/theme';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
}

export function PrimaryButton({ label, onPress, style, icon, loading, disabled }: PrimaryButtonProps) {
  const scale = useSharedValue(1);
  const isDisabled = disabled || loading;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: isDisabled ? 0.65 : 1,
  }));

  return (
    <Animated.View style={[styles.wrap, animStyle, style]}>
      <Pressable
        onPressIn={() => {
          if (!isDisabled) scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        onPress={isDisabled ? undefined : onPress}
        style={styles.pressable}
      >
        <LinearGradient
          colors={['#ffc06e', '#c9821f']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {loading ? (
            <ActivityIndicator color="#221204" size="small" />
          ) : (
            <>
              <Text style={styles.label}>{label}</Text>
              {icon}
            </>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: Radius.md,
    shadowColor: '#ffc06e',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 10,
    overflow: 'hidden',
  },
  pressable: {
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    paddingHorizontal: 24,
    minHeight: 56,
  },
  label: {
    fontFamily: FontFamily.sansExtraBold,
    fontSize: 15,
    color: '#221204',
  },
});
