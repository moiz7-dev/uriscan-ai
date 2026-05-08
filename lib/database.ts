import * as SQLite from 'expo-sqlite';
import type {
  Entitlement,
  HydrationColor,
  HydrationLevel,
  HydrationStats,
  PurchaseProvider,
  Scan,
} from '@/types';

const DB_NAME = 'uriscan.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
}

interface ScanRow {
  id: number;
  report_id: string | null;
  color: HydrationColor;
  level: HydrationLevel;
  score: number;
  timestamp: string;
  notes: string | null;
}

function toScan(row: ScanRow): Scan {
  return {
    id: row.id,
    reportId: row.report_id ?? '',
    color: row.color,
    level: row.level,
    score: row.score,
    timestamp: row.timestamp,
    notes: row.notes,
  };
}

interface EntitlementRow {
  id: number;
  is_pro: number;
  store: PurchaseProvider | null;
  sku: string | null;
  txn_ref: string | null;
  purchase_token: string | null;
  purchased_at: string | null;
  updated_at: string;
}

function toEntitlement(row: EntitlementRow | null): Entitlement {
  if (!row) {
    return {
      isPro: false,
      store: null,
      sku: null,
      txnRef: null,
      purchaseToken: null,
      purchasedAt: null,
    };
  }
  return {
    isPro: row.is_pro === 1,
    store: row.store,
    sku: row.sku,
    txnRef: row.txn_ref,
    purchaseToken: row.purchase_token,
    purchasedAt: row.purchased_at,
  };
}

function generateReportId(): string {
  const rand = () => Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
  return `${rand()}${rand()}${rand()}${rand()}`;
}

async function tableHasColumn(
  db: SQLite.SQLiteDatabase,
  table: string,
  column: string,
): Promise<boolean> {
  const rows = await db.getAllAsync<{ name: string }>(
    `PRAGMA table_info(${table})`,
  );
  return rows.some((r) => r.name === column);
}

async function tableExists(
  db: SQLite.SQLiteDatabase,
  table: string,
): Promise<boolean> {
  const row = await db.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
    table,
  );
  return !!row;
}

export async function initDatabase(): Promise<void> {
  const db = await getDb();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      color TEXT NOT NULL,
      level TEXT NOT NULL,
      score INTEGER NOT NULL,
      timestamp TEXT NOT NULL,
      notes TEXT
    );
    CREATE TABLE IF NOT EXISTS water_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount_ml INTEGER NOT NULL,
      timestamp TEXT NOT NULL,
      date TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_scans_timestamp ON scans(timestamp);
    CREATE INDEX IF NOT EXISTS idx_water_logs_date ON water_logs(date);
    CREATE TABLE IF NOT EXISTS entitlement (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      is_pro INTEGER NOT NULL DEFAULT 0,
      store TEXT,
      sku TEXT,
      txn_ref TEXT,
      purchase_token TEXT,
      purchased_at TEXT,
      updated_at TEXT NOT NULL
    );
  `);

  if (!(await tableHasColumn(db, 'scans', 'report_id'))) {
    await db.execAsync(`ALTER TABLE scans ADD COLUMN report_id TEXT;`);
  }

  await db.execAsync(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_scans_report_id ON scans(report_id);`,
  );

  // Backfill report_id for legacy scans.
  const legacy = await db.getAllAsync<{ id: number }>(
    'SELECT id FROM scans WHERE report_id IS NULL OR report_id = ""',
  );
  for (const row of legacy) {
    await db.runAsync(
      'UPDATE scans SET report_id = ? WHERE id = ?',
      generateReportId(),
      row.id,
    );
  }

  // Ensure exactly one entitlement row exists.
  const existing = await db.getFirstAsync<EntitlementRow>(
    'SELECT * FROM entitlement WHERE id = 1',
  );
  if (!existing) {
    await db.runAsync(
      `INSERT INTO entitlement (id, is_pro, updated_at) VALUES (1, 0, ?)`,
      new Date().toISOString(),
    );
  }

  // Migrate legacy per-report consumable purchases → unlock-all entitlement.
  // If anything was ever bought, treat the user as Pro so testers don't lose access.
  if (await tableExists(db, 'purchases')) {
    const legacyPurchase = await db.getFirstAsync<{
      txn_ref: string | null;
      provider: PurchaseProvider | null;
      purchased_at: string | null;
    }>(
      `SELECT txn_ref, provider, purchased_at
         FROM purchases
        ORDER BY purchased_at DESC
        LIMIT 1`,
    );
    if (legacyPurchase) {
      const current = await db.getFirstAsync<EntitlementRow>(
        'SELECT * FROM entitlement WHERE id = 1',
      );
      if (current && current.is_pro !== 1) {
        await db.runAsync(
          `UPDATE entitlement
              SET is_pro = 1,
                  store = ?,
                  sku = NULL,
                  txn_ref = ?,
                  purchased_at = ?,
                  updated_at = ?
            WHERE id = 1`,
          legacyPurchase.provider,
          legacyPurchase.txn_ref,
          legacyPurchase.purchased_at,
          new Date().toISOString(),
        );
      }
    }
    // Drop the obsolete table now that the migration is applied.
    await db.execAsync(`DROP TABLE IF EXISTS purchases;`);
  }
}

