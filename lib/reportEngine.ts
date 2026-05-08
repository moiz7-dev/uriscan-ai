import Constants from 'expo-constants';
import { format } from 'date-fns';
import {
  COLOR_SWATCHES,
  HYDRATION_DATA,
  getLevelColor,
} from '@/constants/hydrationData';
import { LEVEL_TOTAL, getLevelIndex } from '@/lib/teaserCopy';
import type {
  BodySystemImpact,
  DetailedReportData,
  HydrationLevel,
  RecoveryStep,
  Scan,
  SparkPoint,
} from '@/types';

const BODY_IMPACT_TABLE: Record<HydrationLevel, BodySystemImpact[]> = {
  overhydrated: [
    {
      system: 'Kidneys',
      icon: 'water',
      impact: 'Filtering more fluid than usual; sodium can dip if intake stays high.',
    },
    {
      system: 'Skin',
      icon: 'sparkles',
      impact: 'Often fine, but persistent overhydration can dilute electrolyte balance.',
    },
    {
      system: 'Brain',
      icon: 'bulb',
      impact: 'Mild fatigue or fog can appear if sodium drops below normal.',
    },
    {
      system: 'Energy',
      icon: 'flash',
      impact: 'Frequent bathroom breaks can disrupt focus and rest.',
    },
  ],
  optimal: [
    {
      system: 'Kidneys',
      icon: 'water',
      impact: 'Operating at a comfortable pace — efficient filtration.',
    },
    {
      system: 'Skin',
      icon: 'sparkles',
      impact: 'Best window for elasticity and a clearer complexion.',
    },
    {
      system: 'Brain',
      icon: 'bulb',
      impact: 'Concentration and short-term memory tend to peak around this level.',
    },
    {
      system: 'Energy',
      icon: 'flash',
      impact: 'Energy is steady; thermoregulation works normally.',
    },
  ],
  mild: [
    {
      system: 'Kidneys',
      icon: 'water',
      impact: 'Concentrating urine slightly to conserve water.',
    },
    {
      system: 'Skin',
      icon: 'sparkles',
      impact: 'Minor loss of suppleness; lips may feel drier.',
    },
    {
      system: 'Brain',
      icon: 'bulb',
      impact: 'Light fatigue and small dips in focus can begin.',
    },
    {
      system: 'Energy',
      icon: 'flash',
      impact: 'You may feel a small afternoon slump if you wait too long to drink.',
    },
  ],
  moderate: [
    {
      system: 'Kidneys',
      icon: 'water',
      impact: 'Working harder to retain fluid; output reduces noticeably.',
    },
    {
      system: 'Skin',
      icon: 'sparkles',
      impact: 'Less elasticity; under-eyes and lips show it first.',
    },
    {
      system: 'Brain',
      icon: 'bulb',
      impact: 'Headache risk increases; reaction time slows.',
    },
    {
      system: 'Energy',
      icon: 'flash',
      impact: 'Heart rate can rise to compensate; workouts feel harder.',
    },
  ],
  severe: [
    {
      system: 'Kidneys',
      icon: 'water',
      impact: 'Stress mode — strongly conserving water and electrolytes.',
    },
    {
      system: 'Skin',
      icon: 'sparkles',
      impact: 'Skin tents on pinch test; warmth and dryness common.',
    },
    {
      system: 'Brain',
      icon: 'bulb',
      impact: 'Headache, dizziness, and irritability are typical at this level.',
    },
    {
      system: 'Energy',
      icon: 'flash',
      impact: 'Endurance drops sharply; rest is preferable to exertion.',
    },
  ],
  warning: [
    {
      system: 'Kidneys',
      icon: 'water',
      impact: 'Color in this range warrants a medical review, not just water.',
    },
    {
      system: 'Skin',
      icon: 'sparkles',
      impact: 'Pallor, jaundice, or unusual discoloration may co-occur.',
    },
    {
      system: 'Brain',
      icon: 'bulb',
      impact: 'Confusion, weakness, or dizziness should not be ignored.',
    },
    {
      system: 'Energy',
      icon: 'flash',
      impact: 'Stop strenuous activity until you have spoken with a clinician.',
    },
  ],
};

