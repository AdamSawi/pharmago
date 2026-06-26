import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Avatar } from '@/components/ui/avatar';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { IconSearch } from '@/components/icons';
import { FontFamily, Radius, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { UserRole } from '@/services/auth';

export interface Contact {
  uid: string;
  name: string;
  role: UserRole;
  orderId?: string | null;
}

export interface ContactSegment {
  id: string;
  label: string;
  contacts: Contact[];
}

interface ContactPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  segments: ContactSegment[];
  loading?: boolean;
  searchPlaceholder?: string;
  onSelect: (contact: Contact) => void;
}

export function ContactPickerSheet({
  visible,
  onClose,
  title,
  segments,
  loading,
  searchPlaceholder,
  onSelect,
}: ContactPickerSheetProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [activeSegment, setActiveSegment] = useState(segments[0]?.id ?? '');
  const [search, setSearch] = useState('');

  const current = segments.find((s) => s.id === activeSegment) ?? segments[0];
  const filtered = useMemo(() => {
    if (!current) return [];
    const q = search.trim().toLowerCase();
    if (!q) return current.contacts;
    return current.contacts.filter((c) => c.name.toLowerCase().includes(q));
  }, [current, search]);

  function handleSelect(contact: Contact) {
    setSearch('');
    onSelect(contact);
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.heading}>{title}</Text>

      {segments.length > 1 && (
        <View style={styles.segmentRow}>
          {segments.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => setActiveSegment(s.id)}
              style={[styles.segmentBtn, activeSegment === s.id && styles.segmentBtnActive]}
            >
              <Text style={[styles.segmentLabel, activeSegment === s.id && styles.segmentLabelActive]}>
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.searchBar}>
        <IconSearch size={15} color={colors.text.tertiary} strokeWidth={2} />
        <TextInput
          style={styles.searchInput}
          placeholder={searchPlaceholder ?? 'Rechercher…'}
          placeholderTextColor={colors.text.tertiary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={colors.amberBright} style={styles.loadingState} />
        ) : filtered.length === 0 ? (
          <Text style={styles.emptyText}>Aucun contact disponible</Text>
        ) : (
          filtered.map((contact) => (
            <Pressable
              key={contact.uid}
              onPress={() => handleSelect(contact)}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }]}
            >
              <Avatar name={contact.name} role={contact.role} size={40} />
              <Text style={styles.rowName} numberOfLines={1}>{contact.name}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
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
      marginBottom: 14,
    },
    segmentRow: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 24,
      marginBottom: 12,
    },
    segmentBtn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 10,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border.glass,
      backgroundColor: colors.bg.card,
    },
    segmentBtnActive: {
      borderColor: colors.amber,
      backgroundColor: colors.amberSoft,
    },
    segmentLabel: {
      fontFamily: FontFamily.sansBold,
      fontSize: 12.5,
      color: colors.text.tertiary,
    },
    segmentLabelActive: {
      color: colors.amberBright,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      marginHorizontal: 24,
      paddingHorizontal: 14,
      paddingVertical: 11,
      marginBottom: 10,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border.glass,
      backgroundColor: colors.bg.card,
    },
    searchInput: {
      flex: 1,
      fontFamily: FontFamily.sansMedium,
      fontSize: 13.5,
      color: colors.text.primary,
    },
    list: {
      maxHeight: 340,
      paddingHorizontal: 24,
    },
    loadingState: { paddingVertical: 24 },
    emptyText: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 13,
      color: colors.text.tertiary,
      textAlign: 'center',
      paddingVertical: 24,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 10,
    },
    rowName: {
      flex: 1,
      fontFamily: FontFamily.sansBold,
      fontSize: 14,
      color: colors.text.primary,
    },
  });
}
