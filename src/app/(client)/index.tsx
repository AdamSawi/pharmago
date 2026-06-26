import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AmbientBackground } from '@/components/ambient-background';
import { FavoritesTab } from '@/components/client/favorites-tab';
import { MessagesTab } from '@/components/client/messages-tab';
import { OrdersTab } from '@/components/client/orders-tab';
import { PharmaciesTab } from '@/components/client/pharmacies-tab';
import { IconCalendar, IconChat, IconMapPin, IconStar } from '@/components/icons';
import { Avatar } from '@/components/ui/avatar';
import { type FloatingTab, FloatingTabBar } from '@/components/ui/floating-tab-bar';
import { NotificationBanner } from '@/components/ui/notification-banner';
import { ProfileSheet } from '@/components/ui/profile-sheet';
import { type ThemeColors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { listenConversations } from '@/services/chat';
import { listenClientOrders, type OrderStatus } from '@/services/orders';

type TabId = 'pharmacies' | 'commandes' | 'favoris' | 'messages';

function buildTabs(hasUnreadMessages: boolean): FloatingTab[] {
  return [
    { id: 'pharmacies', label: 'Pharmacies', Icon: IconMapPin },
    { id: 'commandes', label: 'Commandes', Icon: IconCalendar },
    { id: 'favoris', label: 'Favoris', Icon: IconStar },
    { id: 'messages', label: 'Messages', Icon: IconChat, badge: hasUnreadMessages },
  ];
}

const STATUS_NOTIF: Partial<Record<OrderStatus, { title: string; message: string }>> = {
  accepted: { title: 'Commande acceptée', message: 'La pharmacie prépare votre commande.' },
  in_delivery: { title: 'Livreur assigné', message: 'Votre commande est en route.' },
  delivered: { title: 'Commande livrée', message: 'Bonne santé !' },
};

export default function ClientLayout() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { tab, orderId } = useLocalSearchParams<{ tab?: TabId; orderId?: string }>();
  const [activeTab, setActiveTab] = useState<TabId>(tab ?? 'pharmacies');
  const [banner, setBanner] = useState<{ title: string; message: string } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const prevStatuses = useRef<Map<string, OrderStatus>>(new Map());

  useEffect(() => {
    if (!user) return;
    const unsub = listenConversations(user.uid, (conversations) => {
      setHasUnreadMessages(conversations.some((c) => (c.unreadCount?.[user.uid] ?? 0) > 0));
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (tab) setActiveTab(tab);
  }, [tab]);

  useEffect(() => {
    if (!user) return;
    const unsub = listenClientOrders(user.uid, (orders) => {
      for (const order of orders) {
        const prev = prevStatuses.current.get(order.id);
        if (prev && prev !== order.status && STATUS_NOTIF[order.status]) {
          setBanner(STATUS_NOTIF[order.status]!);
        }
        prevStatuses.current.set(order.id, order.status);
      }
    });
    return unsub;
  }, [user]);

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
        visible={!!banner}
        title={banner?.title ?? ''}
        message={banner?.message}
        type="success"
        onHide={() => setBanner(null)}
      />

      <Animated.View style={[styles.tabContent, fadeStyle]}>
        {activeTab === 'pharmacies' && <PharmaciesTab />}
        {activeTab === 'commandes' && <OrdersTab highlightOrderId={orderId} />}
        {activeTab === 'favoris' && <FavoritesTab />}
        {activeTab === 'messages' && <MessagesTab />}
      </Animated.View>

      {user && (
        <View style={[styles.avatarWrap, { top: insets.top + 8 }]} pointerEvents="box-none">
          <Avatar name={user.name} role="client" onPress={() => setSheetOpen(true)} />
        </View>
      )}

      <ProfileSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        role="client"
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
