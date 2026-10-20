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
  HydrationColor,
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
      impact: 'Filtering more fluid than necessary; sodium can drop if excess intake persists, risking hyponatremia.',
    },
    {
      system: 'Skin',
      icon: 'sparkles',
      impact: 'Usually fine, but persistent overhydration dilutes electrolytes that support tissue repair.',
    },
    {
      system: 'Brain',
      icon: 'bulb',
      impact: 'Low blood sodium (hyponatremia) from over-drinking can cause headache, nausea, confusion, and — in severe cases — seizures.',
    },
    {
      system: 'Energy',
      icon: 'flash',
      impact: 'Frequent urination and electrolyte imbalance can disrupt sleep and focus.',
    },
  ],
  optimal: [
    {
      system: 'Kidneys',
      icon: 'water',
      impact: 'Operating at a comfortable pace — efficient filtration with no conservation stress.',
    },
    {
      system: 'Skin',
      icon: 'sparkles',
      impact: 'Best window for elasticity, natural glow, and a clearer complexion.',
    },
    {
      system: 'Brain',
      icon: 'bulb',
      impact: 'Concentration, short-term memory, and reaction time tend to peak at this hydration level.',
    },
    {
      system: 'Energy',
      icon: 'flash',
      impact: 'Energy is steady; thermoregulation and cardiovascular output work efficiently.',
    },
  ],
  mild: [
    {
      system: 'Kidneys',
      icon: 'water',
      impact: 'Concentrating urine slightly to conserve water — manageable with a glass or two.',
    },
    {
      system: 'Skin',
      icon: 'sparkles',
      impact: 'Minor loss of suppleness; lips may feel drier than usual.',
    },
    {
      system: 'Brain',
      icon: 'bulb',
      impact: 'Light fatigue and small dips in focus or mood can begin even at 1–2% dehydration.',
    },
    {
      system: 'Energy',
      icon: 'flash',
      impact: 'You may feel a small afternoon slump if you wait too long to rehydrate.',
    },
  ],
  moderate: [
    {
      system: 'Kidneys',
      icon: 'water',
      impact: 'Working significantly harder to retain fluid; urine output drops noticeably.',
    },
    {
      system: 'Skin',
      icon: 'sparkles',
      impact: 'Reduced elasticity; skin tenting may appear; under-eye circles and dry lips worsen.',
    },
    {
      system: 'Brain',
      icon: 'bulb',
      impact: 'Headache risk is elevated; reaction time slows; decision-making may be impaired.',
    },
    {
      system: 'Energy',
      icon: 'flash',
      impact: 'Heart rate rises to compensate for reduced blood volume; workouts feel significantly harder.',
    },
  ],
  severe: [
    {
      system: 'Kidneys',
      icon: 'water',
      impact: 'Stress mode — aggressively conserving water and electrolytes; reduced urine output is a warning sign.',
    },
    {
      system: 'Skin',
      icon: 'sparkles',
      impact: 'Skin tents on pinch test; warmth and pronounced dryness are common; lips may crack.',
    },
    {
      system: 'Brain',
      icon: 'bulb',
      impact: 'Headache, dizziness, and irritability are typical; cognitive function is clearly impaired.',
    },
    {
      system: 'Energy',
      icon: 'flash',
      impact: 'Endurance drops sharply — 5–8% fluid loss can impair physical performance by up to 30%; rest is essential.',
    },
  ],
  warning: [
    {
      system: 'Kidneys',
      icon: 'water',
      impact: 'Color in this range is a medical signal — not just dehydration. Kidney function may be directly affected.',
    },
    {
      system: 'Skin',
      icon: 'sparkles',
      impact: 'Pallor, jaundice, or unusual discoloration of skin or the whites of the eyes may co-occur.',
    },
    {
      system: 'Brain',
      icon: 'bulb',
      impact: 'Confusion, weakness, or neurological symptoms alongside abnormal urine color are urgent warning signs.',
    },
    {
      system: 'Energy',
      icon: 'flash',
      impact: 'Stop all strenuous activity until you have been assessed by a healthcare professional.',
    },
  ],
};

const ELECTROLYTE_CUES: Record<HydrationLevel, string> = {
  overhydrated:
    'Pause plain water for 1–2 hours. A pinch of salt with food, or a small salty snack, helps restore sodium balance and prevents hyponatremia.',
  optimal:
    'Maintain mineral balance. A normal meal with vegetables, fruit, and a moderate protein source covers your electrolyte needs today.',
  mild:
    'Plain water is enough for mild dehydration. If you have been sweating, add a banana or a small cup of coconut water for potassium support.',
  moderate:
    'Pair water with electrolytes. Try an ORS sachet, coconut water, a banana, lightly salted yogurt or curd — these replace sodium and potassium lost through sweat.',
  severe:
    'Use an ORS (oral rehydration solution) or a glucose-electrolyte mix alongside water. Avoid sugary sodas and sports drinks high in sugar — they can slow recovery.',
  warning:
    'Do not self-treat with high-dose salt or electrolyte supplements. A clinician needs to assess the underlying cause before advising the right rehydration approach for your situation.',
};

