/**
 * ProfileSheet — Apple Store style profile menu, opened from the header avatar.
 */
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IconCard, IconChat, IconChevronRight, IconMapPin, IconMoon, IconSun, IconTabOfficine } from '@/components/icons';
import { Avatar } from '@/components/ui/avatar';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { StatsRow } from '@/components/ui/profile-extra-fields';
import { FontFamily, Radius, type ThemeColors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { signOut, type UserRole } from '@/services/auth';
import { getClientStats, getDeliveryStats, getPharmacyStats } from '@/services/orders';

const GROUP_PATH: Record<UserRole, string> = {
  client: '/(client)',
  pharmacy: '/(pharmacy)',
  delivery: '/(delivery)',
};

interface ProfileSheetProps {
  visible: boolean;
  onClose: () => void;
  role: UserRole;
  onOpenMessages?: () => void;
}

function SheetRow({
  Icon,
  label,
  onPress,
  colors,
  styles,
}: {
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  onPress: () => void;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      <Icon size={18} color={colors.text.secondary} strokeWidth={1.8} />
      <Text style={styles.rowLabel}>{label}</Text>
      <IconChevronRight size={13} color={colors.text.tertiary} strokeWidth={2} />
    </Pressable>
  );
}

export function ProfileSheet({ visible, onClose, role, onOpenMessages }: ProfileSheetProps) {
  const { user } = useAuth();
  const { colors, mode, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [statItems, setStatItems] = useState<{ label: string; value: string }[] | null>(null);

  useEffect(() => {
    if (!visible || !user) return;
    setStatItems(null);
    if (role === 'client') {
      getClientStats(user.uid).then((s) => setStatItems([
        { label: 'Commandes', value: String(s.orderCount) },
        { label: 'Dépensé', value: `${Math.round(s.totalSpent)}€` },
        { label: 'Pharmacie favorite', value: s.favoritePharmacy ?? '—' },
      ])).catch(() => setStatItems(null));
    } else if (role === 'pharmacy') {
      getPharmacyStats(user.uid).then((s) => setStatItems([
        { label: 'Commandes', value: String(s.orderCount) },
        { label: 'CA total', value: `${Math.round(s.totalRevenue)}€` },
        { label: 'Statut', value: user.isOpen ? 'Ouvert' : 'Fermé' },
      ])).catch(() => setStatItems(null));
    } else {
      getDeliveryStats(user.uid).then((s) => setStatItems([
        { label: 'Livraisons', value: String(s.totalDeliveries) },
        { label: 'Gains', value: `${Math.round(s.totalEarnings)}€` },
        { label: 'Note', value: user.rating ? `${user.rating}⭐` : '—' },
      ])).catch(() => setStatItems(null));
    }
  }, [visible, user, role]);

  function go(path: string) {
    onClose();
    router.push(path as never);
  }

  function handleMessages() {
    onClose();
    onOpenMessages?.();
  }

  async function handleSignOut() {
    onClose();
    try {
      // Navigation back to "/" is handled by the root layout's auth effect
      // once `user` turns null — an explicit router.replace() here would
      // race it (still-stale `user` redirects straight back into the role).
      await signOut();
    } catch {
      // already signed out / network error — nothing actionable here
    }
  }

  const groupPath = GROUP_PATH[role];

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.profileRow}>
        <Avatar name={user?.name} role={role} size={64} />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName} numberOfLines={1}>{user?.name ?? '—'}</Text>
          <Text style={styles.profileEmail} numberOfLines={1}>{user?.email ?? '—'}</Text>
        </View>
      </View>

      {statItems && (
        <View style={styles.statsWrap}>
          <StatsRow items={statItems} valueColor={colors.amberBright} />
        </View>
      )}

      <View style={styles.separator} />

      <SheetRow Icon={IconTabOfficine} label="Mes informations" onPress={() => go(`${groupPath}/mes-informations`)} colors={colors} styles={styles} />
      {role !== 'delivery' && (
        <SheetRow Icon={IconMapPin} label="Mes adresses" onPress={() => go(`${groupPath}/mes-adresses`)} colors={colors} styles={styles} />
      )}
      {role === 'client' && (
        <SheetRow Icon={IconCard} label="Mes moyens de paiement" onPress={() => go(`${groupPath}/mes-paiements`)} colors={colors} styles={styles} />
      )}
      <SheetRow Icon={IconChat} label="Mes messages" onPress={handleMessages} colors={colors} styles={styles} />

      <Pressable onPress={toggleTheme} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
        {mode === 'dark' ? (
          <IconMoon size={18} color={colors.text.secondary} strokeWidth={1.8} />
        ) : (
          <IconSun size={18} color={colors.text.secondary} strokeWidth={1.8} />
        )}
        <Text style={styles.rowLabel}>{mode === 'dark' ? 'Mode sombre' : 'Mode clair'}</Text>
        <View style={[styles.themeSwitch, mode === 'dark' && styles.themeSwitchOn]}>
          <View style={[styles.themeSwitchDot, mode === 'dark' && styles.themeSwitchDotOn]} />
        </View>
      </Pressable>

      <View style={styles.separator} />

      <Pressable
        onPress={handleSignOut}
        style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.8 }]}
      >
        <Text style={styles.logoutLabel}>Se déconnecter</Text>
      </Pressable>
    </BottomSheet>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: 24,
      paddingBottom: 20,
    },
    profileInfo: { flex: 1, gap: 3 },
    statsWrap: { paddingHorizontal: 24 },
    profileName: {
      fontFamily: FontFamily.sansBold,
      fontSize: 17,
      color: colors.text.primary,
    },
    profileEmail: {
      fontFamily: FontFamily.sans,
      fontSize: 14,
      color: colors.text.tertiary,
    },
    separator: {
      height: 0.5,
      backgroundColor: colors.border.glass,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      height: 52,
      paddingHorizontal: 24,
    },
    rowLabel: {
      flex: 1,
      fontFamily: FontFamily.sansMedium,
      fontSize: 15,
      color: colors.text.primary,
    },
    themeSwitch: {
      width: 40,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.border.glassStrong,
      padding: 3,
    },
    themeSwitchOn: {
      backgroundColor: colors.amberSoft,
    },
    themeSwitchDot: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.text.tertiary,
    },
    themeSwitchDotOn: {
      backgroundColor: colors.amberBright,
      transform: [{ translateX: 16 }],
    },
    logoutBtn: {
      marginTop: 16,
      marginHorizontal: 24,
      height: 50,
      borderRadius: Radius.md,
      backgroundColor: colors.redSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoutLabel: {
      fontFamily: FontFamily.sansBold,
      fontSize: 15,
      color: colors.red,
    },
  });
}
