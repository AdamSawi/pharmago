/**
 * Generic Apple Store style bottom sheet shell — spring slide-up, swipe-down-to-close,
 * BlurView + dark glass fill. Used by ProfileSheet and AddressPickerSheet.
 */
import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import { Dimensions, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const OPEN_EASING = Easing.bezier(0.25, 0.46, 0.45, 0.94);
const CLOSE_EASING = Easing.bezier(0.55, 0, 1, 0.45);

const OFFSCREEN_Y = Dimensions.get('window').height;

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const translateY = useSharedValue(OFFSCREEN_Y);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.value = withTiming(0, { duration: 320, easing: OPEN_EASING });
    } else if (mounted) {
      translateY.value = withTiming(OFFSCREEN_Y, { duration: 280, easing: CLOSE_EASING }, () => {
        runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > 80) {
        translateY.value = withTiming(OFFSCREEN_Y, { duration: 280, easing: CLOSE_EASING }, () => {
          runOnJS(onClose)();
        });
      } else {
        translateY.value = withTiming(0, { duration: 320, easing: OPEN_EASING });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, 1 - translateY.value / OFFSCREEN_Y) * 0.5,
  }));

  if (!mounted) return null;

  return (
    // Rendered via RN's Modal — it mounts in its own native layer above
    // everything else, including the FloatingTabBar. A plain absolute View
    // here would stay trapped inside the calling tab's stacking context,
    // which sits behind the navbar's sibling-level zIndex regardless of any
    // zIndex set on this component (sheet content like a bottom "Appliquer"
    // button would render but be unclickable under the navbar).
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <GestureHandlerRootView style={styles.fill}>
        <View style={[StyleSheet.absoluteFill, styles.root]} pointerEvents="box-none">
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
            <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]} />
          </Pressable>

          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }, sheetStyle]}>
              {Platform.OS === 'ios' ? (
                <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
              ) : (
                <View style={[StyleSheet.absoluteFill, styles.androidBg]} />
              )}
              <View style={styles.fillTint} />
              <View style={styles.handle} />
              {children}
            </Animated.View>
          </GestureDetector>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  root: {
    zIndex: 1000,
    elevation: 1000,
  },
  overlay: {
    backgroundColor: '#000',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  androidBg: {
    backgroundColor: 'rgba(12,13,17,0.98)',
  },
  fillTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16,18,24,0.97)',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
});
