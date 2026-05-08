import { File, Paths } from 'expo-file-system';
import type { ReminderMode } from './notifications';

const SETTINGS_FILENAME = 'uriscan-settings.json';

export interface AppSettings {
  dailyGoalMl: number;
  reminderMode: ReminderMode;
}

const DEFAULTS: AppSettings = {
  dailyGoalMl: 2000,
  reminderMode: { type: 'off' },
};

function settingsFile(): File {
  return new File(Paths.document, SETTINGS_FILENAME);
}

interface RawSettings {
  dailyGoalMl?: number;
  reminderMode?: ReminderMode;
  remindersEnabled?: boolean; // legacy
}

function normalize(raw: RawSettings): AppSettings {
  const dailyGoalMl =
    typeof raw.dailyGoalMl === 'number' ? raw.dailyGoalMl : DEFAULTS.dailyGoalMl;

  let reminderMode: ReminderMode = DEFAULTS.reminderMode;
  if (raw.reminderMode) {
    reminderMode = raw.reminderMode;
  } else if (typeof raw.remindersEnabled === 'boolean') {
    reminderMode = raw.remindersEnabled ? { type: 'preset' } : { type: 'off' };
  }
  return { dailyGoalMl, reminderMode };
}

export async function loadSettings(): Promise<AppSettings> {
  try {
    const file = settingsFile();
    if (!file.exists) return { ...DEFAULTS };
    const raw = await file.text();
    const parsed = JSON.parse(raw) as RawSettings;
    return normalize(parsed);
  } catch {
    return { ...DEFAULTS };
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    const file = settingsFile();
    if (!file.exists) {
      file.create({ overwrite: true });
    }
    file.write(JSON.stringify(settings));
  } catch {
    // settings persistence is non-critical
  }
}