export function todayDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function insertScan(
  color: HydrationColor,
  level: HydrationLevel,
  score: number,
  notes: string | null = null,
): Promise<{ scanId: number; reportId: string }> {
  const db = await getDb();
  const timestamp = new Date().toISOString();
  const reportId = generateReportId();
  const result = await db.runAsync(
    'INSERT INTO scans (color, level, score, timestamp, notes, report_id) VALUES (?, ?, ?, ?, ?, ?)',
    color,
    level,
    score,
    timestamp,
    notes,
    reportId,
  );
  return { scanId: result.lastInsertRowId, reportId };
}

export async function getScansForDate(date: string): Promise<Scan[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ScanRow>(
    "SELECT * FROM scans WHERE substr(timestamp, 1, 10) = ? ORDER BY timestamp DESC",
    date,
  );
  return rows.map(toScan);
}

export async function getScansForWeek(): Promise<Scan[]> {
  const db = await getDb();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  const rows = await db.getAllAsync<ScanRow>(
    'SELECT * FROM scans WHERE timestamp >= ? ORDER BY timestamp ASC',
    sevenDaysAgo.toISOString(),
  );
  return rows.map(toScan);
}

export async function getAllScans(): Promise<Scan[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ScanRow>(
    'SELECT * FROM scans ORDER BY timestamp DESC',
  );
  return rows.map(toScan);
}

export async function getRecentScans(limit = 3): Promise<Scan[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ScanRow>(
    'SELECT * FROM scans ORDER BY timestamp DESC LIMIT ?',
    limit,
  );
  return rows.map(toScan);
}

export async function getScanByReportId(reportId: string): Promise<Scan | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ScanRow>(
    'SELECT * FROM scans WHERE report_id = ?',
    reportId,
  );
  return row ? toScan(row) : null;
}

export async function getScanById(id: number): Promise<Scan | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ScanRow>(
    'SELECT * FROM scans WHERE id = ?',
    id,
  );
  return row ? toScan(row) : null;
}

export async function insertWaterLog(amount_ml: number): Promise<number> {
  const db = await getDb();
  const now = new Date();
  const result = await db.runAsync(
    'INSERT INTO water_logs (amount_ml, timestamp, date) VALUES (?, ?, ?)',
    amount_ml,
    now.toISOString(),
    todayDateString(now),
  );
  return result.lastInsertRowId;
}

export async function getWaterTotalForDate(date: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ total: number | null }>(
    'SELECT COALESCE(SUM(amount_ml), 0) as total FROM water_logs WHERE date = ?',
    date,
  );
  return row?.total ?? 0;
}

export async function getStreak(): Promise<number> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ d: string }>(
    'SELECT DISTINCT substr(timestamp, 1, 10) as d FROM scans ORDER BY d DESC',
  );
  if (rows.length === 0) return 0;

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  const dates = new Set(rows.map((r) => r.d));

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
  const db = await getDb();
  const totals = await db.getFirstAsync<{ total: number; avg: number | null }>(
    'SELECT COUNT(*) as total, AVG(score) as avg FROM scans',
  );
  const best = await db.getFirstAsync<{ d: string; s: number }>(
    `SELECT substr(timestamp, 1, 10) as d, MAX(score) as s
       FROM scans
      GROUP BY substr(timestamp, 1, 10)
      ORDER BY s DESC, d DESC
      LIMIT 1`,
  );
  return {
    totalScans: totals?.total ?? 0,
    averageScore: Math.round(totals?.avg ?? 0),
    bestDay: best ? { date: best.d, score: best.s } : null,
  };
}

export async function getEntitlement(): Promise<Entitlement> {
  const db = await getDb();
  const row = await db.getFirstAsync<EntitlementRow>(
    'SELECT * FROM entitlement WHERE id = 1',
  );
  return toEntitlement(row ?? null);
}

export async function setEntitlement(input: {
  isPro: boolean;
  store: PurchaseProvider | null;
  sku: string | null;
  txnRef: string | null;
  purchaseToken: string | null;
  purchasedAt: string | null;
}): Promise<Entitlement> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE entitlement
        SET is_pro = ?,
            store = ?,
            sku = ?,
            txn_ref = ?,
            purchase_token = ?,
            purchased_at = ?,
            updated_at = ?
      WHERE id = 1`,
    input.isPro ? 1 : 0,
    input.store,
    input.sku,
    input.txnRef,
    input.purchaseToken,
    input.purchasedAt,
    new Date().toISOString(),
  );
  return getEntitlement();
}
