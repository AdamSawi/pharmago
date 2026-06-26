import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ContactPickerSheet, type Contact } from '@/components/chat/contact-picker-sheet';
import { ConversationRow } from '@/components/chat/conversation-row';
import { IconChat, IconPlus } from '@/components/icons';
import { FontFamily, Spacing, type ThemeColors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { getOrCreateConversation, listenConversations, type ConversationDoc } from '@/services/chat';
import { getUsersByRole } from '@/services/users';

export function MessagesTab() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [conversations, setConversations] = useState<ConversationDoc[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pharmacies, setPharmacies] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = listenConversations(user.uid, setConversations);
    return unsub;
  }, [user]);

  async function openPicker() {
    setPickerVisible(true);
    setLoadingContacts(true);
    try {
      const list = await getUsersByRole('pharmacy');
      setPharmacies(list.map((p) => ({ uid: p.uid, name: p.name, role: 'pharmacy' as const })));
    } catch {
      setPharmacies([]);
    } finally {
      setLoadingContacts(false);
    }
  }

  async function handleSelectContact(contact: Contact) {
    if (!user) return;
    setPickerVisible(false);
    const conversationId = await getOrCreateConversation({
      uidA: user.uid,
      nameA: user.name,
      roleA: 'client',
      uidB: contact.uid,
      nameB: contact.name,
      roleB: 'pharmacy',
    });
    router.push({ pathname: '/(client)/conversation' as never, params: { conversationId } });
  }

  if (!user) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headingRow}>
          <Text style={styles.heading}>Messages</Text>
          <Pressable onPress={openPicker} style={styles.addBtn}>
            <IconPlus size={16} color="#221204" strokeWidth={2.3} />
          </Pressable>
        </View>

        {conversations.length === 0 ? (
          <View style={styles.empty}>
            <IconChat size={36} color={colors.text.tertiary} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>Aucune conversation</Text>
            <Text style={styles.emptySub}>Contactez une pharmacie pour démarrer une discussion.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {conversations.map((c) => (
              <ConversationRow
                key={c.id}
                conversation={c}
                currentUid={user.uid}
                onPress={() => router.push({ pathname: '/(client)/conversation' as never, params: { conversationId: c.id } })}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <ContactPickerSheet
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        title="Contacter une pharmacie"
        segments={[{ id: 'pharmacy', label: 'Pharmacies', contacts: pharmacies }]}
        loading={loadingContacts}
        searchPlaceholder="Rechercher une pharmacie…"
        onSelect={handleSelectContact}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1 },
    content: { paddingHorizontal: Spacing.xl },
    headingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 18,
      paddingRight: 50,
    },
    heading: {
      fontFamily: FontFamily.serif,
      fontSize: 27,
      color: colors.text.primary,
      letterSpacing: -0.27,
    },
    addBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.amberBright,
      alignItems: 'center',
      justifyContent: 'center',
    },
    list: { gap: 9 },
    empty: {
      alignItems: 'center',
      gap: 8,
      paddingTop: 80,
    },
    emptyTitle: {
      fontFamily: FontFamily.sansBold,
      fontSize: 16,
      color: colors.text.secondary,
    },
    emptySub: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 13,
      color: colors.text.tertiary,
      textAlign: 'center',
      maxWidth: 260,
    },
  });
}
