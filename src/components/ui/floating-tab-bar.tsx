/**
 * FloatingTabBar — v3 "liquid glass" design from docs/tabbar_v3.html
 *
 * Active tab:  amber pill scales 0.75→1 (spring), icon rises -5px, label fades in at bottom
 * Inactive:    icon centered, no label
 * Top reflet:  gradient transparent→white→transparent (no full horizontal line)
 * Blur:        BlurView intensity 55, saturation via tint="dark" + rgba overlay
 */
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontFamily } from '@/constants/theme';

export interface FloatingTab {
  id: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  badge?: boolean;
}

interface FloatingTabBarProps {
  tabs: FloatingTab[];
  activeTab: string;
  onTabPress: (id: string) => void;
}

interface TabItemProps {
  tab: FloatingTab;
  isActive: boolean;
  onPress: () => void;
}

function TabItem({ tab, isActive, onPress }: TabItemProps) {
  const pillScale = useSharedValue(isActive ? 1 : 0.75);
  const pillOpacity = useSharedValue(isActive ? 1 : 0);
  const iconY = useSharedValue(isActive ? -5 : 0);
  const labelOpacity = useSharedValue(isActive ? 1 : 0);
  const labelY = useSharedValue(isActive ? 0 : 4);

  useEffect(() => {
    pillScale.value = withSpring(isActive ? 1 : 0.75, {
      damping: 18,
      stiffness: 220,
      mass: 0.8,
    });
    pillOpacity.value = withTiming(isActive ? 1 : 0, { duration: 350 });
    iconY.value = withSpring(isActive ? -5 : 0, { damping: 15, stiffness: 200 });
    labelOpacity.value = withTiming(isActive ? 1 : 0, { duration: 250 });
    labelY.value = withSpring(isActive ? 0 : 4, { damping: 15, stiffness: 200 });
  }, [isActive, pillScale, pillOpacity, iconY, labelOpacity, labelY]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: pillOpacity.value,
    transform: [{ scale: pillScale.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: iconY.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    transform: [{ translateY: labelY.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tabItem, pressed && { opacity: 0.85 }]}
    >
      {/* Amber gradient pill — scales in from 0.75 */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.pillWrap, pillStyle]}>
        <LinearGradient
          colors={['#ffc06e', '#d08036']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Inner top highlight: inset 0 1px 0 rgba(255,255,255,0.45) */}
        <View style={styles.pillTopHighlight} />
      </Animated.View>

      {/* Badge (new items indicator) */}
      {tab.badge && !isActive && <View style={styles.badge} />}

      {/* Icon — centered, rises when active */}
      <Animated.View style={[styles.iconWrap, iconStyle]}>
        <tab.Icon
          size={22}
          color={isActive ? '#1a0d02' : 'rgba(247,243,236,0.4)'}
          strokeWidth={2}
        />
      </Animated.View>

      {/* Label — absolute at bottom, fades in when active */}
      <Animated.Text
        style={[styles.label, isActive && styles.labelActive, labelStyle]}
        numberOfLines={1}
      >
        {tab.label}
      </Animated.Text>
    </Pressable>
  );
}

export function FloatingTabBar({ tabs, activeTab, onTabPress }: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.navWrap, { bottom: insets.bottom + 22 }]}
      pointerEvents="box-none"
    >
      {/* Shadow wrapper — outside overflow:hidden so shadow renders */}
      <View style={styles.navShadow}>
        <View style={styles.nav}>
          {/* Blur — real blur(48px) on iOS */}
          {Platform.OS === 'ios' ? (
            <BlurView
              intensity={55}
              tint="dark"
              style={[StyleSheet.absoluteFill, { borderRadius: 34 }]}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.androidBg, { borderRadius: 34 }]} />
          )}

          {/* Dark overlay: rgba(18,20,26,0.52) */}
          <View style={[StyleSheet.absoluteFill, styles.darkOverlay, { borderRadius: 34 }]} />

          {/* Top reflet — gradient line (no solid line):
              transparent → rgba(255,255,255,0.22) → transparent
              left 10% right 10% height 1px */}
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.22)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topReflet}
          />

          {/* Tab items */}
          {tabs.map((tab) => (
            <TabItem
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTab}
              onPress={() => onTabPress(tab.id)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navWrap: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 100,
    pointerEvents: 'box-none',
  },
  navShadow: {
    borderRadius: 34,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.7,
    shadowRadius: 30,
    elevation: 20,
  },
  nav: {
    height: 68,
    borderRadius: 34,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
  },
  androidBg: {
    backgroundColor: 'rgba(14,16,20,0.98)',
  },
  darkOverlay: {
    backgroundColor: 'rgba(18,20,26,0.45)',
  },
  topReflet: {
    position: 'absolute',
    top: 0,
    left: '10%',
    right: '10%',
    height: 1,
    zIndex: 10,
  },
  tabItem: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  pillWrap: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  pillTopHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: '50%',
    marginLeft: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#7fb89e',
    zIndex: 2,
    shadowColor: '#7fb89e',
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    bottom: 5,
    fontFamily: FontFamily.sansBold,
    fontSize: 10,
    letterSpacing: 0.2,
    color: 'rgba(247,243,236,0.4)',
  },
  labelActive: {
    color: '#1a0d02',
  },
});
