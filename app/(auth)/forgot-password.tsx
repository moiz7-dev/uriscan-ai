import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAuthStore } from '@/store/useAuthStore';

export default function ForgotPasswordScreen() {
  return (
    <ErrorBoundary>
      <ForgotPassword />
    </ErrorBoundary>
  );
}

function ForgotPassword() {
  const router = useRouter();
  const sendPasswordReset = useAuthStore((s) => s.sendPasswordReset);
  const lastError = useAuthStore((s) => s.lastError);
  const clearError = useAuthStore((s) => s.clearError);

  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    if (!email.trim() || busy) return;
    setBusy(true);
    try {
      const res = await sendPasswordReset(email.trim());
      if (res.ok) setSent(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </Pressable>

          <View style={styles.brand}>
            <View style={styles.logoCircle}>
              <Ionicons name="key-outline" size={28} color="#fff" />
            </View>
            <Text style={styles.title}>{sent ? 'Email sent' : 'Reset password'}</Text>
            <Text style={styles.subtitle}>
              {sent
                ? `If an account exists for ${email.trim()}, a reset link is on its way.`
                : 'Enter the email you signed up with and we’ll send you a reset link.'}
            </Text>
          </View>

          {!sent && lastError ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={Colors.danger} />
              <Text style={styles.errorText}>{lastError}</Text>
              <Pressable onPress={clearError} hitSlop={8}>
                <Ionicons name="close" size={16} color={Colors.danger} />
              </Pressable>
            </View>
          ) : null}

          {sent ? (
            <Link href="/(auth)/sign-in" asChild>
              <Pressable
                style={styles.primaryButton}
                accessibilityRole="link"
              >
                <Text style={styles.primaryText}>Back to sign in</Text>
              </Pressable>
            </Link>
          ) : (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  placeholderTextColor={Colors.textMuted}
                  style={styles.input}
                />
              </View>

              <Pressable
                onPress={handleSend}
                disabled={!email.trim() || busy}
                style={[styles.primaryButton, (!email.trim() || busy) && styles.disabled]}
                accessibilityRole="button"
                accessibilityLabel="Send reset link"
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryText}>Send reset link</Text>
                )}
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  brand: {
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.raised,
  },
  title: { ...Typography.h1, color: Colors.text, marginTop: Spacing.sm },
  subtitle: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
    lineHeight: 22,
  },
  field: { gap: Spacing.xs },
  label: { ...Typography.caption, color: Colors.textMuted, fontWeight: '600' },
  input: {
    ...Typography.body,
    color: Colors.text,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.base,
    minHeight: 52,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#FEE2E2',
    padding: Spacing.md,
    borderRadius: Radii.md,
  },
  errorText: { ...Typography.caption, color: Colors.danger, flex: 1 },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.base,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    marginTop: Spacing.sm,
    ...Shadows.raised,
  },
  primaryText: { ...Typography.h3, color: '#fff' },
  disabled: { opacity: 0.5 },
});
