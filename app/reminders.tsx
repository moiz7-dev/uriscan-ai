import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTrackerStore } from '@/store/useTrackerStore';
import {
  formatHour,
  INTERVAL_OPTIONS,
  PRESET_HOURS,
  type IntervalMinutes,
  type ReminderMode,
} from '@/lib/notifications';

type ModeType = ReminderMode['type'];

const MODE_OPTIONS: { id: ModeType; label: string; description: string }[] = [
  { id: 'off', label: 'Off', description: 'No reminders' },
  { id: 'preset', label: 'Preset', description: 'Three nudges a day' },
  { id: 'interval', label: 'Interval', description: 'Every N minutes' },
  { id: 'custom', label: 'Custom', description: 'Pick exact hours' },
];

const HOUR_GRID = Array.from({ length: 24 }, (_, i) => i);

export default function RemindersScreen() {
  return (
    <ErrorBoundary>
      <Reminders />
    </ErrorBoundary>
  );
}

function Reminders() {
  const router = useRouter();
  const reminderMode = useTrackerStore((s) => s.reminderMode);
  const setReminderMode = useTrackerStore((s) => s.setReminderMode);

  const [draft, setDraft] = useState<ReminderMode>(reminderMode);
  const [intervalDraft, setIntervalDraft] = useState<IntervalMinutes>(
    reminderMode.type === 'interval' ? reminderMode.minutes : 60,
  );
  const [hoursDraft, setHoursDraft] = useState<number[]>(
    reminderMode.type === 'custom' ? reminderMode.hours : [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function selectMode(type: ModeType) {
    setError(null);
    if (type === 'off') setDraft({ type: 'off' });
    else if (type === 'preset') setDraft({ type: 'preset' });
    else if (type === 'interval')
      setDraft({ type: 'interval', minutes: intervalDraft });
    else setDraft({ type: 'custom', hours: hoursDraft });
  }

  function selectInterval(minutes: IntervalMinutes) {
    setIntervalDraft(minutes);
    setDraft({ type: 'interval', minutes });
  }

  function toggleHour(h: number) {
    const next = hoursDraft.includes(h)
      ? hoursDraft.filter((x) => x !== h)
      : [...hoursDraft, h];
    setHoursDraft(next);
    setDraft({ type: 'custom', hours: next });
  }

  const canSave =
    draft.type !== 'custom' || (draft.type === 'custom' && draft.hours.length > 0);

  async function save() {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      const ok = await setReminderMode(draft);
      if (!ok) {
        setError(
          'Permission was not granted. Allow notifications in system settings.',
        );
        return;
      }
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save reminders.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={8}
        >
          <Ionicons name="close" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Reminders</Text>
        <Pressable
          onPress={save}
          disabled={!canSave || saving}
          style={[styles.saveButton, (!canSave || saving) && styles.disabled]}
          accessibilityRole="button"
          accessibilityLabel="Save reminder settings"
          hitSlop={8}
        >
          <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionLabel}>Mode</Text>
        <View style={styles.modeGrid}>
          {MODE_OPTIONS.map((opt) => {
            const selected = draft.type === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => selectMode(opt.id)}
                style={[styles.modeCard, selected && styles.modeCardSelected]}
                accessibilityRole="radio"
                accessibilityLabel={`${opt.label}: ${opt.description}`}
                accessibilityState={{ selected }}
              >
                <Text
                  style={[
                    styles.modeLabel,
                    selected && styles.modeLabelSelected,
                  ]}
                >
                  {opt.label}
                </Text>
                <Text
                  style={[
                    styles.modeDescription,
                    selected && styles.modeDescriptionSelected,
                  ]}
                >
                  {opt.description}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {draft.type === 'preset' && (
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>Schedule</Text>
            <Text style={styles.detailBody}>
              Three reminders every day at{' '}
              {PRESET_HOURS.map((h) => formatHour(h)).join(', ')}.
            </Text>
          </View>
        )}

        {draft.type === 'interval' && (
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>How often?</Text>
            <View style={styles.chipsRow}>
              {INTERVAL_OPTIONS.map((minutes) => {
                const selected =
                  draft.type === 'interval' && draft.minutes === minutes;
                return (
                  <Pressable
                    key={minutes}
                    onPress={() => selectInterval(minutes)}
                    style={[styles.chip, selected && styles.chipSelected]}
                    accessibilityRole="radio"
                    accessibilityLabel={intervalLabel(minutes)}
                    accessibilityState={{ selected }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextSelected,
                      ]}
                    >
                      {intervalLabel(minutes)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.detailBody}>
              Repeats every {intervalLabel(intervalDraft).toLowerCase()} from
              when you save.
            </Text>
          </View>
        )}

        {draft.type === 'custom' && (
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>Pick hours</Text>
            <Text style={styles.detailBody}>
              Tap the hours you want a reminder. You picked {hoursDraft.length}{' '}
              hour{hoursDraft.length === 1 ? '' : 's'}.
            </Text>
            <View style={styles.hourGrid}>
              {HOUR_GRID.map((h) => {
                const selected = hoursDraft.includes(h);
                return (
                  <Pressable
                    key={h}
                    onPress={() => toggleHour(h)}
                    style={[styles.hourChip, selected && styles.hourChipSelected]}
                    accessibilityRole="checkbox"
                    accessibilityLabel={`Reminder at ${formatHour(h)}`}
                    accessibilityState={{ checked: selected }}
                  >
                    <Text
                      style={[
                        styles.hourText,
                        selected && styles.hourTextSelected,
                      ]}
                    >
                      {formatHour(h)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {hoursDraft.length === 0 && (
              <Text style={styles.warningText}>
                Select at least one hour to save.
              </Text>
            )}
          </View>
        )}

        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={20} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Text style={styles.footnote}>
          Reminders run on your device only. Disable them anytime from system
          settings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function intervalLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} hr${hours === 1 ? '' : 's'}`;
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...Typography.h3, color: Colors.text },
  saveButton: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    backgroundColor: Colors.primary,
    minHeight: 36,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { ...Typography.bodyBold, color: '#fff' },
  disabled: { opacity: 0.45 },

  scroll: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  sectionLabel: {
    ...Typography.micro,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },

  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  modeCard: {
    flexBasis: '47%',
    flexGrow: 1,
    padding: Spacing.base,
    borderRadius: Radii.lg,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  modeCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  modeLabel: { ...Typography.bodyBold, color: Colors.text },
  modeLabelSelected: { color: Colors.primary },
  modeDescription: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  modeDescriptionSelected: { color: Colors.primary, opacity: 0.8 },

  detailCard: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: Spacing.base,
    gap: Spacing.md,
    ...Shadows.card,
  },
  detailTitle: { ...Typography.h3, color: Colors.text },
  detailBody: { ...Typography.body, color: Colors.textMuted, lineHeight: 21 },

  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.pill,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: { ...Typography.bodyBold, color: Colors.text },
  chipTextSelected: { color: '#fff' },

  hourGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  hourChip: {
    width: '14.7%',
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  hourChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  hourText: { ...Typography.caption, color: Colors.text, fontWeight: '600' },
  hourTextSelected: { color: '#fff' },
  warningText: { ...Typography.caption, color: Colors.warning, marginTop: 4 },

  errorCard: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
    padding: Spacing.base,
    borderRadius: Radii.md,
    backgroundColor: '#FEE2E2',
  },
  errorText: { ...Typography.body, color: Colors.danger, flex: 1, lineHeight: 21 },

  footnote: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    lineHeight: 18,
  },
});