const ELECTROLYTE_CUES: Record<HydrationLevel, string> = {
  overhydrated:
    'Pause plain water for 1–2 hours. A pinch of salt with food helps restore sodium balance.',
  optimal:
    'Maintain mineral balance. A normal meal with vegetables and fruit covers your needs today.',
  mild:
    'Plain water is enough. If you have been sweating, add a banana or coconut water for potassium.',
  moderate:
    'Pair water with electrolytes. Examples: ORS sachet, coconut water, dal, banana, lightly salted curd.',
  severe:
    'Use ORS or a glucose-electrolyte mix in addition to water. Avoid sugary sodas — they slow recovery.',
  warning:
    'Do not self-treat with high-dose salts. A clinician can advise the right rehydration approach for this level.',
};

const LIFESTYLE_NUDGES: Record<HydrationLevel, string[]> = {
  overhydrated: [
    'Drink to thirst rather than to a fixed schedule today.',
    'If you supplement electrolytes, check sodium content and timing.',
    'Re-scan after your next meal to confirm the swing back to optimal.',
  ],
  optimal: [
    'Front-load water in the first half of the day so evenings are restful.',
    'Carry a small bottle if you travel between meetings or rooms.',
    'Re-scan after exercise or in hot weather to spot changes early.',
  ],
  mild: [
    'Set a 30-minute timer to sip water now, then re-check.',
    'Cut back caffeine until your next scan returns to the green zone.',
    'Pair drinks with meals to make the habit stick without thinking.',
  ],
  moderate: [
    'Drink 500–750 ml of water steadily over the next hour.',
    'Take a 5-minute break in shade or air-conditioning if you can.',
    'Avoid alcohol and sugary drinks until your scan returns to mild or better.',
  ],
  severe: [
    'Stop strenuous activity now. Sit, cool down, and rehydrate.',
    'Use ORS or a glucose-electrolyte mix alongside water.',
    'If symptoms persist beyond 60 minutes, contact a clinician.',
  ],
  warning: [
    'Do not exercise until you have been seen by a healthcare professional.',
    'Note any pain, recent injury, medications, or supplements.',
    'Bring this report and your recent scan history with you to the appointment.',
  ],
};

function buildRecoveryPlan(level: HydrationLevel): RecoveryStep[] {
  switch (level) {
    case 'overhydrated':
      return [
        { whenLabel: 'Now', text: 'Pause plain water. A handful of salty snack is fine if you sweat.' },
        { whenLabel: '+45 min', text: 'Re-check thirst. Sip only if genuinely thirsty.' },
        { whenLabel: '+2 hours', text: 'Resume normal intake; re-scan before your next meal.' },
        { whenLabel: 'Tonight', text: 'Stop water 90 minutes before sleep to rest the kidneys.' },
      ];
    case 'optimal':
      return [
        { whenLabel: 'Now', text: 'Maintain your current pace. No urgent action needed.' },
        { whenLabel: '+2 hours', text: 'Sip 200–300 ml during your next break.' },
        { whenLabel: 'After exertion', text: 'Top up with water + a small snack with electrolytes.' },
        { whenLabel: 'Tomorrow', text: 'Re-scan in the morning to confirm overnight balance.' },
      ];
    case 'mild':
      return [
        { whenLabel: 'Now', text: 'Drink 250–350 ml of water slowly.' },
        { whenLabel: '+30 min', text: 'A cup of unsweetened tea or coconut water.' },
        { whenLabel: '+90 min', text: 'Re-scan. Aim for the optimal window.' },
        { whenLabel: 'Rest of day', text: 'Sip every 60–90 minutes; avoid heavy caffeine.' },
      ];
    case 'moderate':
      return [
        { whenLabel: 'Now', text: 'Drink 500 ml of water. Add a pinch of salt or ORS if available.' },
        { whenLabel: '+30 min', text: 'A second 250 ml glass with a small snack.' },
        { whenLabel: '+60 min', text: 'Move to shade or AC. Re-scan to confirm a step up.' },
        { whenLabel: 'Next 4 hours', text: 'Aim for 1.5 L total water with electrolytes through meals.' },
      ];
    case 'severe':
      return [
        { whenLabel: 'Now', text: 'Sit down. Begin ORS or electrolyte mix immediately.' },
        { whenLabel: '+15 min', text: '250 ml plain water alongside the ORS.' },
        { whenLabel: '+30 min', text: 'Light salted snack — biscuit, lightly salted curd.' },
        { whenLabel: '+60 min', text: 'Re-scan. If still in this range, contact a clinician.' },
      ];
    case 'warning':
      return [
        { whenLabel: 'Now', text: 'Stop strenuous activity. Rest in a cool space.' },
        { whenLabel: 'Within 15 min', text: 'Contact a healthcare professional or urgent care.' },
        { whenLabel: 'While you wait', text: 'Sip water steadily. Avoid self-medicating.' },
        { whenLabel: 'Bring with you', text: 'A note of symptoms, medications, and recent scans.' },
      ];
  }
}

