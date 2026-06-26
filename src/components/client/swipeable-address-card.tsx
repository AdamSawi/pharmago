import { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { IconPencil, IconTrash } from '@/components/icons';
import { GlassCard } from '@/components/ui/glass-card';
import { FontFamily, Radius, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ClientAddress } from '@/services/auth';

const ACTION_WIDTH = 76;

interface SwipeableAddressCardProps {
  address: ClientAddress;
  onSetDefault: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

export function SwipeableAddressCard({ address, onSetDefault, onDelete, onEdit }: SwipeableAddressCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const translateX = useSharedValue(0);
  const offset = useSharedValue(0);

  function close() {
    offset.value = 0;
    translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
  }

  function handleDeletePress() {
    Alert.alert(
      'Supprimer cette adresse ?',
      `${address.label} — ${address.street}, ${address.zipCode} ${address.city}`,
      [
        { text: 'Annuler', style: 'cancel', onPress: close },
        { text: 'Supprimer', style: 'destructive', onPress: onDelete },
      ],
    );
  }

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      translateX.value = Math.min(0, Math.max(-ACTION_WIDTH, offset.value + e.translationX));
    })
    .onEnd(() => {
      const shouldOpen = translateX.value < -ACTION_WIDTH / 2;
      offset.value = shouldOpen ? -ACTION_WIDTH : 0;
      translateX.value = withSpring(offset.value, { damping: 20, stiffness: 300 });
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.trashZone}>
        <Pressable onPress={handleDeletePress} style={styles.trashBtn} hitSlop={8}>
          <IconTrash size={18} color="#fff" strokeWidth={1.8} />
        </Pressable>
      </View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={cardStyle}>
          <GlassCard style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={styles.label}>{address.label}</Text>
              <View style={styles.headerActions}>
                {address.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Par défaut</Text>
                  </View>
                )}
                <Pressable onPress={onEdit} style={styles.editBtn} hitSlop={8}>
                  <IconPencil size={15} color={colors.text.tertiary} strokeWidth={1.8} />
                </Pressable>
              </View>
            </View>
            {(address.recipientFirstName || address.recipientLastName) && (
              <Text style={styles.recipientText}>
                {[address.recipientFirstName, address.recipientLastName].filter(Boolean).join(' ')}
              </Text>
            )}
            <Text style={styles.addrText}>
              {address.street}, {address.zipCode} {address.city}
            </Text>
            {!address.isDefault && (
              <Pressable onPress={onSetDefault} style={({ pressed }) => pressed && { opacity: 0.7 }}>
                <Text style={styles.setDefaultLink}>Définir par défaut</Text>
              </Pressable>
            )}
          </GlassCard>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      borderRadius: Radius.lg,
      overflow: 'hidden',
    },
    trashZone: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      width: ACTION_WIDTH,
      backgroundColor: '#e07a6b',
      alignItems: 'center',
      justifyContent: 'center',
    },
    trashBtn: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    card: {
      padding: 16,
      borderRadius: Radius.lg,
      gap: 6,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    editBtn: {
      padding: 2,
    },
    label: {
      fontFamily: FontFamily.sansBold,
      fontSize: 15,
      color: colors.text.primary,
    },
    recipientText: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 12.5,
      color: colors.text.secondary,
    },
    defaultBadge: {
      backgroundColor: colors.amberSoft,
      borderWidth: 1,
      borderColor: 'rgba(235,162,78,0.30)',
      borderRadius: Radius.pill,
      paddingVertical: 4,
      paddingHorizontal: 10,
    },
    defaultBadgeText: {
      fontFamily: FontFamily.sansExtraBold,
      fontSize: 10,
      color: colors.amberBright,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    addrText: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 13,
      color: colors.text.tertiary,
    },
    setDefaultLink: {
      fontFamily: FontFamily.sansBold,
      fontSize: 12.5,
      color: colors.amberBright,
      marginTop: 2,
    },
  });
}
