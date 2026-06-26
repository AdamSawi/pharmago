import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IconFilter } from '@/components/icons';
import { FontFamily, Radius, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { BottomSheet } from './bottom-sheet';
import { PrimaryButton } from './primary-button';

interface FilterButtonProps {
  activeLabel: string | null;
  onPress: () => void;
}

export function FilterButton({ activeLabel, onPress }: FilterButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        activeLabel && styles.btnActive,
        pressed && { opacity: 0.8 },
      ]}
    >
      <IconFilter size={15} color={activeLabel ? colors.amberBright : colors.text.secondary} strokeWidth={2.1} />
      {activeLabel && <Text style={styles.btnLabel}>{activeLabel}</Text>}
    </Pressable>
  );
}

export interface FilterOption<T extends string> {
  id: T;
  label: string;
}

interface FilterSheetProps<T extends string> {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: FilterOption<T>[];
  value: T;
  defaultValue: T;
  onApply: (value: T) => void;
}

export function FilterSheet<T extends string>({
  visible,
  onClose,
  title,
  options,
  value,
  defaultValue,
  onApply,
}: FilterSheetProps<T>) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [selected, setSelected] = useState<T>(value);

  useEffect(() => {
    if (visible) setSelected(value);
  }, [visible, value]);

  function handleApply() {
    onApply(selected);
    onClose();
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.heading}>{title}</Text>

      <View style={styles.list}>
        {options.map((opt) => {
          const isSelected = opt.id === selected;
          return (
            <Pressable
              key={opt.id}
              onPress={() => setSelected(opt.id)}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.rowLabel}>{opt.label}</Text>
              <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
                {isSelected && <View style={styles.radioDot} />}
              </View>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => setSelected(defaultValue)}
        style={({ pressed }) => [styles.resetBtn, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.resetText}>Réinitialiser</Text>
      </Pressable>

      <PrimaryButton label="Appliquer" onPress={handleApply} style={styles.applyBtn} />
    </BottomSheet>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    btn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: 38,
      paddingHorizontal: 12,
      borderRadius: Radius.pill,
      borderWidth: 1,
      borderColor: colors.border.glass,
      backgroundColor: colors.bg.card,
    },
    btnActive: {
      borderColor: 'rgba(235,162,78,0.40)',
      backgroundColor: colors.amberSoft,
    },
    btnLabel: {
      fontFamily: FontFamily.sansBold,
      fontSize: 12,
      color: colors.amberBright,
    },
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
      marginBottom: 8,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border.glass,
      backgroundColor: colors.bg.card,
    },
    rowLabel: {
      fontFamily: FontFamily.sansBold,
      fontSize: 14,
      color: colors.text.primary,
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: colors.border.glassStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioOuterActive: {
      borderColor: colors.amberBright,
    },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.amberBright,
    },
    resetBtn: {
      alignSelf: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    resetText: {
      fontFamily: FontFamily.sansBold,
      fontSize: 13,
      color: colors.text.tertiary,
    },
    applyBtn: {
      marginHorizontal: 24,
    },
  });
}
