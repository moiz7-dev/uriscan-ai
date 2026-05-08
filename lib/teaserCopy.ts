import type { HydrationLevel } from '@/types';

export const LEVEL_INDEX: Record<HydrationLevel, number> = {
  overhydrated: 1,
  optimal: 2,
  mild: 3,
  moderate: 4,
  severe: 5,
  warning: 6,
};

export const LEVEL_TOTAL = 8; // matches the 8-color picker scale

const HOOKS: Record<HydrationLevel, string[]> = {
  overhydrated: [
    'Your kidneys are working overtime — the report shows what to scale back, and when.',
    'Cleaner is not always better. Your report flags one thing most people miss.',
    'You are closer to a hidden imbalance than you would guess. The fix is two lines long.',
  ],
  optimal: [
    'You hit the sweet spot today. The detailed report shows the 3 habits keeping you here.',
    'Most people lose this in 4 hours. Inside: how to hold it through the day.',
    'Your body is in the green zone — but for how long? Your 7-day pattern reveals it.',
  ],
  mild: [
    'There is a 90-minute window to fix this. Your report has the exact plan.',
    'A small dip — but your last 7 scans suggest a pattern. See it inside.',
    'One drink, one nudge, and you are back. The report tells you which drink, when.',
  ],
  moderate: [
    'Your body is sending a clear signal. The report decodes what it is actually asking for.',
    'It is not just water you are missing. Open the report to see what else.',
    'You have crossed a line your last 3 scans warned about. Here is the way back.',
  ],
  severe: [
    'Your body is in a stress state right now. The report has a 60-minute recovery plan.',
    'This level affects more than thirst — energy, focus, skin. See the full picture inside.',
    'You are one step from a hard reset day. The report shows how to avoid it.',
  ],
  warning: [
    'Important findings inside. Please review the report and consider speaking with a doctor.',
    'Your report flags symptoms to monitor and questions to bring to a clinician.',
    'Open the full report for a checklist to share with a healthcare professional.',
  ],
};

const PAYWALL_CTAS: Record<HydrationLevel, string> = {
  overhydrated: 'Unlock Pro — ',
  optimal: 'Unlock Pro — ',
  mild: 'Unlock Pro — ',
  moderate: 'Unlock Pro — ',
  severe: 'Unlock Pro — ',
  warning: 'Unlock Pro + Clinician Checklist — ',
};

function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export function getTeaserHook(level: HydrationLevel, reportId: string): string {
  const pool = HOOKS[level];
  const idx = hashString(reportId) % pool.length;
  return pool[idx];
}

export function getPaywallCta(level: HydrationLevel, priceLabel: string): string {
  return `${PAYWALL_CTAS[level]}${priceLabel}`;
}

export function getLevelIndex(level: HydrationLevel): number {
  return LEVEL_INDEX[level];
}

export const TEASER_SECTION_TITLES: string[] = [
  'Your hydration verdict',
  'Today vs. your 7-day average',
  '24-hour recovery plan',
  'What this level affects',
  'Electrolyte & food cues',
  '7-day pattern insights',
  'Lifestyle nudges',
];
