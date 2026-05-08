import { create } from 'zustand';
import {
  getHydrationStats,
  getRecentScans,
  getScansForDate,
  getStreak,
  insertScan,
  todayDateString,
} from '@/lib/database';
import type { HydrationResult, HydrationStats, Scan } from '@/types';

interface HydrationStore {
  todayScore: number;
  todayScans: Scan[];
  recentScans: Scan[];
  currentStreak: number;
  stats: HydrationStats;
  isLoading: boolean;
  loadTodayData: () => Promise<void>;
  addScan: (result: HydrationResult) => Promise<{ scanId: number; reportId: string }>;
}

const emptyStats: HydrationStats = { totalScans: 0, averageScore: 0, bestDay: null };

export const useHydrationStore = create<HydrationStore>((set, get) => ({
  todayScore: 0,
  todayScans: [],
  recentScans: [],
  currentStreak: 0,
  stats: emptyStats,
  isLoading: false,

  loadTodayData: async () => {
    set({ isLoading: true });
    try {
      const today = todayDateString();
      const [todayScans, recentScans, currentStreak, stats] = await Promise.all([
        getScansForDate(today),
        getRecentScans(3),
        getStreak(),
        getHydrationStats(),
      ]);
      const latest = todayScans[0];
      set({
        todayScans,
        recentScans,
        currentStreak,
        stats,
        todayScore: latest?.score ?? 0,
        isLoading: false,
      });
    } catch (e) {
      console.warn('loadTodayData failed', e);
      set({ isLoading: false });
    }
  },

  addScan: async (result: HydrationResult) => {
    const { scanId, reportId } = await insertScan(
      result.color,
      result.level,
      result.score,
    );
    await get().loadTodayData();
    return { scanId, reportId };
  },
}));
