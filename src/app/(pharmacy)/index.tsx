import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AmbientBackground } from '@/components/ambient-background';
import { IconCalendar, IconCatalogueTab, IconChat, IconClock } from '@/components/icons';
import { CatalogueTab } from '@/components/pharmacy/catalogue-tab';
import { HistoriqueTab } from '@/components/pharmacy/historique-tab';
import { MessagesTab } from '@/components/pharmacy/messages-tab';
import { OrdersTab } from '@/components/pharmacy/orders-tab';
import { Avatar } from '@/components/ui/avatar';
import { type FloatingTab, FloatingTabBar } from '@/components/ui/floating-tab-bar';
import { ProfileSheet } from '@/components/ui/profile-sheet';
import { type ThemeColors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { listenConversations } from '@/services/chat';

type TabId = 'commandes' | 'catalogue' | 'historique' | 'messages';

function buildTabs(hasPendingBadge: boolean, hasUnreadMessages: boolean): FloatingTab[] {
  return [
    { id: 'commandes', label: 'Commandes', Icon: IconCalendar, badge: hasPendingBadge },
    { id: 'catalogue', label: 'Catalogue', Icon: IconCatalogueTab },
    { id: 'historique', label: 'Historique', Icon: IconClock },
    { id: 'messages', label: 'Messages', Icon: IconChat, badge: hasUnreadMessages },
  ];
}

export default function PharmacyLayout() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [activeTab, setActiveTab] = useState<TabId>('commandes');
  const [pendingCount, setPendingCount] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = listenConversations(user.uid, (conversations) => {
      setHasUnreadMessages(conversations.some((c) => (c.unreadCount?.[user.uid] ?? 0) > 0));
    });
    return unsub;
  }, [user]);

  const fade = useSharedValue(1);
  useEffect(() => {
    fade.value = 0;
    fade.value = withTiming(1, { duration: 200 });
  }, [activeTab, fade]);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  const handlePendingChange = useCallback((count: number) => setPendingCount(count), []);

  const tabs = buildTabs(pendingCount > 0 && activeTab !== 'commandes', hasUnreadMessages);

  return (
    <View style={styles.container}>
      <AmbientBackground />

      <Animated.View style={[styles.tabContent, fadeStyle]}>
        {activeTab === 'commandes' && <OrdersTab onPendingChange={handlePendingChange} />}
        {activeTab === 'catalogue' && <CatalogueTab />}
        {activeTab === 'historique' && <HistoriqueTab />}
        {activeTab === 'messages' && <MessagesTab />}
      </Animated.View>

      {user && (
        <View style={[styles.avatarWrap, { top: insets.top + 8 }]} pointerEvents="box-none">
          <Avatar name={user.name} role="pharmacy" onPress={() => setSheetOpen(true)} />
        </View>
      )}

      <ProfileSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        role="pharmacy"
        onOpenMessages={() => setActiveTab('messages')}
      />

      <FloatingTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabPress={(tab) => setActiveTab(tab as TabId)}
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
