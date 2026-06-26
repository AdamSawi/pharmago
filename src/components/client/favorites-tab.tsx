import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconPharmacie, IconStar } from '@/components/icons';
import { GlassCard } from '@/components/ui/glass-card';
import { SkeletonList } from '@/components/ui/skeleton-loader';
import { FontFamily, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { listenFavorites, removeFavorite, type FavoriteDoc } from '@/services/favorites';

function FavoriteCard({
  favorite,
  onPress,
  onRemove,
  colors,
  styles,
}: {
  favorite: FavoriteDoc;
  onPress: () => void;
  onRemove: () => void;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.82 }}>
      <GlassCard style={styles.card}>
        <View style={styles.iconWrap}>
          <IconPharmacie size={24} color={colors.amberBright} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{favorite.pharmacyName}</Text>
          <Text style={styles.addr} numberOfLines={1}>{favorite.pharmacyAddress}</Text>
        </View>
        <Pressable onPress={onRemove} hitSlop={8}>
          <IconStar size={19} color={colors.amberBright} strokeWidth={0} />
        </Pressable>
      </GlassCard>
    </Pressable>
  );
}

export function FavoritesTab() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [favorites, setFavorites] = useState<FavoriteDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = listenFavorites(user.uid, (data) => {
      setFavorites(data);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Favoris</Text>

        {loading ? (
          <SkeletonList />
        ) : (
          <View style={styles.list}>
            {favorites.map((f) => (
              <FavoriteCard
                key={f.id}
                favorite={f}
                onRemove={() => removeFavorite(f.id).catch(() => {})}
                onPress={() =>
                  router.push({
                    pathname: '/(client)/order' as never,
                    params: { pharmacyId: f.pharmacyId, pharmacyName: f.pharmacyName },
                  })
                }
                colors={colors}
                styles={styles}
              />
            ))}
            {favorites.length === 0 && (
              <Text style={styles.emptyText}>
                Aucune pharmacie favorite — touchez l'étoile sur une pharmacie pour l'ajouter ici.
              </Text>
            )}
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
    heading: {
      fontFamily: FontFamily.serif,
      fontSize: 27,
      color: colors.text.primary,
      letterSpacing: -0.27,
      marginBottom: 20,
    },
    list: { gap: 10 },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
      padding: 14,
      borderRadius: Radius.lg,
    },
    iconWrap: {
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
    info: { flex: 1, gap: 3 },
    name: {
      fontFamily: FontFamily.sansBold,
      fontSize: 14.5,
      color: colors.text.primary,
    },
    addr: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 12,
      color: colors.text.tertiary,
    },
    emptyText: {
      fontFamily: FontFamily.sans,
      fontSize: 13.5,
      color: colors.text.tertiary,
      textAlign: 'center',
      paddingTop: 40,
      lineHeight: 20,
    },
  });
}