const LIFESTYLE_NUDGES: Record<HydrationLevel, string[]> = {
  overhydrated: [
    'Drink to thirst rather than to a rigid schedule or daily quota.',
    'If you supplement electrolytes, check sodium content and meal timing.',
    'Re-scan after your next meal to confirm your urine has returned to the pale-yellow range.',
  ],
  optimal: [
    'Front-load water in the first half of the day so evenings are restful and uninterrupted by bathroom trips.',
    'Carry a small refillable bottle if you move between meetings, rooms, or outdoor spaces.',
    'Re-scan after exercise or in hot weather to spot changes before they become problems.',
  ],
  mild: [
    'Set a 30-minute reminder to sip water now, then re-check your color.',
    'Cut back caffeine until your next scan returns to the green zone.',
    'Pair drinking with regular activities — meals, meetings, commute — to build a habit without thinking about it.',
  ],
  moderate: [
    'Drink 500–750 ml of water steadily over the next 60 minutes.',
    'Take a 5-minute break in shade or air-conditioning if you have been in the heat.',
    'Avoid alcohol and sugary drinks until your scan returns to mild or better.',
  ],
  severe: [
    'Stop strenuous activity now. Sit down, cool down, and begin rehydrating immediately.',
    'Use ORS or a glucose-electrolyte mix alongside plain water.',
    'If symptoms (dizziness, rapid heart rate, confusion) persist beyond 60 minutes of rehydration, contact a clinician.',
  ],
  warning: [
    'Do not exercise until you have been assessed by a healthcare professional.',
    'Note any pain, recent injury, medications, and supplements to discuss with your doctor.',
    'Bring this report and your scan history to your appointment — the trend data is clinically useful.',
  ],
};

