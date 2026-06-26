import { Stack } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';

export default function DeliveryLayout() {
  const { colors } = useTheme();
  const { user } = useAuth();
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.bg.surface } }}>
      {/* Safety net: if `user` ever goes null while one of the screens below
          is focused, React Navigation removes them from this Stack and
          falls back to "login" instead of rendering a stale, data-less
          authenticated screen. */}
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="index" />
        <Stack.Screen name="delivery-detail" />
        <Stack.Screen name="route" />
        <Stack.Screen name="earnings" />
        <Stack.Screen name="mes-informations" />
        <Stack.Screen name="conversation" />
      </Stack.Protected>
    </Stack>
  );
}
