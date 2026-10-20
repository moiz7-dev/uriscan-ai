import Constants from 'expo-constants';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import type { CustomerInfo } from 'react-native-purchases';
import type { PurchaseProvider, PurchaseResult, RestoreResult } from '@/types';
import { PRO_PRICE_FALLBACK_LABEL, PRO_UNLOCK_SKU } from './products';

// Must match the Entitlement identifier in RevenueCat dashboard
const ENTITLEMENT_ID = 'uriscan ai Pro';

const RC_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';

const bypassIap = ((): boolean => {
  if (Constants.appOwnership === 'expo') return true;
  const flag = Constants.expoConfig?.extra?.bypassIap;
  return flag === true;
})();

let initialized = false;
let priceLabel: string | null = null;

function platformProvider(): PurchaseProvider {
  return bypassIap ? 'mock' : 'play_store';
}

function nowIso(): string {
  return new Date().toISOString();
}

function hasPro(info: CustomerInfo): boolean {
  return info.entitlements.active[ENTITLEMENT_ID] != null;
}

export async function initialize(): Promise<void> {
  if (initialized) return;

  if (bypassIap) {
    initialized = true;
    priceLabel = PRO_PRICE_FALLBACK_LABEL;
    return;
  }

  try {
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey: RC_ANDROID_KEY });

    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages[0];
    priceLabel = pkg?.product.priceString ?? PRO_PRICE_FALLBACK_LABEL;
    initialized = true;
  } catch (e) {
    console.warn('RevenueCat init failed', e);
    priceLabel = PRO_PRICE_FALLBACK_LABEL;
    initialized = true;
  }
}

export function getPriceLabel(): string {
  return priceLabel ?? PRO_PRICE_FALLBACK_LABEL;
}

export function isInBypassMode(): boolean {
  return bypassIap;
}

async function mockPurchase(): Promise<PurchaseResult> {
  await new Promise((r) => setTimeout(r, 1500));
  return {
    ok: true,
    txnRef: `mock_${Date.now()}`,
    purchaseToken: `mock_token_${Date.now()}`,
    sku: PRO_UNLOCK_SKU,
    provider: 'mock',
    purchasedAt: nowIso(),
  };
}

export async function purchase(): Promise<PurchaseResult> {
  await initialize();

  if (bypassIap) return mockPurchase();

  try {
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages[0];

    if (!pkg) {
      return {
        ok: false,
        reason: 'unknown',
        message: 'No package available. Check RevenueCat offerings.',
      };
    }

    const { customerInfo } = await Purchases.purchasePackage(pkg);

    if (hasPro(customerInfo)) {
      const ent = customerInfo.entitlements.active[ENTITLEMENT_ID];
      return {
        ok: true,
        txnRef: ent?.productIdentifier ?? PRO_UNLOCK_SKU,
        purchaseToken: ent?.productIdentifier ?? '',
        sku: ent?.productIdentifier ?? PRO_UNLOCK_SKU,
        provider: platformProvider(),
        purchasedAt: ent?.latestPurchaseDate ?? nowIso(),
      };
    }

    return { ok: false, reason: 'unknown', message: 'Entitlement not active after purchase.' };
  } catch (e: unknown) {
    const err = e as { userCancelled?: boolean; message?: string };
    if (err.userCancelled) {
      return { ok: false, reason: 'cancelled', message: 'Purchase cancelled' };
    }
    return { ok: false, reason: 'unknown', message: err.message ?? 'Purchase failed' };
  }
}

export async function restorePurchases(): Promise<RestoreResult> {
  await initialize();

  if (bypassIap) return { ok: true, owned: false, provider: 'mock' };

  try {
    const customerInfo = await Purchases.restorePurchases();

    if (hasPro(customerInfo)) {
      const ent = customerInfo.entitlements.active[ENTITLEMENT_ID];
      return {
        ok: true,
        owned: true,
        provider: 'play_store',
        txnRef: ent?.productIdentifier ?? PRO_UNLOCK_SKU,
        purchaseToken: ent?.productIdentifier ?? '',
        sku: ent?.productIdentifier ?? PRO_UNLOCK_SKU,
        restoredAt: nowIso(),
      };
    }

    return { ok: true, owned: false, provider: 'play_store' };
  } catch (e) {
    console.warn('restorePurchases failed', e);
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Restore failed',
    };
  }
}

// Call on every app launch to sync subscription status from RevenueCat.
// Catches cancellations and renewals that happened while the app was closed.
export async function syncEntitlement(): Promise<{ isPro: boolean }> {
  await initialize();
  if (bypassIap) return { isPro: false };
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return { isPro: hasPro(customerInfo) };
  } catch (e) {
    console.warn('syncEntitlement failed', e);
    return { isPro: false };
  }
}

// RevenueCat manages its own connection lifecycle — no teardown needed
export async function teardown(): Promise<void> {}
