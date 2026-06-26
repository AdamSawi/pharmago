import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IconCheck, IconPlus } from '@/components/icons';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { FontFamily, Radius, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ClientAddress } from '@/services/auth';

interface AddressPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  addresses: ClientAddress[];
  selectedId: string | null;
  onSelect: (address: ClientAddress) => void;
}

export function AddressPickerSheet({ visible, onClose, addresses, selectedId, onSelect }: AddressPickerSheetProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  function handleSelect(address: ClientAddress) {
    onSelect(address);
    onClose();
  }

  function handleAddAddress() {
    onClose();
    router.push('/(client)/mes-adresses' as never);
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.heading}>Adresse de livraison</Text>

      <View style={styles.list}>
        {addresses.map((address) => {
          const selected = address.id === selectedId;
          return (
            <Pressable
              key={address.id}
              onPress={() => handleSelect(address)}
              style={({ pressed }) => [styles.row, selected && styles.rowSelected, pressed && { opacity: 0.8 }]}
            >
              <View style={styles.rowInfo}>
                <View style={styles.rowHeader}>
                  <Text style={styles.rowLabel}>{address.label}</Text>
                  {address.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Par défaut</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.rowAddr}>
                  {address.street}, {address.zipCode} {address.city}
                </Text>
              </View>
              {selected && <IconCheck size={18} color={colors.amberBright} strokeWidth={2.4} />}
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={handleAddAddress}
        style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
      >
        <IconPlus size={15} color={colors.amberBright} strokeWidth={2.2} />
        <Text style={styles.addBtnText}>Ajouter une adresse</Text>
      </Pressable>
    </BottomSheet>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    heading: {
      fontFamily: FontFamily.serif,
      fontSize: 18,
      color: colors.text.primary,
      paddingHorizontal: 24,
      marginBottom: 16,
    },
    list: {
      gap: 8,
      paddingHorizontal: 24,
      marginBottom: 16,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 14,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border.glass,
      backgroundColor: colors.bg.card,
    },
    rowSelected: {
      borderColor: colors.amber,
      backgroundColor: colors.amberSoft,
    },
    rowInfo: { flex: 1, gap: 4 },
    rowHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    rowLabel: {
      fontFamily: FontFamily.sansBold,
      fontSize: 14,
      color: colors.text.primary,
    },
    rowAddr: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 12.5,
      color: colors.text.tertiary,
    },
    defaultBadge: {
      backgroundColor: colors.amberSoft,
      borderWidth: 1,
      borderColor: 'rgba(235,162,78,0.30)',
      borderRadius: Radius.pill,
      paddingVertical: 3,
      paddingHorizontal: 8,
    },
    defaultBadgeText: {
      fontFamily: FontFamily.sansExtraBold,
      fontSize: 9,
      color: colors.amberBright,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginHorizontal: 24,
      paddingVertical: 14,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: 'rgba(235,162,78,0.30)',
    },
    addBtnText: {
      fontFamily: FontFamily.sansBold,
      fontSize: 13.5,
      color: colors.amberBright,
    },
  });
}
