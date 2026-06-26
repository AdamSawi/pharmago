import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconMapPin, IconPharmacie, IconSearch, IconStar } from '@/components/icons';
import { GlassCard } from '@/components/ui/glass-card';
import { SkeletonList } from '@/components/ui/skeleton-loader';
import { FontFamily, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { addFavorite, listenFavorites, removeFavorite, type FavoriteDoc } from '@/services/favorites';
import { getPharmacies, type PharmacyDoc } from '@/services/pharmacies';

function PharmacyCard({
  pharmacy,
  isFavorite,
  onPress,
  onToggleFavorite,
  colors,
  styles,
}: {
  pharmacy: PharmacyDoc;
  isFavorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.82 }}>
      <GlassCard style={styles.pharmCard}>
        <View style={styles.pharmIconWrap}>
          <IconPharmacie size={24} color={colors.amberBright} />
        </View>
        <View style={styles.pharmInfo}>
          <Text style={styles.pharmName} numberOfLines={1}>
            {pharmacy.name}
          </Text>
          <Text style={styles.pharmAddr} numberOfLines={1}>
            {pharmacy.address}
          </Text>
          <View style={styles.pharmMeta}>
            <View style={[styles.statusDot, { backgroundColor: pharmacy.isOpen ? colors.sage : colors.text.tertiary }]} />
            <Text style={[styles.pharmStatus, { color: pharmacy.isOpen ? colors.sageBright : colors.text.tertiary }]}>
              {pharmacy.isOpen ? 'Ouvert' : 'Fermé'}
            </Text>
          </View>
        </View>
        <View style={styles.pharmRight}>
          <View style={styles.ratingRow}>
            <IconStar size={11} color={colors.amberBright} strokeWidth={0} />
            <Text style={styles.ratingText}>{(pharmacy.rating ?? 0).toFixed(1)}</Text>
          </View>
          <Pressable onPress={onToggleFavorite} hitSlop={8}>
            <IconStar size={17} color={isFavorite ? colors.amberBright : colors.text.tertiary} strokeWidth={isFavorite ? 0 : 1.6} />
          </Pressable>
        </View>
      </GlassCard>
    </Pressable>
  );
}

export function PharmaciesTab() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [pharmacies, setPharmacies] = useState<PharmacyDoc[]>([]);
  const [favorites, setFavorites] = useState<FavoriteDoc[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPharmacies().then(setPharmacies).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = listenFavorites(user.uid, setFavorites);
    return unsub;
  }, [user]);

  function toggleFavorite(pharmacy: PharmacyDoc) {
    if (!user) return;
    const existing = favorites.find((f) => f.pharmacyId === pharmacy.id);
    if (existing) {
      removeFavorite(existing.id).catch(() => {});
    } else {
      addFavorite(user.uid, pharmacy.id, pharmacy.name, pharmacy.address).catch(() => {});
    }
  }

  const filtered = pharmacies.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.topbar}>
          <View>
            <Text style={styles.subGreet}>Bonjour,</Text>
            <Text style={styles.heading}>
              <Text style={styles.headingItalic}>{user?.name?.split(' ')[0] ?? 'Vous'}</Text>
            </Text>
          </View>
        </View>

        {/* Search bar */}
        <GlassCard style={styles.searchBar}>
          <IconSearch size={17} color={colors.text.tertiary} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une pharmacie…"
            placeholderTextColor={colors.text.tertiary}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </GlassCard>

        {/* Section header */}
        <Text style={styles.sectionLabel}>À proximité</Text>

        {/* Pharmacy list */}
        {loading ? (
          <SkeletonList />
        ) : (
          <View style={styles.list}>
            {filtered.map((pharmacy) => (
              <PharmacyCard
                key={pharmacy.id}
                pharmacy={pharmacy}
                isFavorite={favorites.some((f) => f.pharmacyId === pharmacy.id)}
                onToggleFavorite={() => toggleFavorite(pharmacy)}
                colors={colors}
                styles={styles}
                onPress={() =>
                  router.push({
                    pathname: '/(client)/order' as never,
                    params: { pharmacyId: pharmacy.id, pharmacyName: pharmacy.name },
                  })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1 },
    content: { paddingHorizontal: Spacing.xl },
    topbar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    subGreet: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 12.5,
      color: colors.text.tertiary,
      marginBottom: 2,
    },
    heading: {
      fontFamily: FontFamily.serif,
      fontSize: 30,
      color: colors.text.primary,
      letterSpacing: -0.3,
    },
    headingItalic: {
      fontFamily: FontFamily.serifMediumItalic,
      color: colors.amberBright,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 24,
      borderRadius: Radius.lg,
    },
    searchInput: {
      flex: 1,
      fontFamily: FontFamily.sansMedium,
      fontSize: 15,
      color: colors.text.primary,
    },
    sectionLabel: {
      fontFamily: FontFamily.sansExtraBold,
      fontSize: 11,
      color: colors.text.tertiary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 12,
    },
    list: {
      gap: 10,
    },
    pharmCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
      padding: 14,
      borderRadius: Radius.lg,
    },
    pharmIconWrap: {
      width: 46,
      height: 46,
      borderRadius: 14,
      backgroundColor: colors.amberSoft,
      borderWidth: 1,
      borderColor: 'rgba(235,162,78,0.22)',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    pharmInfo: {
      flex: 1,
      gap: 3,
    },
    pharmName: {
      fontFamily: FontFamily.sansBold,
      fontSize: 14.5,
      color: colors.text.primary,
    },
    pharmAddr: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 12,
      color: colors.text.tertiary,
    },
    pharmMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 2,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    pharmStatus: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 11.5,
    },
    pharmRight: {
      alignItems: 'flex-end',
      gap: 5,
      flexShrink: 0,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    ratingText: {
      fontFamily: FontFamily.sansBold,
      fontSize: 11.5,
      color: colors.amberBright,
    },
  });
}
