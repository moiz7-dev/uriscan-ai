import { create } from 'zustand';
import {
  getWaterTotalForDate,
  insertWaterLog,
  todayDateString,
} from '@/lib/database';
import {
  loadSettings,
  saveSettings,
  type AppSettings,
} from '@/lib/settings';
import {
  areRemindersActive,
  scheduleReminders,
  type ReminderMode,
} from '@/lib/notifications';

const GLASS_ML = 250;
const GLASS_COUNT = 8;

function glassesFromMl(ml: number): boolean[] {
  const filled = Math.min(GLASS_COUNT, Math.floor(ml / GLASS_ML));
  return Array.from({ length: GLASS_COUNT }, (_, i) => i < filled);
}

interface TrackerStore {
  dailyGoalMl: number;
  todayIntakeMl: number;
  glasses: boolean[];
  reminderMode: ReminderMode;
  isHydrated: boolean;

  hydrateFromStorage: () => Promise<void>;
  loadTodayIntake: () => Promise<void>;
  addWater: (amount_ml: number) => Promise<void>;
  toggleGlass: (index: number) => Promise<void>;
  setDailyGoal: (ml: number) => Promise<void>;
  setReminderMode: (mode: ReminderMode) => Promise<boolean>;
}

export const GLASS_ML_VALUE = GLASS_ML;
export const GLASS_COUNT_VALUE = GLASS_COUNT;

let waterQueue: Promise<unknown> = Promise.resolve();

function queueWaterOp<T>(op: () => Promise<T>): Promise<T> {
  const next = waterQueue.then(op, op);
  waterQueue = next.catch(() => undefined);
  return next;
}

export const useTrackerStore = create<TrackerStore>((set, get) => ({
  dailyGoalMl: 2000,
  todayIntakeMl: 0,
  glasses: Array.from({ length: GLASS_COUNT }, () => false),
  reminderMode: { type: 'off' },
  isHydrated: false,

  hydrateFromStorage: async () => {
    const [settings, active] = await Promise.all([
      loadSettings(),
      areRemindersActive(),
    ]);
    const mode: ReminderMode =
      active && settings.reminderMode.type !== 'off'
        ? settings.reminderMode
        : { type: 'off' };
    set({
      dailyGoalMl: settings.dailyGoalMl,
      reminderMode: mode,
      isHydrated: true,
    });
    await get().loadTodayIntake();
  },

  loadTodayIntake: async () => {
    const today = todayDateString();
    const total = await getWaterTotalForDate(today);
    set({ todayIntakeMl: total, glasses: glassesFromMl(total) });
  },

  addWater: (amount_ml: number) =>
    queueWaterOp(async () => {
      if (amount_ml <= 0) return;
      await insertWaterLog(amount_ml);
      await get().loadTodayIntake();
    }),

  toggleGlass: (index: number) =>
    queueWaterOp(async () => {
      const today = todayDateString();
      const current = await getWaterTotalForDate(today);
      const isFilled = current >= (index + 1) * GLASS_ML;
      const target = isFilled ? index * GLASS_ML : (index + 1) * GLASS_ML;
      const delta = target - current;
      if (delta !== 0) {
        await insertWaterLog(delta);
      }
      await get().loadTodayIntake();
    }),

  setDailyGoal: async (ml: number) => {
    const safe = Math.max(500, Math.min(5000, Math.round(ml)));
    set({ dailyGoalMl: safe });
    const next: AppSettings = {
      dailyGoalMl: safe,
      reminderMode: get().reminderMode,
    };
    await saveSettings(next);
  },

  setReminderMode: async (mode: ReminderMode) => {
    const ok = await scheduleReminders(mode);
    const finalMode: ReminderMode = ok ? mode : { type: 'off' };
    set({ reminderMode: finalMode });
    const next: AppSettings = {
      dailyGoalMl: get().dailyGoalMl,
      reminderMode: finalMode,
    };
    await saveSettings(next);
    return ok;
  },
}));
