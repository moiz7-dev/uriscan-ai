export const Colors = {
  primary: '#2563EB',
  primaryLight: '#DBEAFE',
  accent: '#FCD34D',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#1E293B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
} as const;

export type ColorKey = keyof typeof Colors;
