import { DMSerifDisplay_400Regular, DMSerifDisplay_400Regular_Italic } from '@expo-google-fonts/dm-serif-display';
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
} from '@expo-google-fonts/outfit';
import { useFonts } from 'expo-font';
import { router, Stack, useNavigationContainerRef, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CommonActions } from '@react-navigation/native';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { useAuth } from '@/hooks/use-auth';
import { ThemeProvider, useTheme } from '@/hooks/use-theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}

function RootLayoutContent() {
  const { colors, mode } = useTheme();
  const [fontsLoaded] = useFonts({
    DMSerifDisplay_400Regular,
    DMSerifDisplay_400Regular_Italic,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
  });

  const { user, loading: authLoading } = useAuth();
  const segments = useSegments();
  const navigationRef = useNavigationContainerRef();
  const ready = fontsLoaded && !authLoading;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  // Single source of truth for post-auth navigation — handles sign-out,
  // sign-in, and role switches without relying on a render-time <Redirect>
  // (which flickered/blanked when swapping roles).
  //
  // Route groups like "(client)" don't add a URL segment, so a group's own
  // hub screen reports the same pathname ("/") as the root welcome screen.
  // useSegments() avoids that ambiguity for *detecting* where we are —
  // segments[0] is the group's literal name regardless of which screen
  // inside it is showing. But that same ambiguity means a path-based
  // `router.replace('/')` (or a raw `navigationRef.reset()`, which needs an
  // exact full state shape including expo-router's internal wrapper
  // navigator) can fail to escape the current group's own nested Stack.
  // Dispatching a plain `navigate` CommonAction by screen *name* sidesteps
  // path resolution entirely — React Navigation bubbles/descends through
  // the actual navigator tree to find whichever Stack owns a screen called
  // "index", which is the root Stack defined below, not the group's hub.
  useEffect(() => {
    if (!ready) return;
    const group = segments[0] as string | undefined;
    const inRoleGroup = group === '(client)' || group === '(pharmacy)' || group === '(delivery)';
    const isPublicScreen = segments[1] === 'login' || segments[1] === 'register';

    if (!user) {
      if (inRoleGroup && !isPublicScreen) {
        navigationRef.current?.dispatch(CommonActions.navigate({ name: 'index' }));
      }
      return;
    }
    if (!inRoleGroup || isPublicScreen) {
      if (user.role === 'pharmacy') router.replace('/(pharmacy)' as never);
      else if (user.role === 'client') router.replace('/(client)');
      else if (user.role === 'delivery') router.replace('/(delivery)');
    }
  }, [ready, user, segments, navigationRef]);

  if (!ready) return <LoadingScreen />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: colors.bg.deep }}>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.bg.deep } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="(pharmacy)" />
          <Stack.Screen name="(client)" />
          <Stack.Screen name="(delivery)" />
        </Stack>
      </View>
    </GestureHandlerRootView>
  );
}
