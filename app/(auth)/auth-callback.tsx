import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { supabase } from '@/lib/supabase/client';

export default function AuthCallbackScreen() {
  return (
    <ErrorBoundary>
      <AuthCallback />
    </ErrorBoundary>
  );
}

function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    token_hash?: string;
    type?: string;
  }>();

  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const tokenHash = params.token_hash;
      const type = params.type;

      if (!tokenHash || !type) {
        // No token in URL — assume the link already set the session via Supabase JS.
        if (cancelled) return;
        router.replace('/(tabs)');
        return;
      }

      const { error: verifyError } = await supabase.auth.verifyOtp({
        type: type as 'signup' | 'magiclink' | 'invite' | 'email_change',
        token_hash: tokenHash,
      });
      if (cancelled) return;
      if (verifyError) {
        setError(verifyError.message);
        setVerifying(false);
        return;
      }
      router.replace('/(tabs)');
    })();
    return () => {
      cancelled = true;
    };
  }, [params.token_hash, params.type, router]);

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <View style={styles.iconWrap}>
            <Ionicons name="alert-circle-outline" size={48} color={Colors.danger} />
          </View>
          <Text style={styles.title}>Couldn&apos;t verify your link</Text>
          <Text style={styles.subtitle}>{error}</Text>
          <Pressable
            onPress={() => router.replace('/(auth)/sign-in')}
            style={styles.primaryButton}
            accessibilityRole="button"
          >
            <Text style={styles.primaryText}>Back to sign in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
        <Text style={styles.loadingText}>{verifying ? 'Confirming…' : 'Almost there…'}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  iconWrap: { marginBottom: Spacing.sm },
  title: { ...Typography.h2, color: Colors.text, textAlign: 'center' },
  subtitle: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingText: { ...Typography.caption, color: Colors.textMuted },
  primaryButton: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    ...Shadows.raised,
  },
  primaryText: { ...Typography.h3, color: '#fff' },
});
