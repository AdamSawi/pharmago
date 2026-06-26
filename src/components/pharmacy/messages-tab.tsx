import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ContactPickerSheet, type Contact, type ContactSegment } from '@/components/chat/contact-picker-sheet';
import { ConversationRow } from '@/components/chat/conversation-row';
import { IconChat, IconPlus } from '@/components/icons';
import { FontFamily, Spacing, type ThemeColors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import {
  getOrCreateConversation,
  getPharmacyClientContacts,
  getPharmacyDeliveryContacts,
  listenConversations,
  type ConversationDoc,
} from '@/services/chat';

export function MessagesTab() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [conversations, setConversations] = useState<ConversationDoc[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [segments, setSegments] = useState<ContactSegment[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = listenConversations(user.uid, setConversations);
    return unsub;
  }, [user]);

  async function openPicker() {
    if (!user) return;
    setPickerVisible(true);
    setLoadingContacts(true);
    try {
      const [clients, deliveries] = await Promise.all([
        getPharmacyClientContacts(user.uid),
        getPharmacyDeliveryContacts(user.uid),
      ]);
      setSegments([
        { id: 'client', label: 'Clients', contacts: clients.map((c) => ({ uid: c.uid, name: c.name, role: 'client' as const })) },
        { id: 'delivery', label: 'Livreurs', contacts: deliveries.map((c) => ({ uid: c.uid, name: c.name, role: 'delivery' as const })) },
      ]);
    } catch {
      setSegments([]);
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
      roleA: 'pharmacy',
      uidB: contact.uid,
      nameB: contact.name,
      roleB: contact.role,
    });
    router.push({ pathname: '/(pharmacy)/conversation' as never, params: { conversationId } });
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
            <Text style={styles.emptySub}>Contactez un client ou un livreur pour démarrer une discussion.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {conversations.map((c) => (
              <ConversationRow
                key={c.id}
                conversation={c}
                currentUid={user.uid}
                onPress={() => router.push({ pathname: '/(pharmacy)/conversation' as never, params: { conversationId: c.id } })}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <ContactPickerSheet
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        title="Nouvelle conversation"
        segments={segments}
        loading={loadingContacts}
        searchPlaceholder="Rechercher…"
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
