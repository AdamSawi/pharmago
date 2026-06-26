import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AmbientBackground } from '@/components/ambient-background';
import { IconCalendar, IconChat, IconClock, IconHouse, IconStar } from '@/components/icons';
import { Avatar } from '@/components/ui/avatar';
import { type FloatingTab, FloatingTabBar } from '@/components/ui/floating-tab-bar';
import { NotificationBanner } from '@/components/ui/notification-banner';
import { ProfileSheet } from '@/components/ui/profile-sheet';
import { type ThemeColors } from '@/constants/theme';
import { EnCoursTab } from '@/components/delivery/en-cours-tab';
import { EvaluationsTab } from '@/components/delivery/evaluations-tab';
import { HistoriqueTab } from '@/components/delivery/historique-tab';
import { LivraisonsTab } from '@/components/delivery/livraisons-tab';
import { MessagesTab } from '@/components/delivery/messages-tab';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { listenConversations } from '@/services/chat';
import { listenAvailableDeliveries } from '@/services/orders';

type TabId = 'livraisons' | 'en_cours' | 'historique' | 'evaluations' | 'messages';

function buildTabs(hasUnreadMessages: boolean): FloatingTab[] {
  return [
    { id: 'livraisons', label: 'Livraisons', Icon: IconHouse },
    { id: 'en_cours', label: 'En cours', Icon: IconCalendar },
    { id: 'historique', label: 'Historique', Icon: IconClock },
    { id: 'evaluations', label: 'Évaluations', Icon: IconStar },
    { id: 'messages', label: 'Messages', Icon: IconChat, badge: hasUnreadMessages },
  ];
}

export default function DeliveryLayout() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [activeTab, setActiveTab] = useState<TabId>('livraisons');
  const [showBanner, setShowBanner] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const prevIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = listenConversations(user.uid, (conversations) => {
      setHasUnreadMessages(conversations.some((c) => (c.unreadCount?.[user.uid] ?? 0) > 0));
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    const unsub = listenAvailableDeliveries((orders) => {
      const ids = new Set(orders.map((o) => o.id));
      if (prevIds.current) {
        const hasNew = [...ids].some((id) => !prevIds.current!.has(id));
        if (hasNew) setShowBanner(true);
      }
      prevIds.current = ids;
    });
    return unsub;
  }, []);

  const fade = useSharedValue(1);
  useEffect(() => {
    fade.value = 0;
    fade.value = withTiming(1, { duration: 200 });
  }, [activeTab, fade]);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  return (
    <View style={styles.container}>
      <AmbientBackground />

      <NotificationBanner
        visible={showBanner}
        title="Nouvelle livraison disponible"
        message="Une commande attend un livreur près de vous."
        type="info"
        onHide={() => setShowBanner(false)}
      />

      <Animated.View style={[styles.tabContent, fadeStyle]}>
        {activeTab === 'livraisons' && <LivraisonsTab />}
        {activeTab === 'en_cours' && <EnCoursTab />}
        {activeTab === 'historique' && <HistoriqueTab />}
        {activeTab === 'evaluations' && <EvaluationsTab />}
        {activeTab === 'messages' && <MessagesTab />}
      </Animated.View>

      {user && (
        <View style={[styles.avatarWrap, { top: insets.top + 8 }]} pointerEvents="box-none">
          <Avatar name={user.name} role="delivery" onPress={() => setSheetOpen(true)} />
        </View>
      )}

      <ProfileSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        role="delivery"
        onOpenMessages={() => setActiveTab('messages')}
      />

      <FloatingTabBar
        tabs={buildTabs(hasUnreadMessages)}
        activeTab={activeTab}
        onTabPress={(t) => setActiveTab(t as TabId)}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg.surface },
    tabContent: { flex: 1 },
    avatarWrap: {
      position: 'absolute',
      right: 22,
      zIndex: 40,
    },
  });
}
