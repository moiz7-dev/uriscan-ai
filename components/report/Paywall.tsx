import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { usePurchaseStore } from '@/store/usePurchaseStore';
import { PRO_PRICE_FALLBACK_LABEL } from '@/lib/iap/products';
import type { HydrationLevel } from '@/types';

interface Props {
  level: HydrationLevel;
  onUnlocked: () => void;
}

const BENEFITS = [
  { icon: 'infinite-outline',       text: 'Unlimited detailed reports on every scan' },
  { icon: 'document-text-outline',  text: 'Full hydration verdict with clinical color analysis' },
  { icon: 'pulse-outline',          text: 'Today vs. your 7-day average with sparkline chart' },
  { icon: 'time-outline',           text: '24-hour recovery plan, step by step' },
  { icon: 'body-outline',           text: 'Body impact — kidneys, skin, brain, energy' },
  { icon: 'download-outline',       text: 'Downloadable PDF you can save or share' },
] as const;

export function Paywall({ level, onUnlocked }: Props) {
  const purchase           = usePurchaseStore((s) => s.purchase);
  const restore            = usePurchaseStore((s) => s.restore);
  const inFlight           = usePurchaseStore((s) => s.inFlight);
  const restoreInFlight    = usePurchaseStore((s) => s.restoreInFlight);
  const lastError          = usePurchaseStore((s) => s.lastError);
  const productPriceLabel  = usePurchaseStore((s) => s.productPriceLabel);
  const bypassMode         = usePurchaseStore((s) => s.bypassMode);
  const hydrateProductInfo = usePurchaseStore((s) => s.hydrateProductInfo);
  const clearError         = usePurchaseStore((s) => s.clearError);

  const [localBusy, setLocalBusy] = useState(false);

  useEffect(() => {
    if (!productPriceLabel) hydrateProductInfo();
  }, [productPriceLabel, hydrateProductInfo]);

  const priceLabel = productPriceLabel ?? PRO_PRICE_FALLBACK_LABEL;
  const busy       = localBusy || inFlight === 'pending';
  const restoring  = restoreInFlight === 'pending';
  const isWarning  = level === 'warning';

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
      {/* ── Price header ── */}
      <View style={styles.priceHeader}>
        <Text style={styles.priceLabel} adjustsFontSizeToFit numberOfLines={1}>
          {priceLabel}
        </Text>
        <View style={styles.billingPill}>
          <Text style={styles.billingText}>Monthly · Cancel anytime</Text>
        </View>
      </View>

      {/* ── Title ── */}
      <Text style={styles.title}>Unlock UriScan Pro</Text>

      {/* ── Warning clinician badge ── */}
      {isWarning && (
        <View style={styles.warningBadge}>
          <Ionicons name="medical" size={14} color="#B91C1C" />
          <Text style={styles.warningBadgeText}>
            Includes clinician checklist for this color range
          </Text>
        </View>
      )}

      <View style={styles.divider} />

      {/* ── Benefits list ── */}
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

      {/* ── Error banner ── */}
      {lastError && inFlight === 'error' ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={Colors.danger} />
          <Text style={styles.errorText}>{lastError}</Text>
          <Pressable onPress={clearError} hitSlop={8}>
            <Ionicons name="close" size={14} color={Colors.danger} />
          </Pressable>
        </View>
      ) : null}

      {/* ── CTA button ── */}
      <Pressable
        onPress={handlePurchase}
        disabled={busy}
        style={[styles.ctaButton, busy && styles.ctaBusy]}
        accessibilityRole="button"
        accessibilityLabel={`Unlock UriScan Pro for ${priceLabel} per month`}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={styles.ctaInner}>
            <View style={styles.ctaTopRow}>
              <Ionicons name="lock-open-outline" size={20} color="#fff" />
              <Text style={styles.ctaTitle}>Unlock UriScan Pro</Text>
            </View>
            <Text style={styles.ctaSubtitle}>{priceLabel} / month · Cancel anytime</Text>
          </View>
        )}
      </Pressable>

      {/* ── Restore ── */}
      <Pressable
        onPress={handleRestore}
        disabled={restoring}
        style={styles.restoreButton}
        accessibilityRole="button"
        accessibilityLabel="Restore previous purchase"
      >
        {restoring ? (
          <ActivityIndicator color={Colors.primary} size="small" />
        ) : (
          <Text style={styles.restoreText}>Already purchased? Restore</Text>
        )}
      </Pressable>

      {/* ── Dev bypass indicator ── */}
      {bypassMode ? (
        <View style={styles.bypassPill}>
          <Ionicons name="construct-outline" size={12} color={Colors.warning} />
          <Text style={styles.bypassText}>
            Dev mode — purchases are simulated. Real billing requires a dev build.
          </Text>
        </View>
      ) : null}

      {/* ── Fine print ── */}
      <Text style={styles.fineprint}>
        UriScan AI uses AI to generate wellness reports. It is not an official diagnostic tool
        and does not diagnose or treat any condition.{'\n'}
        Subscription renews monthly. Cancel anytime via Google Play.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    ...Shadows.card,
  },

  /* Price header */
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  priceLabel: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  billingPill: {
    backgroundColor: Colors.accentCyanLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  billingText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
    letterSpacing: 0.2,
  },

  /* Title */
  title: {
    ...Typography.h2,
    color: Colors.text,
    marginTop: Spacing.base,
  },

  /* Warning badge */
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    backgroundColor: '#FEE2E2',
    paddingVertical: 7,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.md,
  },
  warningBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B91C1C',
    flex: 1,
    lineHeight: 17,
  },

  /* Divider */
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.lg,
  },

  /* Benefits */
  benefits: { gap: Spacing.base },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  benefitIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  benefitText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
    lineHeight: 20,
    paddingTop: 6,
  },

  /* Error banner */
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#FEE2E2',
    padding: Spacing.md,
    borderRadius: Radii.md,
    marginTop: Spacing.lg,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    flex: 1,
    lineHeight: 17,
  },

  /* CTA button */
  ctaButton: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.pill,
    minHeight: 64,
    ...Shadows.raised,
  },
  ctaBusy: { opacity: 0.7 },
  ctaInner: {
    alignItems: 'center',
    gap: 4,
  },
  ctaTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  ctaTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.1,
  },
  ctaSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.82)',
    fontWeight: '500',
    letterSpacing: 0.1,
  },

  /* Restore */
  restoreButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  restoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },

  /* Dev bypass */
  bypassPill: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: Spacing.md,
    backgroundColor: '#FEF3C7',
    padding: Spacing.sm,
    borderRadius: Radii.md,
  },
  bypassText: {
    fontSize: 11,
    color: Colors.warning,
    flex: 1,
    lineHeight: 16,
  },

  /* Fine print */
  fineprint: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: Spacing.lg,
    lineHeight: 17,
    textAlign: 'center',
  },
});
