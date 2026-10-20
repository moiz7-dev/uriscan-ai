export type HydrationColor =
  | 'clear'
  | 'pale-yellow'
  | 'light-yellow'
  | 'straw'
  | 'yellow'
  | 'dark-yellow'
  | 'honey'
  | 'amber'
  | 'orange'
  | 'orange-red'
  | 'brown'
  | 'dark-brown'
  | 'red'
  | 'pink'
  | 'cloudy'
  | 'green';

export type HydrationLevel =
  | 'overhydrated'
  | 'optimal'
  | 'mild'
  | 'moderate'
  | 'severe'
  | 'warning';

export interface HydrationResult {
  color: HydrationColor;
  level: HydrationLevel;
  score: number;
  title: string;
  message: string;
  action: string;
  waterAdvice: string;
  colorHex: string;
  shouldSeeDoctor: boolean;
  actionSteps: string[];
  causes: string[];
}

export interface Scan {
  id: string;
  reportId: string;
  color: HydrationColor;
  level: HydrationLevel;
  score: number;
  timestamp: string;
  notes: string | null;
}

export interface WaterLog {
  id: number;
  amount_ml: number;
  timestamp: string;
  date: string;
}

export interface HydrationStats {
  totalScans: number;
  averageScore: number;
  bestDay: { date: string; score: number } | null;
}

export type PurchaseProvider = 'play_store' | 'mock';

export interface Entitlement {
  isPro: boolean;
  store: PurchaseProvider | null;
  sku: string | null;
  txnRef: string | null;
  purchaseToken: string | null;
  purchasedAt: string | null;
}

export type PurchaseResult =
  | {
      ok: true;
      txnRef: string;
      purchaseToken: string;
      sku: string;
      provider: PurchaseProvider;
      purchasedAt: string;
    }
  | {
      ok: false;
      reason: 'cancelled' | 'network' | 'declined' | 'unknown';
      message: string;
    };

export type RestoreResult =
  | {
      ok: true;
      owned: false;
      provider: PurchaseProvider;
    }
  | {
      ok: true;
      owned: true;
      provider: PurchaseProvider;
      txnRef: string;
      purchaseToken: string;
      sku: string;
      restoredAt: string;
    }
  | {
      ok: false;
      message: string;
    };

export interface BodySystemImpact {
  system: 'Kidneys' | 'Skin' | 'Brain' | 'Energy';
  icon: string;
  impact: string;
}

export interface RecoveryStep {
  whenLabel: string;
  text: string;
}

export interface SparkPoint {
  date: string;
  score: number;
}

export interface DetailedReportData {
  reportId: string;
  scanId: string;
  generatedAt: string;
  color: HydrationColor;
  colorHex: string;
  colorLabel: string;
  level: HydrationLevel;
  levelColor: string;
  levelIndex: number;
  levelTotal: number;
  score: number;
  title: string;
  message: string;
  waterAdvice: string;
  shouldSeeDoctor: boolean;
  actionSteps: string[];
  causes: string[];
  sevenDayAverage: number;
  sevenDayPattern: string;
  spark: SparkPoint[];
  recoveryPlan: RecoveryStep[];
  bodyImpact: BodySystemImpact[];
  electrolyteCue: string;
  lifestyleNudges: string[];
  doctorChecklist: string[] | null;
  appVersion: string;
}
