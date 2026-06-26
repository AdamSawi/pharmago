import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconBag, IconCheck, IconDocument, IconPlus, IconSearch, IconX } from '@/components/icons';
import { GlassCard } from '@/components/ui/glass-card';
import { SkeletonList } from '@/components/ui/skeleton-loader';
import { FontFamily, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { deleteProducts, listenPharmacyProducts, type ProductDoc } from '@/services/products';

function IconPencil({ size = 15, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ProductCard({
  product,
  selectionMode,
  selected,
  onPress,
  colors,
  styles,
}: {
  product: ProductDoc;
  selectionMode: boolean;
  selected: boolean;
  onPress: () => void;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
}) {
  const inStock = product.stock > 0;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.85 }}>
      <GlassCard style={[styles.card, selected && styles.cardSelectedBorder]}>
        {selected && <View style={[StyleSheet.absoluteFill, styles.cardSelectedTint]} />}

        {selectionMode && (
          <View style={[styles.checkbox, selected && styles.checkboxChecked]}>
            {selected && <IconCheck size={12} color="#221204" strokeWidth={3} />}
          </View>
        )}

        <View style={styles.iconWrap}>
          <IconBag size={20} color={colors.amberBright} strokeWidth={1.7} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
          <View style={styles.metaRow}>
            {product.requiresOrdonnance && (
              <View style={styles.rxBadge}>
                <IconDocument size={11} color={colors.sage} strokeWidth={2} />
                <Text style={styles.rxText}>Ordonnance</Text>
              </View>
            )}
            <View style={styles.stockBadge}>
              <View style={[styles.stockDot, { backgroundColor: inStock ? colors.sageBright : '#f87171' }]} />
              <Text style={[styles.stockText, !inStock && { color: '#f87171' }]}>
                {inStock ? `${product.stock} en stock` : 'Rupture de stock'}
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.price}>{(product.price ?? 0).toFixed(2)} €</Text>
        {!selectionMode && (
          <Pressable onPress={onPress} hitSlop={8} style={styles.editBtn}>
            <IconPencil size={15} color={colors.text.tertiary} />
          </Pressable>
        )}
      </GlassCard>
    </Pressable>
  );
}

