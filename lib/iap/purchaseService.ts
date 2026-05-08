import Constants from 'expo-constants';
import * as IAP from 'expo-iap';
import type { Purchase } from 'expo-iap';
import type { PurchaseProvider, PurchaseResult, RestoreResult } from '@/types';
import {
  LEGACY_DETAILED_REPORT_SKU,
  PRO_PRICE_FALLBACK_LABEL,
  PRO_UNLOCK_SKU,
} from './products';

interface IapErrorLike {
  code?: string;
  message?: string;
}

interface Pending {
  resolve: (r: PurchaseResult) => void;
  startedAt: number;
}

let pending: Pending | null = null;
let initialized = false;
let initializing: Promise<void> | null = null;
let priceLabel: string | null = null;
let listenerHandles: { remove: () => void }[] = [];

const bypassIap = ((): boolean => {
  // Expo Go can't run native IAP modules.
  if (Constants.appOwnership === 'expo') return true;
  const flag = Constants.expoConfig?.extra?.bypassIap;
  return flag === true;
})();

function platformProvider(): PurchaseProvider {
  return bypassIap ? 'mock' : 'play_store';
}

function nowIso(): string {
  return new Date().toISOString();
}

function resolvePending(result: PurchaseResult) {
  if (!pending) return;
  const p = pending;
  pending = null;
  p.resolve(result);
}

interface AndroidPurchaseFields {
  id?: string;
  purchaseToken?: string;
  productId?: string;
}

function purchaseTxnRef(p: Purchase): string {
  return (p as AndroidPurchaseFields).id ?? `${Date.now()}`;
}

function purchaseToken(p: Purchase): string {
  return (p as AndroidPurchaseFields).purchaseToken ?? '';
}

function purchaseSku(p: Purchase): string {
  return (p as AndroidPurchaseFields).productId ?? '';
}

async function handlePurchaseUpdated(p: Purchase) {
  // Non-consumable: still call finishTransaction with isConsumable:false so the
  // store acknowledges the purchase but does NOT consume it (preserves restore).
  try {
    await IAP.finishTransaction({ purchase: p, isConsumable: false });
  } catch (e) {
    console.warn('finishTransaction failed', e);
  }
  resolvePending({
    ok: true,
    txnRef: purchaseTxnRef(p),
    purchaseToken: purchaseToken(p),
    sku: purchaseSku(p) || PRO_UNLOCK_SKU,
    provider: platformProvider(),
    purchasedAt: nowIso(),
  });
}

function mapErrorReason(
  err: IapErrorLike,
): 'cancelled' | 'network' | 'declined' | 'unknown' {
  const code = String(err.code ?? '').toLowerCase();
  if (code.includes('cancel') || code.includes('user_cancelled')) return 'cancelled';
  if (code.includes('network') || code.includes('connection')) return 'network';
  if (code.includes('payment') || code.includes('billing') || code.includes('declined'))
    return 'declined';
  return 'unknown';
}

function handlePurchaseError(err: IapErrorLike) {
  resolvePending({
    ok: false,
    reason: mapErrorReason(err),
    message: err.message ?? 'Purchase failed',
  });
}

export async function initialize(): Promise<void> {
  if (initialized) return;
  if (initializing) return initializing;

  if (bypassIap) {
    initialized = true;
    priceLabel = PRO_PRICE_FALLBACK_LABEL;
    return;
  }

  initializing = (async () => {
    try {
      await IAP.initConnection();
      const updated = IAP.purchaseUpdatedListener(handlePurchaseUpdated);
      const errored = IAP.purchaseErrorListener(handlePurchaseError);
      listenerHandles.push(updated, errored);

      try {
        const products = await IAP.fetchProducts({
          skus: [PRO_UNLOCK_SKU],
          type: 'in-app',
        });
        const product = Array.isArray(products) ? products[0] : null;
        if (product && typeof product === 'object') {
          priceLabel =
            (product as { displayPrice?: string }).displayPrice ??
            (product as { localizedPrice?: string }).localizedPrice ??
            PRO_PRICE_FALLBACK_LABEL;
        } else {
          priceLabel = PRO_PRICE_FALLBACK_LABEL;
        }
      } catch (e) {
        console.warn('fetchProducts failed', e);
        priceLabel = PRO_PRICE_FALLBACK_LABEL;
      }

      initialized = true;
    } catch (e) {
      console.warn('IAP init failed', e);
      priceLabel = PRO_PRICE_FALLBACK_LABEL;
      initialized = true;
    } finally {
      initializing = null;
    }
  })();

  return initializing;
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

  if (pending) {
    return {
      ok: false,
      reason: 'unknown',
      message: 'Another purchase is in progress.',
    };
  }

  if (bypassIap) {
    return mockPurchase();
  }

  return new Promise<PurchaseResult>((resolve) => {
    pending = { resolve, startedAt: Date.now() };
    IAP.requestPurchase({
      request: { android: { skus: [PRO_UNLOCK_SKU] } },
      type: 'in-app',
    }).catch((e: unknown) => {
      const message =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : 'Purchase failed';
      resolvePending({ ok: false, reason: 'unknown', message });
    });
  });
}

/**
 * Queries the store for purchases the current Play account already owns.
 * On reinstall (same Google account) this is what makes the entitlement come back.
 * Also accepts the legacy per-report SKU so testers from the old model don't lose access.
 */
export async function restorePurchases(): Promise<RestoreResult> {
  await initialize();

  if (bypassIap) {
    return { ok: true, owned: false, provider: 'mock' };
  }

  try {
    const purchases = await IAP.getAvailablePurchases();
    const list = Array.isArray(purchases) ? purchases : [];
    const owned = list.find((p) => {
      const sku = purchaseSku(p);
      return sku === PRO_UNLOCK_SKU || sku === LEGACY_DETAILED_REPORT_SKU;
    });
    if (!owned) {
      return { ok: true, owned: false, provider: 'play_store' };
    }
    return {
      ok: true,
      owned: true,
      provider: 'play_store',
      txnRef: purchaseTxnRef(owned),
      purchaseToken: purchaseToken(owned),
      sku: purchaseSku(owned) || PRO_UNLOCK_SKU,
      restoredAt: nowIso(),
    };
  } catch (e) {
    console.warn('restorePurchases failed', e);
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Restore failed',
    };
  }
}

export async function teardown(): Promise<void> {
  for (const h of listenerHandles) {
    try {
      h.remove();
    } catch {}
  }
  listenerHandles = [];
  if (initialized && !bypassIap) {
    try {
      await IAP.endConnection();
    } catch {}
  }
  initialized = false;
}
