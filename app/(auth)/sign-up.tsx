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

export default function SignUpScreen() {
  return (
    <ErrorBoundary>
      <SignUp />
    </ErrorBoundary>
  );
}

function SignUp() {
  const router = useRouter();
  const signUpWithEmail = useAuthStore((s) => s.signUpWithEmail);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const status = useAuthStore((s) => s.status);
  const lastError = useAuthStore((s) => s.lastError);
  const clearError = useAuthStore((s) => s.clearError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const passwordMismatch = confirm.length > 0 && confirm !== password;
  const canSubmit =
    email.trim().length > 0 &&
    password.length >= 6 &&
    confirm === password &&
    !busy;

  async function handleSignUp() {
    if (!canSubmit) return;
    setBusy(true);
    try {
      const res = await signUpWithEmail(email.trim(), password);
      if (res.ok && res.needsEmailConfirmation) {
        setConfirmationSent(true);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    try {
      await signInWithGoogle();
    } finally {
      setBusy(false);
    }
  }

  if (confirmationSent) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.brand}>
            <View style={[styles.logoCircle, { backgroundColor: Colors.success }]}>
              <Ionicons name="mail-open-outline" size={32} color="#fff" />
            </View>
            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.subtitle}>
              We sent a confirmation link to {email.trim()}. Tap the link to finish creating
              your account.
            </Text>
          </View>

          <Pressable
            onPress={() => router.replace('/(auth)/sign-in')}
            style={styles.primaryButton}
            accessibilityRole="button"
          >
            <Text style={styles.primaryText}>Back to sign in</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
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
          <View style={styles.brand}>
            <View style={styles.logoCircle}>
              <Ionicons name="water" size={32} color="#fff" />
            </View>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Get started with UriScan AI</Text>
          </View>

          {lastError ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={Colors.danger} />
              <Text style={styles.errorText}>{lastError}</Text>
              <Pressable onPress={clearError} hitSlop={8}>
                <Ionicons name="close" size={16} color={Colors.danger} />
              </Pressable>
            </View>
          ) : null}

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

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password-new"
                placeholderTextColor={Colors.textMuted}
                style={[styles.input, styles.inputFlex]}
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={8}
                style={styles.eyeButton}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Colors.textMuted}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Confirm password</Text>
            <TextInput
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Repeat password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password-new"
              placeholderTextColor={Colors.textMuted}
              style={[styles.input, passwordMismatch && styles.inputError]}
            />
            {passwordMismatch ? (
              <Text style={styles.fieldError}>Passwords don&apos;t match</Text>
            ) : null}
          </View>

          <Pressable
            onPress={handleSignUp}
            disabled={!canSubmit}
            style={[styles.primaryButton, !canSubmit && styles.disabled]}
            accessibilityRole="button"
            accessibilityLabel="Create account"
          >
            {busy && status === 'pending' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>Create account</Text>
            )}
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            onPress={handleGoogle}
            disabled={busy}
            style={[styles.googleButton, busy && styles.disabled]}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
          >
            <Ionicons name="logo-google" size={20} color={Colors.text} />
            <Text style={styles.googleText}>Continue with Google</Text>
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/sign-in" asChild>
              <Pressable accessibilityRole="link">
                <Text style={styles.footerLink}>Sign in</Text>
              </Pressable>
            </Link>
          </View>
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
  brand: {
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
  inputError: { borderColor: Colors.danger },
  fieldError: { ...Typography.micro, color: Colors.danger, marginTop: 2 },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  inputFlex: { flex: 1 },
  eyeButton: {
    position: 'absolute',
    right: Spacing.md,
    height: 52,
    justifyContent: 'center',
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.md,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { ...Typography.micro, color: Colors.textMuted, fontWeight: '700' },
  googleButton: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.base,
    borderRadius: Radii.pill,
    minHeight: 56,
  },
  googleText: { ...Typography.bodyBold, color: Colors.text },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  footerText: { ...Typography.body, color: Colors.textMuted },
  footerLink: { ...Typography.bodyBold, color: Colors.primary },
});
