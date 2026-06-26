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
import { IconArrowRight, IconBag, IconChevronLeft } from '@/components/icons';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { FontFamily, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { signUp } from '@/services/auth';
import { validateEmail, validatePassword, validateRequired } from '@/utils/validation';

function RegisterOrb({ styles }: { styles: ReturnType<typeof createStyles> }) {
  const translateY = useSharedValue(0);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.6);

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(-6, { duration: 2800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    ringScale.value = withRepeat(
      withTiming(1.35, { duration: 3200, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
    ringOpacity.value = withRepeat(
      withTiming(0, { duration: 3200, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
  }, [translateY, ringScale, ringOpacity]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  return (
    <View style={styles.orbWrap}>
      <Animated.View style={[styles.orbRing, ringStyle]} />
      <Animated.View style={orbStyle}>
        <LinearGradient
          colors={['#7fb89e', '#3d7a60']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.orb}
        >
          <IconBag size={36} color="#01160d" strokeWidth={1.8} />
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string | null;
    email?: string | null;
    password?: string | null;
  }>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fade-in animation for the form
  const contentOpacity = useSharedValue(0);
  const contentY = useSharedValue(16);
  useEffect(() => {
    contentOpacity.value = withTiming(1, { duration: 500 });
    contentY.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) });
  }, [contentOpacity, contentY]);
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentY.value }],
  }));

  async function handleRegister() {
    console.log('[register] handleRegister called', { name, email });
    const nameErr = validateRequired(name);
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    if (nameErr || emailErr || passErr) {
      setFieldErrors({ name: nameErr, email: emailErr, password: passErr });
      return;
    }
    setFieldErrors({});
    setFormError('');
    setLoading(true);
    try {
      await signUp(email.trim(), password, name.trim(), 'client');
      router.replace('/(client)');
    } catch (err: any) {
      console.log('[register] signUp failed', err?.code, err?.message);
      if (err?.code === 'auth/email-already-in-use') {
        setFieldErrors((e) => ({ ...e, email: 'Cet email est déjà utilisé.' }));
      } else if (err?.code === 'auth/weak-password') {
        setFieldErrors((e) => ({ ...e, password: 'Mot de passe trop faible (6 caractères minimum).' }));
      } else if (err?.code === 'auth/invalid-email') {
        setFieldErrors((e) => ({ ...e, email: 'Email invalide.' }));
      } else {
        setFormError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <AmbientBackground />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back button */}
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <IconChevronLeft size={18} color={colors.text.secondary} strokeWidth={2.2} />
        </Pressable>

        <View style={styles.orbSection}>
          <RegisterOrb styles={styles} />
        </View>

        {/* Pill */}
        <View style={styles.pill}>
          <View style={styles.pillDot} />
          <Text style={styles.pillText}>Nouveau compte</Text>
        </View>

        {/* Title */}
        <Animated.View style={[styles.titleBlock, contentStyle]}>
          <Text style={styles.title}>
            {'Créez votre\n'}
            <Text style={styles.titleItalic}>espace client</Text>
          </Text>
          <Text style={styles.subtitle}>
            Commandez vos médicaments et suivez vos livraisons en temps réel.
          </Text>
        </Animated.View>

        {/* Form */}
        <Animated.View style={contentStyle}>
          <TextField
            label="Prénom"
            value={name}
            onChangeText={(t) => { setName(t); setFieldErrors((e) => ({ ...e, name: null })); }}
            error={fieldErrors.name}
            autoCapitalize="words"
            returnKeyType="next"
          />
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
            placeholder="6 caractères minimum"
            returnKeyType="done"
            onSubmitEditing={handleRegister}
          />

          {formError ? <Text style={styles.formError}>{formError}</Text> : null}

          <PrimaryButton
            label="Créer mon compte"
            onPress={handleRegister}
            loading={loading}
            style={styles.submitBtn}
            icon={<IconArrowRight size={16} color="#221204" strokeWidth={2.3} />}
          />

          <Pressable
            onPress={() => router.back()}
            style={styles.loginLink}
          >
            <Text style={styles.loginLinkText}>
              Déjà un compte ?{' '}
              <Text style={styles.loginLinkAccent}>Se connecter</Text>
            </Text>
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
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor: colors.bg.card,
      borderWidth: 1,
      borderColor: colors.border.glass,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    orbSection: {
      marginBottom: 20,
    },
    orbWrap: {
      width: 78,
      height: 78,
      alignItems: 'center',
      justifyContent: 'center',
    },
    orbRing: {
      position: 'absolute',
      width: 98,
      height: 98,
      borderRadius: 32,
      borderWidth: 1,
      borderColor: 'rgba(127,184,158,0.3)',
    },
    orb: {
      width: 78,
      height: 78,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#7fb89e',
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
      marginBottom: 30,
    },
    title: {
      fontFamily: FontFamily.serif,
      fontSize: 36,
      lineHeight: 40,
      letterSpacing: -0.5,
      color: colors.text.primary,
    },
    titleItalic: {
      fontFamily: FontFamily.serifItalic,
      color: colors.sageBright,
    },
    subtitle: {
      fontFamily: FontFamily.sans,
      fontSize: 14.5,
      color: colors.text.secondary,
      lineHeight: 22,
      maxWidth: 280,
    },
    submitBtn: {
      marginTop: 8,
    },
    formError: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 13,
      color: '#f87171',
      marginBottom: 12,
    },
    loginLink: {
      marginTop: 20,
      alignSelf: 'center',
      paddingVertical: 6,
    },
    loginLinkText: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 13.5,
      color: colors.text.tertiary,
    },
    loginLinkAccent: {
      fontFamily: FontFamily.sansBold,
      color: colors.sageBright,
    },
  });
}
