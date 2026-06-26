import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AmbientBackground } from '@/components/ambient-background';
import {
  IconBuilding,
  IconBag,
  IconChevronRight,
  IconScooter,
} from '@/components/icons';
import { FontFamily, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface RoleCard {
  role: 'pharmacy' | 'client' | 'delivery';
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  title: string;
  subtitle: string;
  accentColor: string;
}

function getRoles(colors: ThemeColors): RoleCard[] {
  return [
    {
      role: 'pharmacy',
      Icon: IconBuilding,
      title: 'Pharmacie',
      subtitle: 'Gérer les commandes & livraisons',
      accentColor: colors.amberBright,
    },
    {
      role: 'client',
      Icon: IconBag,
      title: 'Client',
      subtitle: 'Commander vos médicaments',
      accentColor: colors.sageBright,
    },
    {
      role: 'delivery',
      Icon: IconScooter,
      title: 'Livreur',
      subtitle: 'Gérer vos livraisons en temps réel',
      accentColor: '#a78bfa',
    },
  ];
}

function AnimatedRoleCard({ card, index }: { card: RoleCard; index: number }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(24);

  useEffect(() => {
    opacity.value = withDelay(index * 100 + 200, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(
      index * 100 + 200,
      withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }),
    );
  }, [index, opacity, translateY]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  function navigate() {
    if (card.role === 'pharmacy') router.push('/(pharmacy)/login');
    else if (card.role === 'client') router.push('/(client)/login' as never);
    else router.push('/(delivery)/login' as never);
  }

  return (
    <Animated.View style={containerStyle}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        onPress={navigate}
        style={styles.roleCard}
      >
        <View style={[styles.roleIconWrap, { backgroundColor: `${card.accentColor}1a` }]}>
          <card.Icon size={24} color={card.accentColor} strokeWidth={1.8} />
        </View>
        <View style={styles.roleInfo}>
          <Text style={styles.roleTitle}>{card.title}</Text>
          <Text style={styles.roleSub}>{card.subtitle}</Text>
        </View>
        <IconChevronRight size={16} color={card.accentColor} strokeWidth={2} />
      </Pressable>
    </Animated.View>
  );
}

export default function RoleSelectionScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const roles = useMemo(() => getRoles(colors), [colors]);

  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(16);

  useEffect(() => {
    titleOpacity.value = withTiming(1, { duration: 500 });
    titleY.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) });
  }, [titleOpacity, titleY]);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.xxl }]}>
      <AmbientBackground />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={titleStyle}>
          {/* PharmaGo badge */}
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>PharmaGo</Text>
          </View>
          <Text style={styles.title}>
            {'Bienvenue,\n'}
            <Text style={styles.titleAccent}>choisissez{'\n'}votre espace</Text>
          </Text>
          <Text style={styles.subtitle}>
            Sélectionnez votre rôle pour accéder à votre interface dédiée.
          </Text>
        </Animated.View>

        <View style={styles.cards}>
          {roles.map((card, i) => (
            <AnimatedRoleCard key={card.role} card={card} index={i} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg.deep,
    },
    content: {
      paddingHorizontal: Spacing.xl,
      gap: Spacing.lg,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      backgroundColor: colors.amberSoft,
      borderWidth: 1,
      borderColor: 'rgba(235,162,78,0.3)',
      borderRadius: Radius.pill,
      paddingVertical: 8,
      paddingHorizontal: 15,
      alignSelf: 'flex-start',
      marginBottom: 22,
    },
    badgeDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.amberBright,
    },
    badgeText: {
      fontFamily: FontFamily.sansBold,
      fontSize: 12,
      color: colors.amberBright,
      letterSpacing: 0.3,
    },
    title: {
      fontFamily: FontFamily.serif,
      fontSize: 38,
      lineHeight: 44,
      letterSpacing: -0.5,
      color: colors.text.primary,
      marginBottom: 10,
    },
    titleAccent: {
      fontFamily: FontFamily.serifItalic,
      color: colors.amberBright,
    },
    subtitle: {
      fontFamily: FontFamily.sans,
      fontSize: 14.5,
      color: colors.text.secondary,
      lineHeight: 22,
      marginBottom: 34,
      maxWidth: 270,
    },
    cards: {
      gap: Spacing.sm + 1,
    },
    roleCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
      backgroundColor: colors.bg.card,
      borderWidth: 1,
      borderColor: colors.border.glass,
      borderRadius: Radius.lg,
      padding: 16,
    },
    roleIconWrap: {
      width: 52,
      height: 52,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    roleInfo: {
      flex: 1,
    },
    roleTitle: {
      fontFamily: FontFamily.sansBold,
      fontSize: 16,
      color: colors.text.primary,
      marginBottom: 3,
    },
    roleSub: {
      fontFamily: FontFamily.sans,
      fontSize: 12.5,
      color: colors.text.secondary,
    },
  });
}
