import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View, type KeyboardTypeOptions } from 'react-native';
import { GlassCard } from '@/components/ui/glass-card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { FontFamily, Radius, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface EditableFieldCardProps {
  label: string;
  initialValue: string;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  onSave: (value: string) => Promise<void>;
}

export function EditableFieldCard({ label, initialValue, placeholder, keyboardType, onSave }: EditableFieldCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      await onSave(value.trim());
      Alert.alert(`${label} mis à jour`);
    } catch {
      Alert.alert('Erreur', "Cette information n'a pas pu être enregistrée.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Text style={styles.sectionLabel}>{label}</Text>
      <GlassCard style={styles.card}>
        <TextField label={label} value={value} onChangeText={setValue} placeholder={placeholder} keyboardType={keyboardType} />
        <PrimaryButton label="Enregistrer" onPress={handleSave} loading={saving} />
      </GlassCard>
    </>
  );
}

interface ToggleCardProps {
  label: string;
  description?: string;
  value: boolean;
  onToggle: (value: boolean) => Promise<void>;
}

export function ToggleCard({ label, description, value, onToggle }: ToggleCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [checked, setChecked] = useState(value);
  const [saving, setSaving] = useState(false);

  async function handleChange(next: boolean) {
    if (saving) return;
    setChecked(next);
    setSaving(true);
    try {
      await onToggle(next);
    } catch {
      setChecked(!next);
      Alert.alert('Erreur', 'Le statut n\'a pas pu être mis à jour.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <GlassCard style={[styles.card, styles.toggleRow]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {description ? <Text style={styles.toggleDesc}>{description}</Text> : null}
      </View>
      <Switch
        value={checked}
        onValueChange={handleChange}
        trackColor={{ false: colors.bg.card, true: colors.amber }}
        thumbColor="#fff"
      />
    </GlassCard>
  );
}

interface ChipPickerCardProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value: T | undefined;
  onSelect: (value: T) => Promise<void>;
}

export function ChipPickerCard<T extends string>({ label, options, value, onSelect }: ChipPickerCardProps<T>) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [selected, setSelected] = useState<T | undefined>(value);
  const [saving, setSaving] = useState(false);

  async function handleSelect(opt: T) {
    if (saving || opt === selected) return;
    setSaving(true);
    try {
      await onSelect(opt);
      setSelected(opt);
    } catch {
      Alert.alert('Erreur', "Cette information n'a pas pu être enregistrée.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Text style={styles.sectionLabel}>{label}</Text>
      <GlassCard style={styles.card}>
        <View style={styles.chipRow}>
          {options.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => handleSelect(opt.value)}
              style={[styles.chip, selected === opt.value && styles.chipActive]}
            >
              <Text style={[styles.chipText, selected === opt.value && styles.chipTextActive]}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>
      </GlassCard>
    </>
  );
}

interface StatItem {
  label: string;
  value: string;
}

export function StatsRow({
  label,
  items,
  valueColor,
}: {
  label?: string;
  items: StatItem[];
  valueColor?: string;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <>
      {label ? <Text style={styles.sectionLabel}>{label}</Text> : null}
      <View style={styles.statsRow}>
        {items.map((item) => (
          <GlassCard key={item.label} style={styles.statCard}>
            <Text style={[styles.statValue, valueColor && { color: valueColor }]} numberOfLines={1}>
              {item.value}
            </Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </GlassCard>
        ))}
      </View>
    </>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    sectionLabel: {
      fontFamily: FontFamily.sansExtraBold,
      fontSize: 10.5,
      color: colors.text.tertiary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 10,
    },
    card: {
      borderRadius: Radius.lg,
      marginBottom: 22,
      padding: 16,
      gap: 4,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    toggleLabel: {
      fontFamily: FontFamily.sansBold,
      fontSize: 14.5,
      color: colors.text.primary,
    },
    toggleDesc: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 12,
      color: colors.text.tertiary,
      marginTop: 2,
    },
    chipRow: {
      flexDirection: 'row',
      gap: 8,
    },
    chip: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border.glass,
      backgroundColor: colors.bg.card,
      alignItems: 'center',
    },
    chipActive: {
      borderColor: colors.amber,
      backgroundColor: colors.amberSoft,
    },
    chipText: {
      fontFamily: FontFamily.sansBold,
      fontSize: 12.5,
      color: colors.text.tertiary,
    },
    chipTextActive: {
      color: colors.amberBright,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 9,
      marginBottom: 22,
    },
    statCard: {
      flex: 1,
      padding: 14,
      borderRadius: Radius.md,
      alignItems: 'center',
    },
    statValue: {
      fontFamily: FontFamily.serif,
      fontSize: 19,
      color: colors.text.primary,
    },
    statLabel: {
      fontFamily: FontFamily.sansExtraBold,
      fontSize: 9,
      color: colors.text.tertiary,
      marginTop: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
      textAlign: 'center',
    },
  });
}
