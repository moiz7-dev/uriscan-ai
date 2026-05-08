import { useEffect, useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';

export default function ResetPasswordScreen() {
  return (
    <ErrorBoundary>
      <ResetPassword />
    </ErrorBoundary>
  );
}

function ResetPassword() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    token_hash?: string;
    type?: string;
  }>();
  const updatePassword = useAuthStore((s) => s.updatePassword);

  const [verifying, setVerifying] = useState(true);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Verify the recovery token from the deep-link URL once on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const tokenHash = params.token_hash;
      const type = params.type;
      if (!tokenHash || type !== 'recovery') {
        // Maybe the user opened this screen without a link — they must already
        // have a session (e.g. from sign-in) for updatePassword to work.
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (!data.session) {
          setVerifyError('This reset link is invalid or expired. Request a new one.');
        }
        setVerifying(false);
        return;
      }
      const { error } = await supabase.auth.verifyOtp({
        type: 'recovery',
        token_hash: tokenHash,
      });
      if (cancelled) return;
      if (error) {
        setVerifyError(error.message);
      }
      setVerifying(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [params.token_hash, params.type]);

  const passwordMismatch = confirm.length > 0 && confirm !== password;
  const canSubmit =
    password.length >= 6 && confirm === password && !busy && !verifyError;

  async function handleUpdate() {
    if (!canSubmit) return;
    setBusy(true);
    setSubmitError(null);
    try {
      const res = await updatePassword(password);
      if (res.ok) {
        setDone(true);
      } else {
        setSubmitError(res.message ?? 'Failed to update password');
      }
    } finally {
      setBusy(false);
    }
  }

  if (verifying) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.loadingText}>Verifying reset link…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (done) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.brand}>
            <View style={[styles.logoCircle, { backgroundColor: Colors.success }]}>
              <Ionicons name="checkmark-circle-outline" size={32} color="#fff" />
            </View>
            <Text style={styles.title}>Password updated</Text>
            <Text style={styles.subtitle}>You&apos;re signed in with the new password.</Text>
          </View>
          <Pressable
            onPress={() => router.replace('/(tabs)')}
            style={styles.primaryButton}
            accessibilityRole="button"
          >
            <Text style={styles.primaryText}>Continue</Text>
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
              <Ionicons name="lock-closed-outline" size={28} color="#fff" />
            </View>
            <Text style={styles.title}>Set new password</Text>
            <Text style={styles.subtitle}>Choose a password you haven&apos;t used before.</Text>
          </View>

          {verifyError ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={Colors.danger} />
              <Text style={styles.errorText}>{verifyError}</Text>
            </View>
          ) : null}

          {submitError ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={Colors.danger} />
              <Text style={styles.errorText}>{submitError}</Text>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.label}>New password</Text>
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
                editable={!verifyError}
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={8}
                style={styles.eyeButton}
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
              placeholder="Repeat new password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password-new"
              placeholderTextColor={Colors.textMuted}
              style={[styles.input, passwordMismatch && styles.inputError]}
              editable={!verifyError}
            />
            {passwordMismatch ? (
              <Text style={styles.fieldError}>Passwords don&apos;t match</Text>
            ) : null}
          </View>

          <Pressable
            onPress={handleUpdate}
            disabled={!canSubmit}
            style={[styles.primaryButton, !canSubmit && styles.disabled]}
            accessibilityRole="button"
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>Update password</Text>
            )}
          </Pressable>

          {verifyError ? (
            <Pressable
              onPress={() => router.replace('/(auth)/forgot-password')}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryText}>Request a new link</Text>
            </Pressable>
          ) : null}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  loadingText: { ...Typography.caption, color: Colors.textMuted },
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
  inputFlex: { flex: 1 },
  inputError: { borderColor: Colors.danger },
  fieldError: { ...Typography.micro, color: Colors.danger, marginTop: 2 },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
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
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: Spacing.base,
    marginTop: Spacing.sm,
  },
  secondaryText: { ...Typography.bodyBold, color: Colors.primary },
});