const COLOR_DOCTOR_CHECKLISTS: Record<HydrationColor, string[] | null> = {
  clear: [
    'Extreme thirst despite drinking large volumes (possible diabetes insipidus)',
    'Producing more than 3 liters of urine per day without obvious excess drinking',
    'Headache, nausea, confusion, or muscle cramps — signs of hyponatremia (low blood sodium)',
    'Clear urine persistently in a child — requires endocrine or pediatric evaluation',
    'Fever combined with consistently clear urine',
  ],
  'pale-yellow': null,
  'light-yellow': null,
  straw: null,
  yellow: null,
  'dark-yellow': [
    'Dark yellow urine persists all day despite drinking 2+ liters of water',
    'Accompanied by decreased urination frequency (fewer than 3 times per day)',
    'Persistent dark yellow in a person with diabetes — check blood glucose',
  ],
  honey: [
    'Honey-colored urine persists beyond 24 hours despite adequate fluid intake',
    'Accompanied by yellow skin or eyes (jaundice) — possible liver involvement',
    'Dizziness on standing (orthostatic hypotension from fluid depletion)',
    'Rapid heart rate or dry mucous membranes alongside this urine color',
    'Pregnant women with honey-colored urine — check for UTI or preeclampsia',
  ],
  amber: [
    'Amber color does not improve within 4–6 hours of aggressive hydration',
    'Accompanied by jaundice — yellowing of skin or whites of the eyes (scleral icterus)',
    'Pale or clay-colored stools with dark urine and jaundice: the classic liver/bile duct triad',
    'Right upper quadrant abdominal pain (liver or gallbladder)',
    'Fatigue, nausea, or loss of appetite alongside amber urine for more than a day',
  ],
  orange: [
    'Orange color is unexplained by diet or medications',
    'Accompanied by yellow skin or eyes (jaundice)',
    'Pale, gray, or clay-colored stools alongside orange urine',
    'Fever and severe abdominal pain — possible cholangitis (life-threatening)',
    'Itching skin (cholestasis) with orange urine',
    'Persists beyond 3–5 days without a dietary or medication explanation',
  ],
  'orange-red': [
    'No clear dietary (beets, rhubarb) or medication (rifampin, phenazopyridine) explanation for the color',
    'Flank, back, or abdominal pain',
    'Fever and chills — possible infected kidney stone or pyelonephritis',
    'Muscle pain or weakness after exercise or injury (rhabdomyolysis concern)',
    'Pallor, rapid heartbeat, or extreme fatigue (hemolytic anemia)',
    'Burning, frequency, or painful urination (UTI with hematuria)',
    'History of kidney stones presenting with recurrent pain',
  ],
  brown: [
    'Brown urine is unexplained by medications (metronidazole, nitrofurantoin, chloroquine)',
    'Yellow skin or eyes (jaundice) alongside brown urine',
    'Pale, gray, or clay-colored stools',
    'Muscle pain, weakness, or swelling after exercise or trauma — emergency rhabdomyolysis concern',
    'Right upper quadrant abdominal pain (liver or gallbladder)',
    'New-onset facial or ankle swelling with high blood pressure (glomerulonephritis)',
    'Urine that darkens further after sitting in sunlight (possible porphyria)',
  ],
  'dark-brown': [
    'Muscle pain, weakness, or dark swelling after exercise, injury, seizure, or heat stroke — go to ER immediately (rhabdomyolysis)',
    'Yellow skin or eyes + pale/clay stools + dark urine: the liver emergency triad — go to hospital today',
    'Facial or leg swelling + new hypertension + tea-colored urine (acute glomerulonephritis)',
    'Severe abdominal pain + neurological symptoms (confusion, tingling, weakness) + dark urine (acute porphyria)',
    'Reduced urine output alongside dark urine — possible kidney failure',
    'Fever and severe abdominal pain — possible cholangitis or sepsis — emergency',
    'Dark urine that darkens further on light exposure (porphyria)',
  ],
  red: [
    'No dietary (beets, berries) or medication (rifampin, phenazopyridine) explanation for the color',
    'Painless gross hematuria in any adult over 35 — always investigate for malignancy, even if it resolves',
    'Passing blood clots in urine — emergency',
    'Inability to urinate due to clot obstruction — emergency',
    'Hematuria accompanied by flank pain and fever (infected stone or pyelonephritis)',
    'Facial swelling, high blood pressure, and red-brown urine (acute glomerulonephritis)',
    'Hematuria after abdominal or back trauma — emergency',
    'Red urine on anticoagulant therapy (warfarin, rivaroxaban) — contact prescriber immediately',
    'Gross hematuria in a child — always investigate',
  ],
  pink: [
    'Pink urine persists more than 24–48 hours without a dietary cause',
    'Accompanied by pain, burning, or urinary frequency (UTI or kidney stone)',
    'Any person over 40 with unexplained pink urine — rule out bladder cancer',
    'Cyclic pink urine coinciding with menstruation (bladder endometriosis)',
    'Leg or ankle swelling alongside pink urine (kidney disease)',
    'Pink urine in pregnancy — same-day evaluation for UTI or preeclampsia',
    'Pink urine in a child — always investigate',
  ],
  cloudy: [
    'Cloudy urine persists beyond 24–48 hours despite increased hydration',
    'Fever and chills with cloudy urine — possible kidney infection (pyelonephritis) or sepsis',
    'Severe flank or back pain with cloudy urine — kidney infection or kidney stone',
    'Foamy or frothy urine that does not resolve — persistent proteinuria (kidney disease screen)',
    'Milky white urine — chyluria (lymphatic disease or parasitic infection)',
    'Cloudy urine during pregnancy — same-day evaluation for UTI and preeclampsia',
    'Recurrent cloudy urine — recurrent UTI, kidney stones, or anatomical issue',
    'Gas-like bubbles and foul odor — enterovesical fistula (Crohn\'s disease or diverticulitis)',
    'Leg or ankle swelling with cloudy urine — nephrotic syndrome',
  ],
  green: [
    'Green urine with no medication (propofol, amitriptyline, indomethacin, methylene blue) or dietary explanation',
    'Green urine in a catheterized patient or ICU patient — evaluate for Pseudomonas aeruginosa UTI',
    'Accompanied by fever, burning urination, or urinary frequency — urgent Pseudomonas infection screen',
    'Yellow skin or eyes (jaundice) alongside green urine — obstructive jaundice with biliverdin excretion',
    'Persists more than 24–48 hours after stopping any suspected medication or food',
    'Abdominal pain alongside unexplained green urine',
  ],
};