export function CatalogueTab() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [products, setProducts] = useState<ProductDoc[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = listenPharmacyProducts(user.uid, (data) => {
      setProducts(data);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  function exitSelectionMode() {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleCardPress(product: ProductDoc) {
    if (selectionMode) {
      toggleSelected(product.id);
    } else {
      router.push({ pathname: '/(pharmacy)/product-form' as never, params: { productId: product.id } });
    }
  }

  function handleDeleteSelected() {
    const count = selectedIds.size;
    if (count === 0) return;
    Alert.alert(
      `Supprimer ${count} médicament${count > 1 ? 's' : ''} ?`,
      'Cette action est définitive.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteProducts([...selectedIds]);
              exitSelectionMode();
            } catch {
              Alert.alert('Erreur', 'La suppression a échoué.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (selectionMode ? 200 : 120) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topbar}>
          <View>
            <Text style={styles.heading}>Catalogue</Text>
            <Text style={styles.sub}>{products.length} produit{products.length > 1 ? 's' : ''}</Text>
          </View>
          {selectionMode ? (
            <View style={styles.topbarActions}>
              <Pressable onPress={exitSelectionMode} style={styles.iconBtn}>
                <IconX size={15} color={colors.text.secondary} strokeWidth={2.2} />
              </Pressable>
            </View>
          ) : (
            <View style={styles.topbarActions}>
              <Pressable
                onPress={() => router.push('/(pharmacy)/product-form' as never)}
                style={styles.iconBtn}
              >
                <IconPlus size={16} color={colors.amberBright} strokeWidth={2.3} />
              </Pressable>
              <Pressable onPress={() => setSelectionMode(true)} style={styles.iconBtn}>
                <IconCheck size={16} color={colors.text.secondary} strokeWidth={2.2} />
              </Pressable>
            </View>
          )}
        </View>

        <GlassCard style={styles.searchBar}>
          <IconSearch size={16} color={colors.text.tertiary} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un médicament…"
            placeholderTextColor={colors.text.tertiary}
            value={search}
            onChangeText={setSearch}
          />
        </GlassCard>

        {loading ? <SkeletonList /> : (
        <View style={styles.list}>
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              selectionMode={selectionMode}
              selected={selectedIds.has(p.id)}
              onPress={() => handleCardPress(p)}
              colors={colors}
              styles={styles}
            />
          ))}
          {filtered.length === 0 && (
            <Text style={styles.emptyText}>Aucun produit dans votre catalogue</Text>
          )}
        </View>
        )}
      </ScrollView>

      {selectionMode && (
        <View style={[styles.selectionBar, { bottom: insets.bottom + 98 }]}>
          <Text style={styles.selectionBarText}>
            {selectedIds.size} produit{selectedIds.size > 1 ? 's' : ''} sélectionné{selectedIds.size > 1 ? 's' : ''}
          </Text>
          <Pressable
            onPress={handleDeleteSelected}
            disabled={selectedIds.size === 0 || deleting}
            style={[styles.deleteBtn, selectedIds.size === 0 && { opacity: 0.4 }]}
          >
            <Text style={styles.deleteBtnText}>{deleting ? 'Suppression…' : 'Supprimer'}</Text>
          </Pressable>
        </View>
      )}
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
      alignItems: 'flex-start',
      marginBottom: 16,
      paddingRight: 56,
    },
    heading: {
      fontFamily: FontFamily.serif,
      fontSize: 27,
      color: colors.text.primary,
      letterSpacing: -0.27,
    },
    sub: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 12.5,
      color: colors.text.tertiary,
      marginTop: 5,
    },
    topbarActions: {
      flexDirection: 'row',
      gap: 8,
    },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bg.card,
      borderWidth: 1,
      borderColor: colors.border.glass,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 16,
      borderRadius: Radius.lg,
    },
    searchInput: {
      flex: 1,
      fontFamily: FontFamily.sansMedium,
      fontSize: 14,
      color: colors.text.primary,
    },
    list: { gap: 9 },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
      padding: 14,
      borderRadius: Radius.lg,
    },
    cardSelectedBorder: {
      borderColor: colors.amber,
    },
    cardSelectedTint: {
      backgroundColor: 'rgba(235,162,78,0.12)',
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.3)',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    checkboxChecked: {
      backgroundColor: colors.amberBright,
      borderColor: colors.amberBright,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: colors.amberSoft,
      borderWidth: 1,
      borderColor: 'rgba(235,162,78,0.22)',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    info: { flex: 1, gap: 5 },
    name: {
      fontFamily: FontFamily.sansBold,
      fontSize: 14,
      color: colors.text.primary,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },
    rxBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.sageSoft,
      borderRadius: Radius.pill,
      paddingVertical: 3,
      paddingHorizontal: 8,
    },
    rxText: {
      fontFamily: FontFamily.sansBold,
      fontSize: 9.5,
      color: colors.sage,
    },
    stockBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    stockDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
    },
    stockText: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 11,
      color: colors.text.tertiary,
    },
    price: {
      fontFamily: FontFamily.serif,
      fontSize: 17,
      color: colors.amberBright,
      flexShrink: 0,
    },
    editBtn: {
      width: 30,
      height: 30,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bg.card,
      borderWidth: 1,
      borderColor: colors.border.glass,
      flexShrink: 0,
    },
    emptyText: {
      fontFamily: FontFamily.sans,
      fontSize: 14,
      color: colors.text.tertiary,
      textAlign: 'center',
      paddingTop: 40,
    },
    selectionBar: {
      position: 'absolute',
      left: Spacing.xl,
      right: Spacing.xl,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'rgba(16,18,24,0.97)',
      borderWidth: 1,
      borderColor: colors.border.glassStrong,
      borderRadius: Radius.lg,
      paddingVertical: 14,
      paddingHorizontal: 18,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 10,
    },
    selectionBarText: {
      fontFamily: FontFamily.sansBold,
      fontSize: 13.5,
      color: colors.text.primary,
    },
    deleteBtn: {
      backgroundColor: colors.red,
      borderRadius: Radius.md,
      paddingVertical: 9,
      paddingHorizontal: 16,
    },
    deleteBtnText: {
      fontFamily: FontFamily.sansBold,
      fontSize: 13,
      color: '#fff',
    },
  });
}
