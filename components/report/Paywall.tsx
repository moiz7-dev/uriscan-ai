import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { usePurchaseStore } from '@/store/usePurchaseStore';
import { getPaywallCta } from '@/lib/teaserCopy';
import { PRO_PRICE_FALLBACK_LABEL } from '@/lib/iap/products';
import type { HydrationLevel } from '@/types';

interface Props {
  level: HydrationLevel;
  onUnlocked: () => void;
}

const BENEFITS = [
  { icon: 'infinite-outline', text: 'Unlimited detailed reports — every scan, lifetime' },
  { icon: 'document-text-outline', text: 'Full hydration verdict + 3 action steps per report' },
  { icon: 'pulse-outline', text: 'Today vs. your 7-day average with sparkline' },
  { icon: 'time-outline', text: '24-hour recovery plan, hour by hour' },
  { icon: 'body-outline', text: 'How each level affects kidneys, skin, brain, energy' },
  { icon: 'download-outline', text: 'Downloadable PDFs you can save or share' },
] as const;

export function Paywall({ level, onUnlocked }: Props) {
  const purchase = usePurchaseStore((s) => s.purchase);
  const restore = usePurchaseStore((s) => s.restore);
  const inFlight = usePurchaseStore((s) => s.inFlight);
  const restoreInFlight = usePurchaseStore((s) => s.restoreInFlight);
  const lastError = usePurchaseStore((s) => s.lastError);
  const productPriceLabel = usePurchaseStore((s) => s.productPriceLabel);
  const bypassMode = usePurchaseStore((s) => s.bypassMode);
  const hydrateProductInfo = usePurchaseStore((s) => s.hydrateProductInfo);
  const clearError = usePurchaseStore((s) => s.clearError);

  const [localBusy, setLocalBusy] = useState(false);

  useEffect(() => {
    if (!productPriceLabel) hydrateProductInfo();
  }, [productPriceLabel, hydrateProductInfo]);

  const priceLabel = productPriceLabel ?? PRO_PRICE_FALLBACK_LABEL;
  const cta = getPaywallCta(level, priceLabel);
  const busy = localBusy || inFlight === 'pending';
  const restoring = restoreInFlight === 'pending';

  async function handlePurchase() {
    if (busy) return;
    setLocalBusy(true);
    try {
      const result = await purchase();
      if (result.ok) onUnlocked();
    } finally {
      setLocalBusy(false);
    }
  }

  async function handleRestore() {
    if (restoring) return;
    const result = await restore();
    if (result.ok && result.owned) onUnlocked();
  }

  return (
    <View style={styles.card}>
      <View style={styles.priceHeader}>
        <Text style={styles.priceLabel}>{priceLabel}</Text>
        <View style={styles.oneTimePill}>
          <Text style={styles.oneTimeText}>One-time · Lifetime</Text>
        </View>
      </View>

      <Text style={styles.title}>Unlock UriScan Pro</Text>
      <Text style={styles.subtitle}>
        One purchase, lifetime access. Detailed report on every scan, plus PDF export.
      </Text>

      <View style={styles.divider} />

      <View style={styles.benefits}>
        {BENEFITS.map((b) => (
          <View key={b.text} style={styles.benefitRow}>
            <View style={styles.benefitIconWrap}>
              <Ionicons name={b.icon as never} size={16} color={Colors.primary} />
            </View>
            <Text style={styles.benefitText}>{b.text}</Text>
          </View>
        ))}
      </View>

      {lastError && inFlight === 'error' ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={18} color={Colors.danger} />
          <Text style={styles.errorText}>{lastError}</Text>
          <Pressable onPress={clearError} hitSlop={8}>
            <Ionicons name="close" size={16} color={Colors.danger} />
          </Pressable>
        </View>
      ) : null}

      <Pressable
        onPress={handlePurchase}
        disabled={busy}
        style={[styles.ctaButton, busy && styles.ctaBusy]}
        accessibilityRole="button"
        accessibilityLabel={cta}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="lock-open" size={18} color="#fff" />
            <Text style={styles.ctaText}>{cta}</Text>
          </>
        )}
      </Pressable>

      <Pressable
        onPress={handleRestore}
        disabled={restoring}
        style={styles.restoreButton}
        accessibilityRole="button"
        accessibilityLabel="Restore previous purchase"
      >
        {restoring ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <Text style={styles.restoreText}>Already purchased? Restore</Text>
        )}
      </Pressable>

      {bypassMode ? (
        <View style={styles.bypassPill}>
          <Ionicons name="construct-outline" size={12} color={Colors.warning} />
          <Text style={styles.bypassText}>
            Dev mode: purchases are simulated. Real billing requires a dev build with a Play account.
          </Text>
        </View>
      ) : null}

      <Text style={styles.fineprint}>
        UriScan AI is not a medical device and does not diagnose or treat any condition.
        Refunds are handled by Google Play per their policy.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    ...Shadows.card,
    gap: Spacing.sm,
  },
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  priceLabel: { ...Typography.display, color: Colors.text },
  oneTimePill: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  oneTimeText: { ...Typography.micro, color: Colors.primary, fontWeight: '700' },
  title: { ...Typography.h2, color: Colors.text, marginTop: Spacing.xs },
  subtitle: { ...Typography.body, color: Colors.textMuted, lineHeight: 21 },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  benefits: { gap: Spacing.md },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  benefitIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: { ...Typography.body, color: Colors.text, flex: 1, lineHeight: 21 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#FEE2E2',
    padding: Spacing.md,
    borderRadius: Radii.md,
    marginTop: Spacing.md,
  },
  errorText: { ...Typography.caption, color: Colors.danger, flex: 1 },
  ctaButton: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.base,
    borderRadius: Radii.pill,
    minHeight: 56,
    ...Shadows.raised,
  },
  ctaBusy: { opacity: 0.7 },
  ctaText: { ...Typography.h3, color: '#fff' },
  restoreButton: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  restoreText: { ...Typography.caption, color: Colors.primary, fontWeight: '700' },
  bypassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.md,
    backgroundColor: '#FEF3C7',
    padding: Spacing.sm,
    borderRadius: Radii.md,
  },
  bypassText: { ...Typography.micro, color: Colors.warning, flex: 1, lineHeight: 16 },
  fineprint: {
    ...Typography.micro,
    color: Colors.textMuted,
    marginTop: Spacing.md,
    lineHeight: 16,
  },
});
