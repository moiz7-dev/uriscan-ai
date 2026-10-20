import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useHydrationStore } from '@/store/useHydrationStore';
import { useTrackerStore } from '@/store/useTrackerStore';
import { usePurchaseStore } from '@/store/usePurchaseStore';
import { useAuthStore } from '@/store/useAuthStore';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Colors } from '@/constants/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

const queryClient = new QueryClient();

// Routes inside (auth) that are allowed to render even when a session exists
// (deep-link landing pages — must work mid-recovery / mid-confirmation).
const PUBLIC_AUTH_ROUTES = new Set(['reset-password', 'auth-callback']);

function useAuthGate() {
  const session = useAuthStore((s) => s.session);
  const loaded = useAuthStore((s) => s.loaded);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!loaded) return;
    const inAuthGroup = segments[0] === '(auth)';
    const currentAuthScreen = inAuthGroup ? segments[1] : null;
    const isPublicAuthRoute = currentAuthScreen
      ? PUBLIC_AUTH_ROUTES.has(currentAuthScreen)
      : false;

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (session && inAuthGroup && !isPublicAuthRoute) {
      router.replace('/(tabs)');
    }
  }, [session, loaded, segments, router]);
}

export default function RootLayout() {
  const loadTodayData = useHydrationStore((s) => s.loadTodayData);
  const hydrateFromStorage = useTrackerStore((s) => s.hydrateFromStorage);
  const loadEntitlement = usePurchaseStore((s) => s.loadEntitlement);
  const hydrateProductInfo = usePurchaseStore((s) => s.hydrateProductInfo);
  const initializeAuth = useAuthStore((s) => s.initialize);
  const authLoaded = useAuthStore((s) => s.loaded);
  const session = useAuthStore((s) => s.session);

  // One-time init: auth session + local settings + RevenueCat pricing
  useEffect(() => {
    initializeAuth().catch(() => {});
    hydrateFromStorage().catch(() => {});
    hydrateProductInfo().catch(() => {});
  }, [initializeAuth, hydrateFromStorage, hydrateProductInfo]);

  // Whenever a session becomes available (sign-in or app launch with existing session)
  // reload all user-specific cloud data so reinstalls restore correctly.
  useEffect(() => {
    if (!session) return;
    loadTodayData().catch(() => {});
    loadEntitlement().catch(() => {});
  }, [session, loadTodayData, loadEntitlement]);

  useAuthGate();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary>
            {authLoaded ? (
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="result"
                  options={{
                    presentation: 'modal',
                    headerShown: false,
                    animation: 'slide_from_bottom',
                  }}
                />
                <Stack.Screen
                  name="scan"
                  options={{
                    presentation: 'fullScreenModal',
                    headerShown: false,
                    animation: 'slide_from_bottom',
                  }}
                />
                <Stack.Screen
                  name="reminders"
                  options={{
                    presentation: 'modal',
                    headerShown: false,
                    animation: 'slide_from_bottom',
                  }}
                />
                <Stack.Screen
                  name="report/[reportId]"
                  options={{
                    presentation: 'modal',
                    headerShown: false,
                    animation: 'slide_from_bottom',
                  }}
                />
              </Stack>
            ) : (
              <View style={styles.splash}>
                <ActivityIndicator color={Colors.primary} />
              </View>
            )}
            <StatusBar style="dark" />
          </ErrorBoundary>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
