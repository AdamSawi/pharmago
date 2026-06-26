import { Stack } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';

export default function ClientLayout() {
  const { colors } = useTheme();
  const { user } = useAuth();
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.bg.surface } }}>
      {/* Safety net: if `user` ever goes null while one of the screens below
          is focused, React Navigation removes them from this Stack and
          falls back to the first available screen here ("login") instead of
          rendering a stale, data-less authenticated screen. */}
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack.Protected>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="index" />
        <Stack.Screen name="order" />
        <Stack.Screen name="payment" />
        <Stack.Screen name="success" options={{ gestureEnabled: false }} />
        <Stack.Screen name="order-tracking" />
        <Stack.Screen name="tracking" />
        <Stack.Screen name="mes-informations" />
        <Stack.Screen name="mes-adresses" />
        <Stack.Screen name="conversation" />
      </Stack.Protected>
    </Stack>
  );
}
