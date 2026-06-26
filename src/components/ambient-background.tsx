import { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

const { width: W, height: H } = Dimensions.get('screen');

export function AmbientBackground() {
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 7000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
        {/*
         * Real SVG radial gradients — matches CSS:
         *   radial-gradient(420px 280px at 25% -5%, rgba(235,162,78,0.28), transparent 65%)
         *   radial-gradient(360px 240px at 95% 18%, rgba(127,184,158,0.20), transparent 60%)
         * The GlassCard BlurView captures these colors as a blurred backdrop
         */}
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${W} ${H}`}
          style={StyleSheet.absoluteFill}
          preserveAspectRatio="xMinYMin slice"
        >
          <Defs>
            <RadialGradient
              id="ambientAmber"
              cx={W * 0.25}
              cy={-H * 0.04}
              r={W * 0.75}
              fx={W * 0.25}
              fy={-H * 0.04}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor="#eba24e" stopOpacity={0.32} />
              <Stop offset="0.55" stopColor="#eba24e" stopOpacity={0.12} />
              <Stop offset="1" stopColor="#eba24e" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient
              id="ambientSage"
              cx={W * 0.95}
              cy={H * 0.16}
              r={W * 0.65}
              fx={W * 0.95}
              fy={H * 0.16}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor="#7fb89e" stopOpacity={0.24} />
              <Stop offset="0.55" stopColor="#7fb89e" stopOpacity={0.08} />
              <Stop offset="1" stopColor="#7fb89e" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={W} height={H} fill="url(#ambientAmber)" />
          <Rect x={0} y={0} width={W} height={H} fill="url(#ambientSage)" />
        </Svg>
      </Animated.View>
    </View>
  );
}
