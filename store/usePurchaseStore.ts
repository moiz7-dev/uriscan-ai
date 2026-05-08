import { create } from 'zustand';
import * as Haptics from 'expo-haptics';
import { getEntitlement, setEntitlement } from '@/lib/database';
import {
  getPriceLabel,
  initialize as initIap,
  isInBypassMode,
  purchase as runPurchase,
  restorePurchases as runRestore,
} from '@/lib/iap/purchaseService';
import type { Entitlement, PurchaseResult, RestoreResult } from '@/types';

type InFlightStatus = 'idle' | 'pending' | 'success' | 'error';

interface PurchaseStore {
  isPro: boolean;
  entitlement: Entitlement;
  inFlight: InFlightStatus;
  restoreInFlight: InFlightStatus;
  lastError: string | null;
  productPriceLabel: string | null;
  bypassMode: boolean;

  loadEntitlement: () => Promise<void>;
  hydrateProductInfo: () => Promise<void>;
  purchase: () => Promise<PurchaseResult>;
  restore: () => Promise<RestoreResult>;
  clearError: () => void;
}

const emptyEntitlement: Entitlement = {
  isPro: false,
  store: null,
  sku: null,
  txnRef: null,
  purchaseToken: null,
  purchasedAt: null,
};

export const usePurchaseStore = create<PurchaseStore>((set, get) => ({
  isPro: false,
  entitlement: emptyEntitlement,
  inFlight: 'idle',
  restoreInFlight: 'idle',
  lastError: null,
  productPriceLabel: null,
  bypassMode: isInBypassMode(),

  loadEntitlement: async () => {
    try {
      const e = await getEntitlement();
      set({ entitlement: e, isPro: e.isPro });
    } catch (e) {
      console.warn('loadEntitlement failed', e);
    }
  },

  hydrateProductInfo: async () => {
    try {
      await initIap();
      set({ productPriceLabel: getPriceLabel() });
    } catch (e) {
      console.warn('hydrateProductInfo failed', e);
    }
  },

  purchase: async () => {
    const current = get();
    if (current.isPro) {
      return {
        ok: true,
        txnRef: current.entitlement.txnRef ?? 'already_owned',
        purchaseToken: current.entitlement.purchaseToken ?? '',
        sku: current.entitlement.sku ?? 'pro_unlock',
        provider: current.entitlement.store ?? 'mock',
        purchasedAt: current.entitlement.purchasedAt ?? new Date().toISOString(),
      };
    }
    if (current.inFlight === 'pending') {
      return {
        ok: false,
        reason: 'unknown',
        message: 'Purchase already in progress',
      };
    }

    set({ inFlight: 'pending', lastError: null });

    const result = await runPurchase();

    if (result.ok) {
      try {
        const updated = await setEntitlement({
          isPro: true,
          store: result.provider,
          sku: result.sku,
          txnRef: result.txnRef,
          purchaseToken: result.purchaseToken,
          purchasedAt: result.purchasedAt,
        });
        set({ entitlement: updated, isPro: true, inFlight: 'success' });
      } catch (e) {
        console.warn('persist entitlement failed', e);
        set({ inFlight: 'success' });
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      set({ inFlight: 'error', lastError: result.message });
      if (result.reason !== 'cancelled') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }

    return result;
  },

  restore: async () => {
    if (get().restoreInFlight === 'pending') {
      return { ok: false, message: 'Restore already in progress' };
    }
    set({ restoreInFlight: 'pending', lastError: null });

    const result = await runRestore();

    if (result.ok && result.owned) {
      try {
        const updated = await setEntitlement({
          isPro: true,
          store: result.provider,
          sku: result.sku,
          txnRef: result.txnRef,
          purchaseToken: result.purchaseToken,
          purchasedAt: result.restoredAt,
        });
        set({ entitlement: updated, isPro: true, restoreInFlight: 'success' });
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        console.warn('persist restored entitlement failed', e);
        set({ restoreInFlight: 'success' });
      }
    } else if (result.ok) {
      // Successful query, but the user does not own the SKU.
      // If we previously thought they were Pro (e.g. refund), revoke locally.
      if (get().isPro) {
        const updated = await setEntitlement({
          isPro: false,
          store: null,
          sku: null,
          txnRef: null,
          purchaseToken: null,
          purchasedAt: null,
        });
        set({ entitlement: updated, isPro: false });
      }
      set({ restoreInFlight: 'success' });
    } else {
      set({ restoreInFlight: 'error', lastError: result.message });
    }

    return result;
  },

  clearError: () => set({ lastError: null }),
}));
