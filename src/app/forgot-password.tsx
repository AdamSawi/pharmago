import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AmbientBackground } from '@/components/ambient-background';
import { IconChevronLeft } from '@/components/icons';
import { GlassCard } from '@/components/ui/glass-card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { FontFamily, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { requestPasswordReset } from '@/services/auth';
import { validateEmail } from '@/utils/validation';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }
    setEmailError(null);
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
    } catch {
      // Intentionally silent — don't reveal whether the email exists
    } finally {
      setLoading(false);
      setSent(true);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <AmbientBackground />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topbar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <IconChevronLeft size={18} color={colors.text.secondary} strokeWidth={2.2} />
          </Pressable>
          <Text style={styles.heading}>Mot de passe oublié</Text>
          <View style={styles.backBtn} />
        </View>

        {sent ? (
          <GlassCard strong style={styles.card}>
            <Text style={styles.sentTitle}>Vérifiez votre boîte mail</Text>
            <Text style={styles.sentText}>
              Si cet email est associé à un compte PharmaGo, vous recevrez un lien de
              réinitialisation dans quelques minutes.
            </Text>
          </GlassCard>
        ) : (
          <GlassCard strong style={styles.card}>
            <Text style={styles.intro}>
              Saisissez votre email et nous vous envoyons un lien pour réinitialiser votre mot de passe.
            </Text>
            <TextField
              label="Email"
              value={email}
              onChangeText={(t) => { setEmail(t); setEmailError(null); }}
              error={emailError}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <PrimaryButton label="Envoyer le lien" onPress={handleSend} loading={loading} style={styles.sendBtn} />
          </GlassCard>
        )}

        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Retour à la connexion</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg.surface },
    content: { paddingHorizontal: Spacing.xl },
    topbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 28,
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
    },
    heading: {
      fontFamily: FontFamily.serif,
      fontSize: 18,
      color: colors.text.primary,
    },
    card: {
      padding: 20,
      borderRadius: Radius.lg,
      gap: 4,
    },
    intro: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 13.5,
      color: colors.text.secondary,
      lineHeight: 20,
      marginBottom: 16,
    },
    sendBtn: { marginTop: 8 },
    sentTitle: {
      fontFamily: FontFamily.serif,
      fontSize: 19,
      color: colors.text.primary,
      marginBottom: 8,
    },
    sentText: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 13.5,
      color: colors.text.secondary,
      lineHeight: 20,
    },
    backLink: {
      alignItems: 'center',
      paddingVertical: 18,
    },
    backLinkText: {
      fontFamily: FontFamily.sansBold,
      fontSize: 13,
      color: colors.text.tertiary,
    },
  });
}