function build7DayPattern(scans: Scan[], avg: number): string {
  if (scans.length === 0) {
    return 'This is your first logged scan. Keep scanning to unlock 7-day insights.';
  }
  if (scans.length < 3) {
    return `You have ${scans.length} scan${
      scans.length === 1 ? '' : 's'
    } this week so far. Two more and your pattern card will sharpen.`;
  }
  const lowDays = scans.filter((s) => s.score < 60).length;
  const morningScans = scans.filter((s) => {
    const h = new Date(s.timestamp).getHours();
    return h >= 5 && h < 12;
  });
  const morningLow = morningScans.filter((s) => s.score < 60).length;
  const morningWeak =
    morningScans.length >= 2 && morningLow / morningScans.length >= 0.5;

  const lines: string[] = [];
  lines.push(`Your 7-day average is ${avg}.`);
  if (lowDays >= 1) {
    lines.push(
      `You scored below 60 on ${lowDays} of the last ${scans.length} scans.`,
    );
  } else {
    lines.push('Every scan in the last week has stayed above 60 — strong consistency.');
  }
  if (morningWeak) {
    lines.push('Mornings look like your weakest window — try a glass of water with breakfast.');
  }
  return lines.join(' ');
}

function buildSpark(scans: Scan[]): SparkPoint[] {
  return scans.slice(-7).map((s) => ({
    date: s.timestamp,
    score: s.score,
  }));
}

function appVersion(): string {
  return Constants.expoConfig?.version ?? '1.0.0';
}

export interface BuildReportInput {
  scan: Scan;
  weekScans: Scan[];
  averageScore: number;
}

export function buildDetailedReport(input: BuildReportInput): DetailedReportData {
  const { scan, weekScans, averageScore } = input;
  const data = HYDRATION_DATA[scan.color];
  const swatch = COLOR_SWATCHES.find((c) => c.id === scan.color);

  const shouldAddDoctorChecklist =
    data.shouldSeeDoctor || (averageScore > 0 && averageScore < 30);

  return {
    reportId: scan.reportId,
    scanId: scan.id,
    generatedAt: format(new Date(), "EEEE, MMM d, yyyy 'at' h:mm a"),
    color: scan.color,
    colorHex: data.colorHex,
    colorLabel: swatch?.label ?? scan.color,
    level: scan.level,
    levelColor: getLevelColor(scan.level),
    levelIndex: getLevelIndex(scan.level),
    levelTotal: LEVEL_TOTAL,
    score: scan.score,
    title: data.title,
    message: data.message,
    waterAdvice: data.waterAdvice,
    shouldSeeDoctor: data.shouldSeeDoctor,
    actionSteps: data.actionSteps,
    sevenDayAverage: averageScore,
    sevenDayPattern: build7DayPattern(weekScans, averageScore),
    spark: buildSpark(weekScans),
    recoveryPlan: buildRecoveryPlan(scan.level),
    bodyImpact: BODY_IMPACT_TABLE[scan.level],
    electrolyteCue: ELECTROLYTE_CUES[scan.level],
    lifestyleNudges: LIFESTYLE_NUDGES[scan.level],
    doctorChecklist: shouldAddDoctorChecklist
      ? [
          'Bring this report (or its report ID).',
          'List any pain, fatigue, fever, or recent injury.',
          'List medications and supplements taken in the last 7 days.',
          'Note your recent water intake and any unusual sweating.',
        ]
      : null,
    appVersion: appVersion(),
  };
}
