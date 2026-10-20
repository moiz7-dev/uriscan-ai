import { supabase } from '@/lib/supabase/client';
import type {
  Entitlement,
  HydrationColor,
  HydrationLevel,
  HydrationStats,
  PurchaseProvider,
  Scan,
} from '@/types';

function generateReportId(): string {
  const rand = () => Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
  return `${rand()}${rand()}${rand()}${rand()}`;
}

export function todayDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user?.id;
  if (!uid) throw new Error('Not authenticated');
  return uid;
}

interface ScanRow {
  id: string;
  report_id: string;
  color: HydrationColor;
  level: HydrationLevel;
  score: number;
  timestamp: string;
  notes: string | null;
}

function toScan(row: ScanRow): Scan {
  return {
    id: row.id,
    reportId: row.report_id,
    color: row.color,
    level: row.level,
    score: row.score,
    timestamp: row.timestamp,
    notes: row.notes ?? null,
  };
}

export async function insertScan(
  color: HydrationColor,
  level: HydrationLevel,
  score: number,
  notes: string | null = null,
): Promise<{ scanId: string; reportId: string }> {
  const userId = await getUserId();
  const timestamp = new Date().toISOString();
  const reportId = generateReportId();
  const date = todayDateString();

  const { data, error } = await supabase
    .from('scans')
    .insert({ user_id: userId, report_id: reportId, color, level, score, timestamp, notes, date })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return { scanId: data.id, reportId };
}

export async function getScansForDate(date: string): Promise<Scan[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('scans')
    .select('id, report_id, color, level, score, timestamp, notes')
    .eq('user_id', userId)
    .eq('date', date)
    .order('timestamp', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(toScan);
}

export async function getScansForWeek(): Promise<Scan[]> {
  const userId = await getUserId();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('scans')
    .select('id, report_id, color, level, score, timestamp, notes')
    .eq('user_id', userId)
    .gte('timestamp', sevenDaysAgo.toISOString())
    .order('timestamp', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(toScan);
}

export async function getAllScans(): Promise<Scan[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('scans')
    .select('id, report_id, color, level, score, timestamp, notes')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(toScan);
}

export async function getRecentScans(limit = 3): Promise<Scan[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('scans')
    .select('id, report_id, color, level, score, timestamp, notes')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []).map(toScan);
}

export async function getScanByReportId(reportId: string): Promise<Scan | null> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('scans')
    .select('id, report_id, color, level, score, timestamp, notes')
    .eq('user_id', userId)
    .eq('report_id', reportId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? toScan(data) : null;
}

export async function getScanById(id: string): Promise<Scan | null> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('scans')
    .select('id, report_id, color, level, score, timestamp, notes')
    .eq('user_id', userId)
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? toScan(data) : null;
}

export async function insertWaterLog(amount_ml: number): Promise<string> {
  const userId = await getUserId();
  const now = new Date();
  const { data, error } = await supabase
    .from('water_logs')
    .insert({ user_id: userId, amount_ml, timestamp: now.toISOString(), date: todayDateString(now) })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return data.id;
}

export async function getWaterTotalForDate(date: string): Promise<number> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('water_logs')
    .select('amount_ml')
    .eq('user_id', userId)
    .eq('date', date);

  if (error) throw new Error(error.message);
  const total = (data ?? []).reduce((sum, row) => sum + (row.amount_ml as number), 0);
  return Math.max(0, total);
}

export async function getStreak(): Promise<number> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('scans')
    .select('date')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) return 0;

  const dates = new Set((data ?? []).map((r) => r.date as string));
  if (dates.size === 0) return 0;

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  if (!dates.has(todayDateString(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!dates.has(todayDateString(cursor))) return 0;
  }

  while (dates.has(todayDateString(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export async function getHydrationStats(): Promise<HydrationStats> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('scans')
    .select('score, date')
    .eq('user_id', userId);

  if (error) return { totalScans: 0, averageScore: 0, bestDay: null };

  const rows = data ?? [];
  const totalScans = rows.length;
  const averageScore = totalScans > 0
    ? Math.round(rows.reduce((sum, r) => sum + (r.score as number), 0) / totalScans)
    : 0;

  const byDate: Record<string, number[]> = {};
  for (const row of rows) {
    const d = row.date as string;
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(row.score as number);
  }

  let bestDay: { date: string; score: number } | null = null;
  for (const [date, scores] of Object.entries(byDate)) {
    const max = Math.max(...scores);
    if (!bestDay || max > bestDay.score || (max === bestDay.score && date > bestDay.date)) {
      bestDay = { date, score: max };
    }
  }

  return { totalScans, averageScore, bestDay };
}

export async function getEntitlement(): Promise<Entitlement> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('profiles')
    .select('is_pro, pro_purchased_at, pro_store, pro_sku, pro_txn_ref, pro_purchase_token')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    return { isPro: false, store: null, sku: null, txnRef: null, purchaseToken: null, purchasedAt: null };
  }
  return {
    isPro: (data.is_pro as boolean) ?? false,
    store: (data.pro_store as PurchaseProvider | null) ?? null,
    sku: (data.pro_sku as string | null) ?? null,
    txnRef: (data.pro_txn_ref as string | null) ?? null,
    purchaseToken: (data.pro_purchase_token as string | null) ?? null,
    purchasedAt: (data.pro_purchased_at as string | null) ?? null,
  };
}

export async function setEntitlement(input: {
  isPro: boolean;
  store: PurchaseProvider | null;
  sku: string | null;
  txnRef: string | null;
  purchaseToken: string | null;
  purchasedAt: string | null;
}): Promise<Entitlement> {
  const userId = await getUserId();
  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        user_id: userId,
        is_pro: input.isPro,
        pro_purchased_at: input.purchasedAt,
        pro_store: input.store,
        pro_sku: input.sku,
        pro_txn_ref: input.txnRef,
        pro_purchase_token: input.purchaseToken,
      },
      { onConflict: 'user_id' },
    );

  if (error) console.warn('setEntitlement failed', error.message);
  return getEntitlement();
}
