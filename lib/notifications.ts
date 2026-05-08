import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type IntervalMinutes = 30 | 60 | 90 | 120 | 180 | 240;

export const INTERVAL_OPTIONS: IntervalMinutes[] = [30, 60, 90, 120, 180, 240];

export type ReminderMode =
  | { type: 'off' }
  | { type: 'preset' }
  | { type: 'interval'; minutes: IntervalMinutes }
  | { type: 'custom'; hours: number[] };

export const PRESET_HOURS = [10, 14, 18] as const;

const REMINDER_TAG = 'uriscan-hydration-reminder';
const PRESET_MESSAGES: Record<number, string> = {
  10: '💧 Morning check-in! How is your hydration today?',
  14: '⏰ Midday reminder: Have you had enough water?',
  18: '🌙 Evening check: Log your final scan for today!',
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function bodyForHour(h: number): string {
  if (h < 12) return '💧 Morning check-in! How is your hydration?';
  if (h < 17) return '⏰ Midday reminder: Have you had enough water?';
  if (h < 21) return '🌙 Evening check-in: keep your hydration on track.';
  return '🌙 Late check-in: a sip of water before bed?';
}

async function ensurePermissions(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('hydration-reminders', {
    name: 'Hydration Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: null,
    vibrationPattern: [0, 250, 250, 250],
  });
}

async function scheduleDaily(hour: number, slot: number, body: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: `${REMINDER_TAG}-daily-${hour}-${slot}`,
    content: {
      title: 'UriScan AI',
      body,
      data: { tag: REMINDER_TAG },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
      channelId: 'hydration-reminders',
    },
  });
}

async function scheduleInterval(minutes: number): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: `${REMINDER_TAG}-interval`,
    content: {
      title: 'UriScan AI',
      body: '💧 Time for a sip of water!',
      data: { tag: REMINDER_TAG },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: minutes * 60,
      repeats: true,
      channelId: 'hydration-reminders',
    },
  });
}

export async function scheduleReminders(mode: ReminderMode): Promise<boolean> {
  await cancelAllReminders();
  if (mode.type === 'off') return true;

  const granted = await ensurePermissions();
  if (!granted) return false;
  await ensureAndroidChannel();

  if (mode.type === 'preset') {
    for (let i = 0; i < PRESET_HOURS.length; i += 1) {
      const h = PRESET_HOURS[i];
      await scheduleDaily(h, i, PRESET_MESSAGES[h]);
    }
  } else if (mode.type === 'custom') {
    const unique = Array.from(new Set(mode.hours)).sort((a, b) => a - b);
    for (let i = 0; i < unique.length; i += 1) {
      await scheduleDaily(unique[i], i, bodyForHour(unique[i]));
    }
  } else {
    await scheduleInterval(mode.minutes);
  }
  return true;
}

export async function cancelAllReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.identifier?.startsWith(REMINDER_TAG)) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
}

export async function areRemindersActive(): Promise<boolean> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.some((n) => n.identifier?.startsWith(REMINDER_TAG));
}

export function describeReminderMode(mode: ReminderMode): string {
  switch (mode.type) {
    case 'off':
      return 'Off';
    case 'preset':
      return 'Preset · 10am, 2pm, 6pm';
    case 'interval':
      return mode.minutes < 60
        ? `Every ${mode.minutes} min`
        : mode.minutes % 60 === 0
          ? `Every ${mode.minutes / 60} hr${mode.minutes / 60 === 1 ? '' : 's'}`
          : `Every ${Math.floor(mode.minutes / 60)}h ${mode.minutes % 60}m`;
    case 'custom': {
      if (mode.hours.length === 0) return 'Custom · no hours selected';
      const sorted = [...mode.hours].sort((a, b) => a - b);
      const formatted = sorted.map(formatHour).join(', ');
      return `Custom · ${formatted}`;
    }
  }
}

export function formatHour(h: number): string {
  const period = h >= 12 ? 'PM' : 'AM';
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}${period.toLowerCase()}`;
}
