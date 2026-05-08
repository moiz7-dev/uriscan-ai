import type { HydrationColor, HydrationResult } from '@/types';

export interface ColorSwatch {
  id: HydrationColor;
  label: string;
  hex: string;
}

export const COLOR_SWATCHES: ColorSwatch[] = [
  { id: 'clear', label: 'Clear', hex: '#F0F9FF' },
  { id: 'light-yellow', label: 'Light Yellow', hex: '#FEF9C3' },
  { id: 'yellow', label: 'Yellow', hex: '#FDE047' },
  { id: 'dark-yellow', label: 'Dark Yellow', hex: '#CA8A04' },
  { id: 'amber', label: 'Amber', hex: '#B45309' },
  { id: 'orange', label: 'Orange', hex: '#C2410C' },
  { id: 'brown', label: 'Brown', hex: '#78350F' },
  { id: 'red', label: 'Red', hex: '#991B1B' },
];

type HydrationDataEntry = Omit<HydrationResult, 'color'>;

export const HYDRATION_DATA: Record<HydrationColor, HydrationDataEntry> = {
  clear: {
    level: 'overhydrated',
    score: 90,
    title: 'Overhydrated',
    message: "Your urine is very clear, suggesting you may be drinking more water than your body needs.",
    action: "You're drinking more than needed",
    waterAdvice: 'Slow down on water for now',
    colorHex: '#F0F9FF',
    shouldSeeDoctor: false,
    actionSteps: [
      'Pause water intake for the next 1–2 hours',
      'Add electrolytes if you sweat heavily',
      'Resume normal sips when thirst returns',
    ],
  },
  'light-yellow': {
    level: 'optimal',
    score: 100,
    title: 'Perfect Hydration',
    message: 'Your hydration looks ideal. Keep doing what you are doing.',
    action: "Perfect hydration!",
    waterAdvice: 'Maintain your current intake',
    colorHex: '#FEF9C3',
    shouldSeeDoctor: false,
    actionSteps: [
      'Continue drinking at your usual pace',
      'Re-check after exercise or hot weather',
      'Log this scan to keep your streak alive',
    ],
  },
  yellow: {
    level: 'mild',
    score: 75,
    title: 'Mild Dehydration',
    message: 'A small drop in hydration. Easy to fix with a glass or two.',
    action: 'Drink 1–2 glasses soon',
    waterAdvice: 'Drink 1–2 glasses soon',
    colorHex: '#FDE047',
    shouldSeeDoctor: false,
    actionSteps: [
      'Sip 250–500 ml of water in the next 30 minutes',
      'Take a short break from caffeine',
      'Re-scan in about an hour',
    ],
  },
  'dark-yellow': {
    level: 'moderate',
    score: 50,
    title: 'Moderate Dehydration',
    message: 'You are noticeably dehydrated. Time to refill.',
    action: 'Drink 2–3 glasses now',
    waterAdvice: 'Drink 2–3 glasses now',
    colorHex: '#CA8A04',
    shouldSeeDoctor: false,
    actionSteps: [
      'Drink 500–750 ml of water now',
      'Avoid sugary drinks until you re-hydrate',
      'Move to a cool spot if you have been in the heat',
    ],
  },
  amber: {
    level: 'severe',
    score: 25,
    title: 'Severe Dehydration',
    message: 'Your body is asking for water — please rehydrate immediately.',
    action: 'Drink water immediately',
    waterAdvice: 'Drink water immediately',
    colorHex: '#B45309',
    shouldSeeDoctor: false,
    actionSteps: [
      'Drink 750 ml–1 L of water within 30 minutes',
      'Add an electrolyte mix if available',
      'Rest and avoid strenuous activity',
    ],
  },
  orange: {
    level: 'severe',
    score: 15,
    title: 'Urgent: Rehydrate Now',
    message: 'Your hydration is very low. Stop and rehydrate before doing anything else.',
    action: 'Urgent: rehydrate now',
    waterAdvice: 'Urgent: drink water now',
    colorHex: '#C2410C',
    shouldSeeDoctor: false,
    actionSteps: [
      'Drink 1 L of water and electrolytes within the hour',
      'Stop any exercise or heat exposure',
      'If you feel dizzy or unwell, contact a clinician',
    ],
  },
  brown: {
    level: 'warning',
    score: 5,
    title: 'Consult a Doctor',
    message: 'Brown urine can indicate underlying issues. Please consult a healthcare professional.',
    action: 'Consult a doctor',
    waterAdvice: 'Drink water and seek medical advice',
    colorHex: '#78350F',
    shouldSeeDoctor: true,
    actionSteps: [
      'Drink water steadily while seeking advice',
      'Note any other symptoms (pain, fatigue, fever)',
      'Contact a healthcare professional today',
    ],
  },
  red: {
    level: 'warning',
    score: 0,
    title: 'Seek Medical Attention',
    message: 'Red urine may indicate a serious condition. Please seek medical attention.',
    action: 'Seek medical attention',
    waterAdvice: 'Seek medical attention',
    colorHex: '#991B1B',
    shouldSeeDoctor: true,
    actionSteps: [
      'Stop strenuous activity immediately',
      'Contact a healthcare professional or urgent care now',
      'Note any pain, recent injury, or new medications',
    ],
  },
};

export function getLevelColor(level: HydrationResult['level']): string {
  switch (level) {
    case 'optimal':
      return '#10B981';
    case 'overhydrated':
      return '#06B6D4';
    case 'mild':
      return '#FDE047';
    case 'moderate':
      return '#F59E0B';
    case 'severe':
      return '#EF4444';
    case 'warning':
      return '#7F1D1D';
  }
}
