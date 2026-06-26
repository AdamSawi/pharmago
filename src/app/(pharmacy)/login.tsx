import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AmbientBackground } from '@/components/ambient-background';
import {
  IconArrowRight,
  IconFingerprint,
  IconPharmacie,
} from '@/components/icons';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { FontFamily, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { signIn } from '@/services/auth';
import { validateEmail, validatePassword } from '@/utils/validation';

function LoginOrb({ styles }: { styles: ReturnType<typeof createStyles> }) {
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.6);

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(-6, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    rotate.value = withRepeat(
      withTiming(-3, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    ringScale.value = withRepeat(
      withTiming(1.35, { duration: 3000, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
    ringOpacity.value = withRepeat(
      withTiming(0, { duration: 3000, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
  }, [translateY, rotate, ringScale, ringOpacity]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { rotate: `${rotate.value}deg` }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  return (
    <View style={styles.orbWrap}>
      {/* Pulse ring */}
      <Animated.View style={[styles.orbRing, ringStyle]} />
      {/* Orb with gradient */}
      <Animated.View style={orbStyle}>
        <LinearGradient
          colors={['#ffc06e', '#b9701f']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.orb}
        >
          <IconPharmacie size={36} color="#1a0f02" />
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

function RolePill({ styles }: { styles: ReturnType<typeof createStyles> }) {
  const dotOpacity = useSharedValue(1);

  useEffect(() => {
    dotOpacity.value = withRepeat(
      withTiming(0.3, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [dotOpacity]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: dotOpacity.value }));

  return (
    <View style={styles.pill}>
      <Animated.View style={[styles.pillDot, dotStyle]} />
      <Text style={styles.pillText}>Espace pharmacie</Text>
    </View>
  );
}

export default function PharmacyLoginScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string | null; password?: string | null }>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const faceScale = useSharedValue(1);
  const faceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: faceScale.value }],
  }));

  async function handleLogin() {
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    if (emailErr || passErr) {
      setFieldErrors({ email: emailErr, password: passErr });
      return;
    }
    setFieldErrors({});
    setFormError('');
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/(pharmacy)' as never);
    } catch {
      setFormError('Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 28 }]}>
      <AmbientBackground />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <LoginOrb styles={styles} />
        <RolePill styles={styles} />

        {/* Title block — vertical gap ensures NO text overlap (bug de la maquette corrigé) */}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>
            {'Bon retour,\n'}
            <Text style={styles.titleItalic}>Lumière</Text>
            {' Pharmacie'}
          </Text>
          <Text style={styles.subtitle}>
            Connectez-vous pour gérer vos commandes et suivre vos livraisons en temps réel.
          </Text>
        </View>

        <TextField
          label="Email"
          value={email}
          onChangeText={(t) => { setEmail(t); setFieldErrors((e) => ({ ...e, email: null })); }}
          error={fieldErrors.email}
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="next"
        />
        <TextField
          label="Mot de passe"
          value={password}
          onChangeText={(t) => { setPassword(t); setFieldErrors((e) => ({ ...e, password: null })); }}
          error={fieldErrors.password}
          secureTextEntry
          placeholder="••••••••"
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />

        <Pressable onPress={() => router.push('/forgot-password' as never)} style={styles.forgotLink}>
          <Text style={styles.forgotLinkText}>Mot de passe oublié ?</Text>
        </Pressable>

        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

        <PrimaryButton
          label="Se connecter"
          onPress={handleLogin}
          loading={loading}
          style={styles.loginBtn}
          icon={<IconArrowRight size={16} color="#221204" strokeWidth={2.3} />}
        />

        <Animated.View style={[styles.biometric, faceStyle]}>
          <Pressable
            style={styles.biometricInner}
            onPressIn={() => {
              faceScale.value = withSpring(0.95, { damping: 15 });
            }}
            onPressOut={() => {
              faceScale.value = withSpring(1, { damping: 15 });
            }}
          >
            <IconFingerprint size={18} color={colors.text.tertiary} strokeWidth={1.6} />
            <Text style={styles.biometricText}>Face ID</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg.surface,
    },
    content: {
      paddingHorizontal: Spacing.xl,
    },
    orbWrap: {
      width: 78,
      height: 78,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    orbRing: {
      position: 'absolute',
      width: 98,
      height: 98,
      borderRadius: 32,
      borderWidth: 1,
      borderColor: 'rgba(235,162,78,0.3)',
    },
    orb: {
      width: 78,
      height: 78,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#ffc06e',
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.55,
      shadowRadius: 20,
      elevation: 12,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      backgroundColor: colors.sageSoft,
      borderWidth: 1,
      borderColor: 'rgba(127,184,158,0.3)',
      borderRadius: Radius.pill,
      paddingVertical: 8,
      paddingHorizontal: 15,
      alignSelf: 'flex-start',
      marginBottom: 22,
    },
    pillDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#8fe0b8',
      shadowColor: '#8fe0b8',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 6,
    },
    pillText: {
      fontFamily: FontFamily.sansBold,
      fontSize: 12,
      color: '#a9d8c1',
      letterSpacing: 0.3,
    },
    titleBlock: {
      gap: 10,
      marginBottom: 34,
    },
    title: {
      fontFamily: FontFamily.serif,
      fontSize: 36,
      lineHeight: 39,
      letterSpacing: -0.5,
      color: colors.text.primary,
    },
    titleItalic: {
      fontFamily: FontFamily.serifItalic,
      color: colors.amberBright,
    },
    subtitle: {
      fontFamily: FontFamily.sans,
      fontSize: 14.5,
      color: colors.text.secondary,
      lineHeight: 22,
      maxWidth: 280,
    },
    loginBtn: {
      marginTop: 16,
      marginBottom: 0,
    },
    forgotLink: {
      alignSelf: 'flex-end',
      paddingVertical: 6,
      marginBottom: 4,
    },
    forgotLinkText: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 12.5,
      color: colors.text.tertiary,
    },
    errorText: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 13,
      color: '#f87171',
      marginBottom: 12,
    },
    biometric: {
      marginTop: 22,
      alignSelf: 'center',
    },
    biometricInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    biometricText: {
      fontFamily: FontFamily.sansSemiBold,
      fontSize: 12.5,
      color: colors.text.tertiary,
    },
  });
}
