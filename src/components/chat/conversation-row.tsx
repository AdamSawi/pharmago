import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/ui/avatar';
import { GlassCard } from '@/components/ui/glass-card';
import { FontFamily, Radius, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ConversationDoc } from '@/services/chat';

function formatConversationTime(ms: number): string {
  const date = new Date(ms);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Hier';
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

interface ConversationRowProps {
  conversation: ConversationDoc;
  currentUid: string;
  onPress: () => void;
}

export function ConversationRow({ conversation, currentUid, onPress }: ConversationRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const otherUid = conversation.participants.find((p) => p !== currentUid) ?? '';
  const name = conversation.participantNames?.[otherUid] ?? '—';
  const role = conversation.participantRoles?.[otherUid] ?? 'client';
  const unread = conversation.unreadCount?.[currentUid] ?? 0;
  const lastMessage =
    conversation.lastMessage && conversation.lastMessage.length > 40
      ? `${conversation.lastMessage.slice(0, 40)}…`
      : conversation.lastMessage;
  const timeLabel = conversation.lastMessageAt ? formatConversationTime(conversation.lastMessageAt.toMillis()) : '';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.8 }}>
      <GlassCard style={styles.card}>
        <Avatar name={name} role={role} size={46} />
        <View style={styles.info}>
          <View style={styles.topRow}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            <Text style={styles.time}>{timeLabel}</Text>
          </View>
          {conversation.orderId && (
            <View style={styles.orderBadge}>
              <Text style={styles.orderBadgeText}>Commande #{conversation.orderId.slice(-4).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.bottomRow}>
            <Text style={[styles.preview, unread > 0 && styles.previewUnread]} numberOfLines={1}>
              {lastMessage || 'Démarrez la conversation'}
            </Text>
            {unread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
              </View>
            )}
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: Radius.lg,
    },
    info: { flex: 1, gap: 4 },
    orderBadge: {
      alignSelf: 'flex-start',
      paddingVertical: 2,
      paddingHorizontal: 8,
      borderRadius: Radius.pill,
      backgroundColor: colors.amberSoft,
      borderWidth: 1,
      borderColor: 'rgba(235,162,78,0.25)',
    },
    orderBadgeText: {
      fontFamily: FontFamily.sansExtraBold,
      fontSize: 9.5,
      color: colors.amberBright,
      letterSpacing: 0.3,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
    },
    name: {
      fontFamily: FontFamily.sansBold,
      fontSize: 14.5,
      color: colors.text.primary,
      flex: 1,
    },
    time: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 11,
      color: colors.text.tertiary,
    },
    bottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
    },
    preview: {
      flex: 1,
      fontFamily: FontFamily.sansMedium,
      fontSize: 12.5,
      color: colors.text.tertiary,
    },
    previewUnread: {
      color: colors.text.secondary,
      fontFamily: FontFamily.sansBold,
    },
    badge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      paddingHorizontal: 5,
      backgroundColor: colors.amberBright,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      fontFamily: FontFamily.sansExtraBold,
      fontSize: 10.5,
      color: '#221204',
    },
  });
}