function buildRecoveryPlan(level: HydrationLevel): RecoveryStep[] {
  switch (level) {
    case 'overhydrated':
      return [
        { whenLabel: 'Now', text: 'Pause plain water. A small salty snack is fine if you have been sweating — it restores electrolytes.' },
        { whenLabel: '+45 min', text: 'Re-check thirst. Sip only if genuinely thirsty — trust your body\'s signal.' },
        { whenLabel: '+2 hours', text: 'Resume normal intake; re-scan before your next meal to confirm balance.' },
        { whenLabel: 'Tonight', text: 'Stop drinking 90 minutes before sleep to let the kidneys rest overnight.' },
      ];
    case 'optimal':
      return [
        { whenLabel: 'Now', text: 'Maintain your current pace. No urgent action needed — you are in the ideal zone.' },
        { whenLabel: '+2 hours', text: 'Sip 200–300 ml during your next natural break (meal, commute, meeting).' },
        { whenLabel: 'After exertion', text: 'Top up with water plus a small snack containing potassium or sodium to replenish sweat losses.' },
        { whenLabel: 'Tomorrow', text: 'Re-scan in the morning to confirm your overnight balance is maintained.' },
      ];
    case 'mild':
      return [
        { whenLabel: 'Now', text: 'Drink 250–350 ml of water slowly over the next 15 minutes.' },
        { whenLabel: '+30 min', text: 'A cup of unsweetened herbal tea or coconut water adds variety and mild electrolytes.' },
        { whenLabel: '+90 min', text: 'Re-scan. Aim for the pale-yellow to light-yellow optimal window.' },
        { whenLabel: 'Rest of day', text: 'Sip every 60–90 minutes; reduce caffeine intake until your color normalizes.' },
      ];
    case 'moderate':
      return [
        { whenLabel: 'Now', text: 'Drink 500 ml of water. Add a pinch of salt or an ORS sachet if you have been sweating.' },
        { whenLabel: '+30 min', text: 'A second 250 ml glass with a light snack (banana, yogurt, lightly salted crackers).' },
        { whenLabel: '+60 min', text: 'Move to shade or air-conditioning. Re-scan to confirm a step up toward optimal.' },
        { whenLabel: 'Next 4 hours', text: 'Aim for 1.5 L total water with electrolytes spread across meals and snacks.' },
      ];
    case 'severe':
      return [
        { whenLabel: 'Now', text: 'Sit down. Begin ORS or an electrolyte mix immediately — do not wait.' },
        { whenLabel: '+15 min', text: '250 ml plain water alongside the ORS to dilute it slightly and aid absorption.' },
        { whenLabel: '+30 min', text: 'Light salted snack — a few crackers, lightly salted curd, or banana.' },
        { whenLabel: '+60 min', text: 'Re-scan. If still in the severe or warning range, contact a clinician immediately.' },
      ];
    case 'warning':
      return [
        { whenLabel: 'Now', text: 'Stop all strenuous activity. Rest in a cool, quiet space.' },
        { whenLabel: 'Within 15 min', text: 'Contact a healthcare professional or urgent care. Do not self-diagnose.' },
        { whenLabel: 'While you wait', text: 'Sip water steadily — small sips only. Do not force large volumes.' },
        { whenLabel: 'Bring with you', text: 'A note of all symptoms, all medications, recent physical activities, and this report.' },
      ];
  }
}

function build7DayPattern(scans: Scan[], avg: number): string {
  if (scans.length === 0) {
    return 'This is your first logged scan. Keep scanning daily to unlock 7-day insights and trend analysis.';
  }
  if (scans.length < 3) {
    return `You have ${scans.length} scan${
      scans.length === 1 ? '' : 's'
    } this week so far. Two more and your pattern card will sharpen into a meaningful trend.`;
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
  lines.push(`Your 7-day average is ${avg}/100.`);
  if (lowDays >= 1) {
    lines.push(
      `You scored below 60 on ${lowDays} of the last ${scans.length} scans — consider increasing your morning water intake.`,
    );
  } else {
    lines.push('Every scan in the last week has stayed above 60 — excellent consistency.');
  }
  if (morningWeak) {
    lines.push('Mornings appear to be your weakest window — try a full glass of water before breakfast and before coffee.');
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

  const colorChecklist = COLOR_DOCTOR_CHECKLISTS[scan.color];
  const shouldAddDoctorChecklist =
    colorChecklist !== null &&
    (data.shouldSeeDoctor || colorChecklist.length > 0 || averageScore < 30);

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
    causes: data.causes,
    sevenDayAverage: averageScore,
    sevenDayPattern: build7DayPattern(weekScans, averageScore),
    spark: buildSpark(weekScans),
    recoveryPlan: buildRecoveryPlan(scan.level),
    bodyImpact: BODY_IMPACT_TABLE[scan.level],
    electrolyteCue: ELECTROLYTE_CUES[scan.level],
    lifestyleNudges: LIFESTYLE_NUDGES[scan.level],
    doctorChecklist: shouldAddDoctorChecklist ? colorChecklist : null,
    appVersion: appVersion(),
  };
}
